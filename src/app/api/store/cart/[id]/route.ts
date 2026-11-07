// src/app/api/store/cart/[id]/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

// 1. PATCH: Cập nhật số lượng
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id;
    const body = await req.json(); // { quantity: ... }
    const { quantity } = body;

    console.log(`🔄 [API] Update Product ${productId} to quantity ${quantity}`);

    // --- TODO: Update DB ---
    // await prisma.cartItem.update(...)

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

// 2. DELETE: Xóa món khỏi giỏ
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id;
    
    console.log(`🗑️ [API] Remove Product ${productId}`);

    // --- TODO: Delete from DB ---
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}