import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface UserInfo {
  name: string;
  phone: string;
  email?: string;
  address: string;
  relation?: string; 
  message?: string;  
}

interface CheckoutState {
  // Data
  buyerInfo: UserInfo;
  senderInfo: UserInfo;
  receiverInfo: UserInfo;
  selectedVoucherId: string | null; // <--- 1. THÊM STATE

  // Actions
  setBuyerInfo: (info: UserInfo) => void;
  setSenderInfo: (info: UserInfo) => void;
  setReceiverInfo: (info: UserInfo) => void;
  setSelectedVoucher: (id: string | null) => void; // <--- 2. THÊM ACTION
}

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set) => ({
      // Giá trị mặc định
      buyerInfo: {
        name: "",
        phone: "",
        address: "",
      },
      senderInfo: {
        name: "Nguyễn Văn B", 
        relation: "Người tặng",
        phone: "0987654321",
        address: "Hà Nội, Việt Nam",
      },
      receiverInfo: {
        name: "Nguyễn Văn A", 
        relation: "Bạn bè",
        phone: "0123456789",
        email: "example@gmail.com",
        address: "TP. Hồ Chí Minh",
        message: "Chúc mừng sinh nhật nhé!",
      },
      selectedVoucherId: null, // <--- 3. KHỞI TẠO

      setBuyerInfo: (info) => set({ buyerInfo: info }),
      setSenderInfo: (info) => set({ senderInfo: info }),
      setReceiverInfo: (info) => set({ receiverInfo: info }),
      setSelectedVoucher: (id) => set({ selectedVoucherId: id }), // <--- 4. IMPLEMENTATION
    }),
    {
      name: 'lovegifts-checkout-storage', 
      storage: createJSONStorage(() => localStorage),
      skipHydration: true, 
    }
  )
);