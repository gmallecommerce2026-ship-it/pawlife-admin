// src/lib/mappers.ts
import { productGridItems } from '@/lib/mock-data';

// 1. Định nghĩa kiểu dữ liệu đầu vào (Raw Data từ DB/API)
export type RawProductItem = typeof productGridItems[0];

// 2. Định nghĩa kiểu dữ liệu đầu ra (Props cho ProductCard)
export interface ProductCardViewProps {
  id: string;
  title: string;
  image: string;
  price: string;
  originalPrice?: string;
  discount?: string;
  sold?: string | number;
  location?: string;
  tag?: string;
  flashSaleConfig?: {
    stockRemaining: number;
    stockTotal: number;
    endsIn?: string;
  };
}

// 3. Mapper Function: Chuyển đổi Raw -> View
// Giúp tách biệt logic xử lý dữ liệu khỏi UI
export const productToCardMapper = (item: RawProductItem): ProductCardViewProps => {
  return {
    id: item.id,
    title: item.title,
    image: item.imageUrl, // Map 'imageUrl' sang 'image'
    price: item.price || (item as any).regularPrice || "Liên hệ", // Xử lý fallback giá
    originalPrice: (item as any).regularPrice !== item.price ? (item as any).regularPrice : undefined,
    discount: item.discountPercent,
    sold: item.salesCount,
    location: item.location,
    // Logic map Flash Sale nếu có
    flashSaleConfig: item.variant === 'flash-sale' ? {
      stockRemaining: item.stockRemaining || 0,
      stockTotal: item.stockTotal || 100,
    } : undefined
  };
};

// 4. Mock Data Wrapper (Mô phỏng data từ Server trả về)
export const CategoryTwoRowMockData = {
  bestSellers: productGridItems.slice(0, 4),
  newArrivals: productGridItems.slice(4, 8),
};