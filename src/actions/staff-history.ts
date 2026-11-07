// src/actions/staff-history.ts
'use server'

import { db } from "@/lib/db";
import { OrderStatus } from "@prisma/client";

// Định nghĩa kiểu dữ liệu trả về cho Client để tránh lỗi serialize Decimal của Prisma
export interface StaffHistoryItem {
  id: number;
  displayId: string;
  customerName: string;
  items: string[];
  total: number;
  status: OrderStatus;
  completedAt: string;
  paymentMethod: string;
}

export async function getStaffHistoryOrders(dateStr: string): Promise<StaffHistoryItem[]> {
  try {
    // 1. Tạo range thời gian từ đầu ngày đến cuối ngày
    const start = new Date(dateStr);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(dateStr);
    end.setHours(23, 59, 59, 999);

    // 2. Query DB
    const orders = await db.order.findMany({
      where: {
        orderStatus: {
          in: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] // Chỉ lấy đơn hoàn thành hoặc hủy
        },
        updatedAt: { // Lọc theo ngày cập nhật trạng thái cuối cùng
          gte: start,
          lte: end,
        }
      },
      include: {
        orderItems: {
          include: {
            product: true,
            options: true, // Lấy options để hiển thị chi tiết (VD: Size L)
          }
        }
      },
      orderBy: {
        updatedAt: 'desc' // Đơn mới nhất lên đầu
      }
    });

    // 3. Map dữ liệu sang format Client cần
    return orders.map(order => {
      // Format danh sách món: "2x Cà phê sữa (Size L)"
      const itemsList = order.orderItems.map(item => {
        const optionStr = item.options.length > 0 
          ? ` (${item.options.map(o => o.optionValueName).join(', ')})` 
          : '';
        return `${item.quantity}x ${item.product.name}${optionStr}`;
      });

      return {
        id: order.id,
        displayId: `ORD-${order.id.toString().padStart(4, '0')}`, // Format ID đẹp: ORD-0001
        customerName: order.customerName || order.receiverName || "Khách lẻ",
        items: itemsList,
        total: Number(order.totalAmount), // Convert Decimal -> Number
        status: order.orderStatus,
        completedAt: order.updatedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        paymentMethod: order.paymentStatus === 'PAID' ? 'BANKING/PAID' : 'CASH', // Logic tạm thời, bạn có thể chỉnh theo field paymentMethod thực tế nếu có
      };
    });

  } catch (error) {
    console.error("Error fetching staff history:", error);
    return [];
  }
}