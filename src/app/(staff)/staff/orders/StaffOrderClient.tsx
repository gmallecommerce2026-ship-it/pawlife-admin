// src/app/(staff)/staff/orders/StaffOrderClient.tsx
'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { FiClock, FiCheckCircle, FiLoader, FiRefreshCw, FiCoffee } from 'react-icons/fi';
import classNames from 'classnames';
import { OrderWithDetails, updateOrderStatus, getAdminOrders } from '@/actions/admin-orders';
import { OrderStatus } from '@prisma/client';
import { useRouter } from 'next/navigation';

interface StaffOrderClientProps {
  initialOrders: OrderWithDetails[];
}

export default function StaffOrderClient({ initialOrders }: StaffOrderClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<OrderStatus>(OrderStatus.PENDING);
  const [orders, setOrders] = useState<OrderWithDetails[]>(initialOrders);
  const [isPending, startTransition] = useTransition();
  
  // State cho Cancel Modal
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  // Auto refresh mỗi 10s
  useEffect(() => {
    const interval = setInterval(async () => {
       const res = await getAdminOrders();
       if (res.success && res.data) {
         setOrders(res.data);
       }
    }, 10000); 
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    const res = await getAdminOrders();
    if (res.success && res.data) setOrders(res.data);
    router.refresh();
  };

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    startTransition(async () => {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, orderStatus: newStatus } : o));
        await updateOrderStatus(orderId, newStatus);
        handleRefresh();
    });
  };

  const handleConfirmCancel = async () => {
    if (!cancelOrderId) return;
    if (!cancelReason.trim()) {
        alert("Vui lòng nhập lý do hủy đơn!");
        return;
    }

    startTransition(async () => {
        setOrders(prev => prev.map(o => o.id === cancelOrderId ? { 
            ...o, 
            orderStatus: OrderStatus.CANCELLED,
            cancelReason: cancelReason 
        } : o));
        
        await updateOrderStatus(cancelOrderId, OrderStatus.CANCELLED, cancelReason);
        
        setCancelOrderId(null);
        setCancelReason("");
    });
  };

  const filteredOrders = orders.filter(o => o.orderStatus === activeTab);
  const formatCurrency = (amount: any) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Xử lý đơn hàng</h2>
          <p className="text-gray-500 text-sm">Quản lý pha chế và phục vụ</p>
        </div>
        <button 
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-sm font-medium shadow-sm active:scale-95 transition-transform"
        >
            <FiRefreshCw className={isPending ? "animate-spin" : ""} /> Làm mới
        </button>
      </div>

      {/* TABS */}
      <div className="flex p-1 bg-white rounded-xl shadow-sm border border-gray-100 w-fit overflow-x-auto">
        {[
          { id: OrderStatus.PENDING, label: 'Đơn mới', icon: <FiClock/> },
          { id: OrderStatus.PROCESSING, label: 'Đang pha chế', icon: <FiLoader/> },
          { id: OrderStatus.COMPLETED, label: 'Hoàn thành', icon: <FiCheckCircle/> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as OrderStatus)}
            className={classNames(
              "px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-2 whitespace-nowrap",
              activeTab === tab.id 
                ? "bg-gray-800 text-white shadow-md" 
                : "text-gray-500 hover:bg-gray-50"
            )}
          >
            {tab.icon} {tab.label} 
            <span className="bg-white/20 px-1.5 rounded ml-1 text-xs">
                {orders.filter(o => o.orderStatus === tab.id).length}
            </span>
          </button>
        ))}
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center h-full justify-center">
             <FiCoffee size={48} className="mb-4 opacity-50"/>
             <p>Không có đơn hàng nào ở trạng thái này.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="p-4 font-semibold text-gray-600 text-sm">Đơn hàng</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm">Khách / Bàn</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm min-w-[250px]">Món order</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm">Tổng tiền</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="p-4 align-top">
                      <div className="font-bold text-[#c49b63] font-mono">#{order.id.slice(0, 8)}...</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(order.createdAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </td>
                    
                    {/* CỘT KHÁCH HÀNG */}
                    <td className="p-4 align-top">
                      <div className="font-medium text-gray-800">{order.customerName || order.user?.fullName || "Khách vãng lai"}</div>
                      <div className="text-gray-400 text-xs">{order.phoneNumber || order.receiverPhone}</div>
                      
                      {order.shippingAddress && (
                         <div className={`mt-2 text-xs p-2 rounded border max-w-[200px] ${
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

                    {/* CỘT MÓN & GHI CHÚ */}
                    <td className="p-4 align-top">
                      <div className="space-y-2">
                        {order.orderItems.map((item, idx) => (
                          <div key={idx} className="flex flex-col text-sm">
                            <span className="text-gray-700 font-medium">
                                {item.quantity}x {item.product.name}
                            </span>
                            {item.options.length > 0 && (
                                <span className="text-xs text-gray-500 ml-4">
                                    + {item.options.map(opt => opt.optionValueName).join(', ')}
                                </span>
                            )}
                          </div>
                        ))}
                        
                        {/* Ghi chú */}
                        {order.note && order.note.trim() !== "" && (
                            <div className="mt-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 p-2 rounded flex flex-col gap-1">
                                <span className="font-bold uppercase text-[10px] tracking-wide text-amber-600">📝 Ghi chú:</span> 
                                <span className="italic">"{order.note}"</span>
                            </div>
                        )}
                        
                        {/* Lý do hủy */}
                         {order.orderStatus === OrderStatus.CANCELLED && order.cancelReason && (
                            <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded mt-2 border border-gray-200">
                                <strong>Lý do hủy:</strong> {order.cancelReason}
                            </div>
                        )}
                      </div>
                    </td>

                    <td className="p-4 align-top font-bold text-gray-800">
                      {formatCurrency(order.totalAmount)}
                    </td>

                    <td className="p-4 align-top">
                      <div className="flex flex-col gap-2 w-max">
                        {order.orderStatus === OrderStatus.PENDING && (
                            <button 
                                onClick={() => handleStatusChange(order.id, OrderStatus.PROCESSING)}
                                disabled={isPending}
                                className="px-4 py-2 bg-[#c49b63] hover:bg-[#b08b55] text-white text-sm font-bold rounded-lg shadow-sm active:scale-95 transition-all"
                            >
                                Nhận & Pha
                            </button>
                        )}
                        {order.orderStatus === OrderStatus.PROCESSING && (
                            <button 
                                onClick={() => handleStatusChange(order.id, OrderStatus.COMPLETED)}
                                disabled={isPending}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg shadow-sm active:scale-95 transition-all"
                            >
                                Xong & Giao
                            </button>
                        )}
                        {order.orderStatus !== OrderStatus.COMPLETED && order.orderStatus !== OrderStatus.CANCELLED && (
                             <button 
                                onClick={() => {
                                    setCancelOrderId(order.id);
                                    setCancelReason(""); // Reset lý do khi mở
                                }}
                                disabled={isPending}
                                className="text-xs text-gray-400 hover:text-red-500 underline text-left px-1"
                             >
                                Hủy đơn
                             </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- Cancel Modal (Updated to match Admin) --- */}
      {cancelOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Xác nhận hủy đơn hàng #{cancelOrderId.slice(0, 8)}...</h3>
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
                        autoFocus
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