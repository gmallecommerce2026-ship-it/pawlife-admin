// src/store/useChatStore.ts
import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { apiClient } from '@/lib/api/ApiClient';

// ... (Các constants và interface giữ nguyên) ...
const AI_ID = 'AI_ASSISTANT';
const AI_PARTNER = {
  id: 'AI_ASSISTANT', 
  name: 'Trợ lý AI',
  avatar: '/assets/icons/ai-bot.png',
  isOnline: true,
  role: 'BOT'
};

export interface Message {
  id: string;
  senderId: string;
  content: string | any;
  type: 'TEXT' | 'IMAGE' | 'PRODUCT';
  options?: string[];
  createdAt: string;
  isRead?: boolean;
}

export interface Conversation {
  id: string;
  partner: { id: string; name: string; avatar?: string; role?: string };
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;
  isOpen: boolean;
  isMinimized: boolean;
  isTyping: boolean;

  // Actions (Đã bỏ connectSocket/disconnectSocket)
  loadConversations: () => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  selectConversation: (conversationId: string) => void;
  sendMessage: (content: string, type?: 'TEXT' | 'IMAGE' | 'PRODUCT', metadata?: any) => Promise<void>;
  toggleChat: () => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({  
  conversations: [],
  activeConversationId: null,
  messages: {},
  isOpen: false,
  isMinimized: true,
  isTyping: false,

  // Xóa connectSocket, disconnectSocket

  reset: () => set({ conversations: [], activeConversationId: null, messages: {}, isOpen: false }),
  
  toggleChat: () => set(state => {
      // Nếu mở lên mà chưa có hội thoại nào -> Tự động load AI chat
      if (!state.isOpen && !state.activeConversationId) {
          get().selectConversation(AI_ID);
      }
      return { isOpen: !state.isOpen, isMinimized: false };
  }),

  loadConversations: async () => {
    try {
        const res = await apiClient.get('/chat/conversations').catch(() => []);
        // ... (Logic map data giữ nguyên)
        // Nếu API lỗi (do Guest), tự tạo hội thoại ảo với AI
        const aiConversation = {
            id: AI_ID,
            partner: { id: AI_ID, name: 'Trợ lý AI', avatar: '/assets/icons/ai-bot.png', role: 'BOT' },
            lastMessage: 'Sẵn sàng hỗ trợ!',
            lastMessageAt: new Date().toISOString(),
            unreadCount: 0
        };
        set({ conversations: [aiConversation, ...(Array.isArray(res) ? res : [])] });
    } catch (e) {
        // Fallback cho Guest
        set({ conversations: [{
            id: AI_ID,
            partner: { id: AI_ID, name: 'Trợ lý AI', role: 'BOT' },
            lastMessage: 'Chào bạn!',
            lastMessageAt: new Date().toISOString(),
            unreadCount: 0
        }] });
    }
  },

  loadMessages: async (conversationId) => {
    if (conversationId === AI_ID) {
        // Với AI, nếu chưa có tin nhắn nào thì init Welcome msg
        const current = get().messages[AI_ID] || [];
        if (current.length === 0) {
            set(state => ({
                messages: {
                    ...state.messages,
                    [AI_ID]: [{
                        id: 'welcome', senderId: AI_ID,
                        content: 'Xin chào! Bạn cần tìm quà gì hôm nay? 🎁',
                        type: 'TEXT', createdAt: new Date().toISOString(),
                        options: ['Sinh nhật', 'Kỷ niệm', 'Tặng người yêu']
                    }]
                }
            }));
        }
        return;
    }
    // Logic load tin nhắn thường từ API
    try {
        const res = await apiClient.get(`/chat/messages/${conversationId}`);
        if (res) set(state => ({ messages: { ...state.messages, [conversationId]: res.reverse() } }));
    } catch (e) {}
  },

  selectConversation: (id) => {
    set({ activeConversationId: id });
    get().loadMessages(id);
  },

  // --- HÀM GỬI TIN NHẮN (API VERSION) ---
  sendMessage: async (content, type = 'TEXT', metadata) => {
    const { activeConversationId, messages } = get();
    const receiverId = activeConversationId === AI_ID ? AI_ID : activeConversationId; // Logic đơn giản hoá

    // 1. Optimistic Update (Hiển thị tin nhắn của mình ngay lập tức)
    const tempId = Date.now().toString();
    const myMsg: Message = {
        id: tempId, senderId: 'ME', content, type, createdAt: new Date().toISOString()
    };

    set(state => ({
        messages: {
            ...state.messages,
            [activeConversationId!]: [...(state.messages[activeConversationId!] || []), myMsg]
        },
        isTyping: true // Bật trạng thái AI đang gõ
    }));

    try {
        // 2. Chuẩn bị payload
        // Nếu là Guest (activeConversationId == AI_ID), gửi kèm lịch sử chat ngắn để AI hiểu ngữ cảnh
        const history = activeConversationId === AI_ID 
            ? messages[AI_ID]?.slice(-6).map(m => ({ 
                role: m.senderId === 'ME' ? 'user' : 'assistant', 
                content: typeof m.content === 'string' ? m.content : '' 
              })) 
            : [];

        // 3. Gọi API
        const res = await apiClient.post('/chat/send', {
            receiverId,
            content,
            type,
            history: history, // Gửi kèm history nếu là guest
            ...metadata
        });

        // 4. Cập nhật phản hồi từ Server
        if (res && res.aiMessage) {
            const aiMsg: Message = {
                id: res.aiMessage.id || Date.now().toString(),
                senderId: res.aiMessage.senderId,
                content: res.aiMessage.content,
                type: res.aiMessage.type as any,
                options: res.aiMessage.options, // Nhận options từ AI
                createdAt: new Date().toISOString()
            };

            set(state => ({
                messages: {
                    ...state.messages,
                    [activeConversationId!]: [...(state.messages[activeConversationId!] || []), aiMsg]
                }
            }));
            
            // Nếu có Product suggestions
            if (res.aiMessage.products && res.aiMessage.products.length > 0) {
                 // Xử lý hiển thị sản phẩm (nếu cần tách riêng message)
            }
        }

    } catch (error) {
        console.error("Gửi tin nhắn lỗi:", error);
        // Thêm tin nhắn lỗi vào UI
        const errorMsg: Message = {
             id: 'err_' + Date.now(), senderId: AI_ID,
             content: 'Hệ thống đang bận, vui lòng thử lại sau.', type: 'TEXT', createdAt: new Date().toISOString()
        };
        set(state => ({
            messages: { ...state.messages, [activeConversationId!]: [...(state.messages[activeConversationId!] || []), errorMsg] }
        }));
    } finally {
        set({ isTyping: false });
    }
  },
}));