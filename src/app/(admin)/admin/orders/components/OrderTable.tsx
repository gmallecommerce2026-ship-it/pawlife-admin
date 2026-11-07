// src/app/(admin)/admin/orders/components/OrderTable.tsx
'use client'

import { OrderWithDetails, updateOrderStatus } from "@/actions/admin-orders";
import { OrderStatus } from "@prisma/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, useEffect } from "react";

const TABS = [
  { id: 'ALL', label: 'Tất cả', color: 'gray' },
  { id: 'PENDING', label: 'Chờ duyệt', color: 'yellow' },
  { id: 'PROCESSING', label: 'Đang pha chế', color: 'blue' },
  { id: 'COMPLETED', label: 'Hoàn thành', color: 'green' },
  { id: 'CANCELLED', label: 'Đã hủy', color: 'red' },
];

interface OrderTableProps {
  initialOrders: OrderWithDetails[];
  currentFilter?: OrderStatus;
}

export default function OrderTable({ initialOrders, currentFilter }: OrderTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  // -- State Tìm kiếm --
  const [searchTerm, setSearchTerm] = useState(searchParams.get('searchId') || '');

  // --- 1. SỬA: Đổi kiểu state từ number -> string ---
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const activeTab = currentFilter || 'ALL';

  useEffect(() => {
    setSearchTerm(searchParams.get('searchId') || '');
  }, [searchParams]);

  const handleFilterChange = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (status === "ALL") {
      params.delete("status");
    } else {
      params.set("status", status);
    }
    router.push(`/admin/orders?${params.toString()}`, { scroll: false });
  };

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (term.trim()) {
        params.set("searchId", term.trim());
    } else {
        params.delete("searchId");
    }
    router.push(`/admin/orders?${params.toString()}`, { scroll: false });
  };

  // --- 2. SỬA: Đổi tham số orderId từ number -> string ---
  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    startTransition(async () => {
        await updateOrderStatus(orderId, status);
    });
  };

  const handleConfirmCancel = async () => {
    if (!cancelOrderId) return;
    if (!cancelReason.trim()) {
        alert("Vui lòng nhập lý do hủy đơn!");
        return;
    }

    startTransition(async () => {
        // cancelOrderId ở đây đã là string nên không bị lỗi nữa
        await updateOrderStatus(cancelOrderId, OrderStatus.CANCELLED, cancelReason);
        setCancelOrderId(null);
        setCancelReason("");
    });
  };

  const formatCurrency = (amount: any) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount));

  return (
    <div className="space-y-6">
      {/* --- TOOLBAR: Filter Tabs & Search --- */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            let className = `bg-white border text-gray-600 hover:bg-gray-50`;
            if (isActive) {
               className = `bg-gray-800 text-white shadow-md border-gray-800`;
            }
            return (
              <button
                key={tab.id}
                onClick={() => handleFilterChange(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${className}`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-auto min-w-[250px]">
            <input
                type="text"
                placeholder="Tìm mã đơn (VD: 123)..."
                className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearch(searchTerm);
                }}
                onBlur={() => handleSearch(searchTerm)}
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 select-none">
                🔍
            </div>
            {searchTerm && (
                <button 
                    onClick={() => { setSearchTerm(''); handleSearch(''); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                    ✕
                </button>
            )}
        </div>
      </div>

      {/* --- TABLE --- */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-medium text-gray-500">Mã đơn</th>
              <th className="p-4 font-medium text-gray-500">Khách hàng</th>
              <th className="p-4 font-medium text-gray-500">Món</th>
              <th className="p-4 font-medium text-gray-500">Tổng tiền</th>
              <th className="p-4 font-medium text-gray-500">Trạng thái</th>
              <th className="p-4 font-medium text-gray-500">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {initialOrders.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">
                    {searchTerm ? `Không tìm thấy đơn hàng nào khớp với "${searchTerm}"` : "Không có đơn hàng nào"}
                </td></tr>
            ) : initialOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 text-black">
                {/* ID đơn hàng là string */}
                <td className="p-4 font-medium">#{order.id.slice(0, 8)}...</td>
                
                <td className="p-4">
                    <div className="font-medium">{order.customerName || order.user?.fullName || "Khách lẻ"}</div>
                    <div className="text-gray-400 text-xs">{order.phoneNumber || order.receiverPhone}</div>
                    
                    {order.shippingAddress && (
                        <div className={`mt-2 text-xs p-2 rounded border max-w-[250px] ${
                            order.shippingAddress === "Nhận tại quán" 
                            ? "bg-blue-50 text-blue-700 border-blue-100" 
                            : "bg-gray-100 text-gray-700 border-gray-200"
                        }`}>
                            <span className="font-semibold block mb-0.5 flex items-center gap-1">
                                {order.shippingAddress === "Nhận tại quán" ? "🏪 Tại quán" : "🚚 Giao đến:"}
                            </span>
                            <span className="break-words line-clamp-2" title={order.shippingAddress}>
                                {order.shippingAddress}
                            </span>
                        </div>
                    )}
                </td>
                
                <td className="p-4 max-w-xs">
                    <div className="space-y-1">
                        {order.orderItems.map((item, idx) => (
                            <div key={idx} className="text-gray-700">
                                <span className="font-semibold">{item.quantity}x</span> {item.product.name}
                            </div>
                        ))}
                    </div>
                    {/* Hiển thị Ghi chú */}
                    {order.note && order.note.trim() !== "" && (
                        <div className="mt-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 p-2 rounded flex flex-col gap-1">
                            <span className="font-bold uppercase text-[10px] tracking-wide text-amber-600">
                              📝 Ghi chú:
                            </span> 
                            <span className="italic">"{order.note}"</span>
                        </div>
                    )}

                    {/* 3. Hiển thị lý do hủy (nếu có) */}
                    {order.orderStatus === 'CANCELLED' && order.cancelReason && (
                        <div className="mt-2 text-xs text-red-600 bg-red-50 border border-red-100 p-1.5 rounded">
                            <span className="font-bold">Lý do hủy:</span> {order.cancelReason}
                        </div>
                    )}
                </td>
                
                <td className="p-4 font-bold text-gray-900">{formatCurrency(order.totalAmount)}</td>
                <td className="p-4"><StatusBadge status={order.orderStatus} /></td>

                <td className="p-4">
                  <div className="flex gap-2">
                    {order.orderStatus === 'PENDING' && (
                        <button onClick={() => handleUpdateStatus(order.id, 'PROCESSING' as OrderStatus)} disabled={isPending} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs font-medium">Duyệt & Pha</button>
                    )}
                    {order.orderStatus === 'PROCESSING' && (
                        <button onClick={() => handleUpdateStatus(order.id, 'COMPLETED' as OrderStatus)} disabled={isPending} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-medium">Hoàn tất</button>
                    )}
                    {order.orderStatus !== 'COMPLETED' && order.orderStatus !== 'CANCELLED' && (
                        <button 
                            onClick={() => {
                                setCancelOrderId(order.id); // order.id là string, state cũng là string -> OK
                                setCancelReason("");
                            }} 
                            disabled={isPending} 
                            className="px-3 py-1 bg-white border border-red-200 text-red-600 rounded hover:bg-red-50 text-xs font-medium"
                        >
                            Hủy
                        </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- Cancel Modal --- */}
      {cancelOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Xác nhận hủy đơn hàng #{cancelOrderId}</h3>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Lý do hủy đơn <span className="text-red-500">*</span>
                    </label>
                    <textarea 
                        className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                        rows={3}
                        placeholder="VD: Khách đổi ý, hết nguyên liệu..."
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                    />
                </div>
                <div className="flex justify-end gap-3">
                    <button 
                        onClick={() => setCancelOrderId(null)}
                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                    >Đóng</button>
                    <button 
                        onClick={handleConfirmCancel}
                        disabled={isPending || !cancelReason.trim()}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                    >
                        {isPending ? "Đang xử lý..." : "Xác nhận hủy"}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
        PROCESSING: "bg-blue-100 text-blue-800 border-blue-200",
        COMPLETED: "bg-green-100 text-green-800 border-green-200",
        CANCELLED: "bg-red-100 text-red-800 border-red-200",
    };
    const labels: Record<string, string> = {
        PENDING: "Chờ duyệt",
        PROCESSING: "Đang pha chế",
        COMPLETED: "Hoàn thành",
        CANCELLED: "Đã hủy",
    };
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[status] || ""}`}>{labels[status] || status}</span>;
}