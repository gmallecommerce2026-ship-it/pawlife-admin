// src/actions/order.ts
'use server'

import { db } from "@/lib/db";
import { CartItem } from "@/types/cart";
import { UserInfo } from "@/store/useCheckoutStore";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

// Hàm tạo mã đơn hàng ngẫu nhiên
function generateOrderId(length: number = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

interface PlaceOrderParams {
  items: CartItem[];
  buyerInfo: UserInfo;
  receiverInfo: UserInfo;
  totalAmount: number;
  deliveryMethod: string;
  note?: string;
  userId?: string;
}

export async function placeOrder(data: PlaceOrderParams) {
  // [DEBUG] 1. In toàn bộ dữ liệu đầu vào nhận được từ Client
  console.log("==========================================");
  console.log("🔍 [BE DEBUG] Bắt đầu xử lý placeOrder");
  console.log("🔍 [BE DEBUG] UserId nhận được:", data.userId, "| Kiểu dữ liệu:", typeof data.userId);
  console.log("🔍 [BE DEBUG] Tổng tiền:", data.totalAmount);
  // console.log("🔍 [BE DEBUG] Full Data:", JSON.stringify(data, null, 2)); // Bỏ comment nếu cần soi kỹ
  console.log("==========================================");
  try {
    // 1. Validate dữ liệu đầu vào
    if (!data.buyerInfo.name || !data.buyerInfo.phone) {
      return { success: false, error: "Thiếu thông tin người đặt hàng" };
    }

    if (!data.items || data.items.length === 0) {
      return { success: false, error: "Giỏ hàng trống" };
    }

    // 2. Xử lý địa chỉ giao hàng
    let finalShippingAddress = "Nhận tại quán";
    
    if (data.deliveryMethod === 'delivery') {
        const inputAddress = data.receiverInfo?.address || "";
        if (!inputAddress || inputAddress.trim() === "" || inputAddress === "Nhận tại quán") {
             return { success: false, error: "Vui lòng nhập địa chỉ giao hàng đầy đủ." };
        }
        finalShippingAddress = inputAddress;
    } 

    // 3. Tạo ID đơn hàng unique
    let orderId = generateOrderId();
    let isUnique = false;
    while (!isUnique) {
        const existing = await db.order.findUnique({ where: { id: orderId } });
        if (!existing) isUnique = true;
        else orderId = generateOrderId();
    }

    // 4. TRANSACTION: Tạo Order -> Tạo OrderItem -> Cộng điểm User
    const result = await db.$transaction(async (tx) => {
      // 4.1 Tạo Order
      const order = await tx.order.create({
        data: {
          id: orderId,
          customerName: data.buyerInfo.name,
          phoneNumber: data.buyerInfo.phone,
          shippingAddress: finalShippingAddress,
          note: data.note || "",
          receiverName: data.receiverInfo.name || data.buyerInfo.name,
          receiverPhone: data.receiverInfo.phone || data.buyerInfo.phone,
          totalAmount: data.totalAmount,
          paymentStatus: PaymentStatus.UNPAID,
          orderStatus: OrderStatus.PENDING,
          
          // 2. CẬP NHẬT: Chỉ cần kiểm tra tồn tại, không check type number nữa
          ...(data.userId ? { userId: data.userId } : {}), 
        },
      });

      // 4.2 Tạo Order Items
      for (const item of data.items) {
        const productIdInt = Number(item.productId); 
        
        const orderItem = await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: productIdInt,
            quantity: item.quantity,
            unitPrice: item.price, 
          },
        });

        if (item.selectedOptions && item.selectedOptions.length > 0) {
          await tx.orderItemOption.createMany({
            data: item.selectedOptions.map((opt) => ({
              orderItemId: orderItem.id,
              optionValueName: opt.name,
              priceAdjustment: opt.priceAdjustment,
            })),
          });
        }
      }

      return { order, pointsEarned: data.userId ? Math.floor(data.totalAmount / 10000) : 0 };
    });

    // Revalidate lại các trang cần thiết để update dữ liệu mới
    revalidatePath("/admin/orders");
    revalidatePath("/staff/orders");
    revalidatePath("/admin/users"); // Refresh trang quản lý user để thấy điểm mới
    
    return {
      success: true,
      orderId: result.order.id,
      message: `Đặt hàng thành công! Bạn nhận được ${result.pointsEarned} điểm.`,
    };

  } catch (error) {
    console.error("❌ Lỗi khi tạo đơn hàng:", error);
    return { success: false, error: "Có lỗi xảy ra khi xử lý đơn hàng." };
  }
}