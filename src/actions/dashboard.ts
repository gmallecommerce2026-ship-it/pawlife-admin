'use server';

import { db } from "@/lib/db";

export async function getStaffDashboardStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // 1. Lấy thông báo và settings
  const settings = await db.storeSetting.findUnique({ where: { id: 1 } });

  // 2. Đếm đơn chờ (PENDING hoặc PROCESSING)
  const pendingOrders = await db.order.count({
    where: {
      orderStatus: { in: ['PENDING', 'PROCESSING'] }
    }
  });

  // 3. Đếm đơn hoàn thành hôm nay
  const completedToday = await db.order.count({
    where: {
      orderStatus: 'COMPLETED',
      updatedAt: {
        gte: today,
        lt: tomorrow
      }
    }
  });

  // 4. Doanh thu hôm nay (nếu cần hiển thị cho staff)
  const revenueAgg = await db.order.aggregate({
    _sum: { totalAmount: true },
    where: {
      orderStatus: 'COMPLETED',
      updatedAt: {
        gte: today,
        lt: tomorrow
      }
    }
  });

  return {
    notification: settings?.staffNotification || "Chúc bạn một ngày làm việc vui vẻ!",
    pendingOrders,
    completedToday,
    revenueToday: Number(revenueAgg._sum.totalAmount || 0),
    shiftStart: settings?.openTime || "07:00",
    shiftEnd: settings?.closeTime || "22:00"
  };
}