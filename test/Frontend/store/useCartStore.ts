// src/store/useCartStore.ts
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { apiClient } from '@/lib/api/ApiClient';
import { CartItem } from '@/types/cart';
import { toast } from 'react-hot-toast';

// --- Debounce Map ---
const debounceMap = new Map<string, NodeJS.Timeout>();

// --- Types ---
interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  isLoading: boolean;
}

interface CartActions {
  fetchCart: () => Promise<void>;
  addToCart: (product: any, quantity: number) => Promise<void>;
  updateQuantity: (itemId: string, newQuantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => void;
}

// --- Helper ---
const calculateSummary = (items: CartItem[]) => {
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  return { totalItems, totalPrice };
};

// --- Store ---
const useCartStoreBase = create<CartState & CartActions>((set, get) => ({
  items: [],
  totalItems: 0,
  totalPrice: 0,
  isLoading: false,

  fetchCart: async () => {
    try {
      const res = await apiClient.get('/store/cart');
      if (res && res.items) {
        set({ items: res.items, ...calculateSummary(res.items) });
      }
    } catch (error) {
      console.error("Fetch cart error:", error);
    }
  },

  addToCart: async (product, quantity) => {
    const prevItems = get().items;
    const tempId = `temp-${product.id}-${Date.now()}`;
    const existingItemIndex = prevItems.findIndex(i => i.productId === product.id);
    let newItems = [...prevItems];

    if (existingItemIndex > -1) {
      newItems[existingItemIndex] = {
        ...newItems[existingItemIndex],
        quantity: newItems[existingItemIndex].quantity + quantity
      };
    } else {
      const newItem: CartItem = {
        id: tempId,
        productId: product.id,
        title: product.title,
        imageUrl: product.imageUrl,
        price: typeof product.price === 'string' 
          ? parseFloat(product.price.replace(/\./g, '').replace(/[^\d]/g, '')) 
          : product.price,
        quantity: quantity,
        stock: product.stockRemaining || 999,
        color: product.color || 'Default',
        size: product.size || 'F'
      };
      newItems.push(newItem);
    }

    set({ items: newItems, ...calculateSummary(newItems) });
    toast.success("Đã thêm vào giỏ hàng!");

    try {
      const res = await apiClient.post('/store/cart', {
        productId: product.id,
        quantity: quantity,
      });

      if (res && res.id) { 
         const currentItems = get().items;
         const fixedItems = currentItems.map(item => 
            item.id === tempId ? { ...item, id: res.id } : item
         );
         set({ items: fixedItems });
      } else {
         get().fetchCart();
      }
    } catch (error) {
      set({ items: prevItems, ...calculateSummary(prevItems) });
      toast.error("Lỗi kết nối, đã hoàn tác giỏ hàng.");
    }
  },

  updateQuantity: async (itemId, newQuantity) => {
    if (newQuantity < 1) return;

    const prevItems = get().items;
    const newItems = prevItems.map(item => 
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    
    set({ items: newItems, ...calculateSummary(newItems) });

    if (debounceMap.has(itemId)) {
      clearTimeout(debounceMap.get(itemId));
    }

    const timeoutId = setTimeout(async () => {
      try {
        const item = newItems.find(i => i.id === itemId);
        if (!item) return;
        await apiClient.patch(`/store/cart/${item.productId}`, { quantity: newQuantity });
        debounceMap.delete(itemId);
      } catch (error) {
        console.error("Update quantity failed:", error);
        get().fetchCart(); 
        toast.error("Không thể cập nhật số lượng.");
      }
    }, 500);

    debounceMap.set(itemId, timeoutId);
  },

  removeItem: async (itemId) => {
    const prevItems = get().items;
    const newItems = prevItems.filter(item => item.id !== itemId);
    set({ items: newItems, ...calculateSummary(newItems) });

    if (debounceMap.has(itemId)) {
      clearTimeout(debounceMap.get(itemId));
      debounceMap.delete(itemId);
    }

    try {
      const item = prevItems.find(i => i.id === itemId);
      if (!item) return;
      await apiClient.delete(`/store/cart/${item.productId}`);
    } catch (error) {
      set({ items: prevItems, ...calculateSummary(prevItems) });
      toast.error("Xóa thất bại.");
    }
  },

  clearCart: () => set({ items: [], totalItems: 0, totalPrice: 0 }),
}));

// --- EXPORT SELECTORS ---

// [FIXED HERE]
export const useCartActions = () => useCartStoreBase(
  useShallow((state) => ({
    fetchCart: state.fetchCart,
    addToCart: state.addToCart,
    updateQuantity: state.updateQuantity,
    removeItem: state.removeItem,
    clearCart: state.clearCart
  }))
);

export const useCartItems = () => useCartStoreBase(
  useShallow((state) => state.items)
);

export const useCartSummary = () => useCartStoreBase(
  useShallow((state) => ({
    totalItems: state.totalItems,
    totalPrice: state.totalPrice,
    isLoading: state.isLoading
  }))
);

export const useCartStore = useCartStoreBase;