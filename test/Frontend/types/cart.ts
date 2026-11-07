// src/types/cart.ts
export interface CartItem {
  id: string;
  productId: string;
  title: string;
  imageUrl: string;
  price: number;
  quantity: number;
  stock: number; // Quan trọng để giới hạn số lượng nhập
  color?: string; // Optional vì hiện tại DB chưa có
  size?: string;  // Optional
  slug?: string;
}

export interface CartResponse {
  items: CartItem[];
  total: number;
  itemCount: number;
}