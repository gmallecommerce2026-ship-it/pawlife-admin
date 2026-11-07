// src/app/(staff)/staff/orders/page.tsx
import { getAdminOrders } from "@/actions/admin-orders";
import StaffOrderClient from "./StaffOrderClient";

export const dynamic = 'force-dynamic'; // Luôn fetch mới

export default async function StaffOrdersPage() {
  // Staff cần thấy tất cả đơn để quản lý, hoặc filter mặc định PENDING
  const { data: orders, error } = await getAdminOrders();

  if (error || !orders) {
    return <div>Lỗi tải dữ liệu</div>;
  }

  return <StaffOrderClient initialOrders={orders} />;
}