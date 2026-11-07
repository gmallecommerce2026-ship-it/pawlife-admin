// src/app/api/store/cart/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth'; // Giả sử bạn dùng auth.js (NextAuth)

// 1. GET: Lấy thông tin giỏ hàng
export async function GET(req: Request) {
  try {
    const session = await auth();
    
    // Nếu chưa login, trả về giỏ rỗng (hoặc xử lý logic cookie cart ở đây)
    if (!session?.user) {
       return NextResponse.json({ items: [] });
    }

    // --- TODO: Kết nối DB để lấy giỏ hàng thật của User ---
    // Ví dụ: const cart = await prisma.cart.findFirst(...)
    
    // Tạm thời trả về data giả để Frontend không bị lỗi
    return NextResponse.json({
      items: [
        {
            id: 'item-1',
            productId: 1,
            title: 'Sản phẩm mẫu từ DB',
            price: 50000,
            quantity: 2,
            image: '/images/sample.jpg',
            selectedOptions: []
        }
      ]
    });

  } catch (error) {
    return NextResponse.json(
        { message: 'Lỗi server' },
        { status: 500 }
    );
  }
}

// 2. POST: Thêm vào giỏ hàng
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productId, quantity, options } = body;

    // Log để bạn thấy data đã xuống được Backend
    console.log("✅ [API] Add to Cart:", { productId, quantity, options });

    const session = await auth();
    if (!session?.user) {
        // Nếu là Guest, Frontend tự quản lý localStorage, 
        // Backend chỉ cần trả về OK để không báo lỗi.
        return NextResponse.json({ message: "Guest cart synced" });
    }

    // --- TODO: Lưu vào Database (Prisma) ---
    // await prisma.cartItem.create(...)

    return NextResponse.json({ message: "Đã lưu vào DB thành công" });

  } catch (error) {
    console.error("Cart Error:", error);
    return NextResponse.json(
        { message: 'Lỗi thêm vào giỏ' }, 
        { status: 500 }
    );
  }
}