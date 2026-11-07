// src/app/(admin)/admin/orders/page.tsx
import { getAdminOrders } from "@/actions/admin-orders";
import OrderTable from "./components/OrderTable";
import { OrderStatus } from "@prisma/client";

interface OrdersPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const dynamic = 'force-dynamic';

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  // Await searchParams (fix cho Next.js 15)
  const resolvedSearchParams = await searchParams;

  // 1. Xử lý status
  const rawStatus = resolvedSearchParams?.status;
  const statusParam = Array.isArray(rawStatus) ? rawStatus[0] : rawStatus;
  
  let filterStatus: OrderStatus | undefined = undefined;
  if (statusParam && Object.values(OrderStatus).includes(statusParam as OrderStatus)) {
      filterStatus = statusParam as OrderStatus;
  }

  // 2. Xử lý searchId (Mới thêm)
  const rawSearchId = resolvedSearchParams?.searchId;
  const searchId = Array.isArray(rawSearchId) ? rawSearchId[0] : rawSearchId;

  // 3. Fetch data với cả filter status và searchId
  const { data: orders, error } = await getAdminOrders(filterStatus, searchId);

  if (error || !orders) {
    return (
        <div className="p-4 text-red-500 bg-red-50 rounded-lg">
            Lỗi: {error || "Có lỗi xảy ra khi tải dữ liệu."}
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Quản lý đơn hàng</h2>
      </div>

      <OrderTable initialOrders={orders} currentFilter={filterStatus} />
    </div>
  );
}