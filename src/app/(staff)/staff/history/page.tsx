// src/app/(staff)/staff/history/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FiSearch, FiFilter, FiDownload, FiLoader } from 'react-icons/fi';
import classNames from 'classnames';
import { getStaffHistoryOrders, StaffHistoryItem } from '@/actions/staff-history'; // Import action vừa tạo
import { OrderStatus } from '@prisma/client';

export default function StaffHistoryPage() {
  // --- State ---
  // Lấy ngày hiện tại format YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];
  
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState(today);
  
  const [historyData, setHistoryData] = useState<StaffHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  // --- Fetch Data ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getStaffHistoryOrders(dateFilter);
      setHistoryData(data);
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  // Gọi fetch khi component mount hoặc dateFilter thay đổi
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Filter Logic (Client-side search on fetched data) ---
  const filteredHistory = historyData.filter(order => 
    order.displayId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
          <h2 className="text-2xl font-bold text-gray-800">Lịch sử đơn hàng</h2>
          <p className="text-gray-500 text-sm">Xem lại các đơn đã hoàn tất hoặc bị hủy trong ca làm việc.</p>
      </div>

      {/* Toolbar: Search & Filter */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex flex-1 gap-4 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:max-w-xs">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Tìm theo mã đơn, tên khách..." 
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c49b63] text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            {/* Date Picker */}
            <div className="relative">
                <input 
                    type="date" 
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="pl-4 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c49b63] text-sm text-gray-600"
                />
            </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 w-full md:w-auto">
            <button 
                onClick={fetchData} // Nút refresh dữ liệu thủ công
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex-1 md:flex-none justify-center"
            >
                <FiFilter /> Làm mới
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-[#c49b63] text-[#c49b63] rounded-lg text-sm font-medium hover:bg-[#c49b63]/5 transition-colors flex-1 md:flex-none justify-center">
                <FiDownload /> Xuất Excel
            </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[300px]">
        {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-3">
                <FiLoader className="animate-spin text-3xl text-[#c49b63]" />
                <p className="text-sm">Đang tải dữ liệu...</p>
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                            <th className="px-6 py-4 font-semibold">Mã đơn</th>
                            <th className="px-6 py-4 font-semibold">Khách hàng</th>
                            <th className="px-6 py-4 font-semibold">Món đã gọi</th>
                            <th className="px-6 py-4 font-semibold">Tổng tiền</th>
                            {/* <th className="px-6 py-4 font-semibold">Thanh toán</th> */}
                            <th className="px-6 py-4 font-semibold">Trạng thái</th>
                            <th className="px-6 py-4 font-semibold">Thời gian</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-sm">
                        {filteredHistory.length > 0 ? (
                            filteredHistory.map((item) => (
                                <tr key={item.id} className="hover:bg-amber-50/10 transition-colors group">
                                    <td className="px-6 py-4 font-bold text-[#c49b63]">
                                        {item.displayId}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-800">
                                        {item.customerName}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        <div className="flex flex-col gap-1">
                                            {item.items.map((prod, idx) => (
                                                <span key={idx} className="block truncate max-w-[250px]" title={prod}>• {prod}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-gray-800">
                                        {item.total.toLocaleString('vi-VN')}đ
                                    </td>
                                    {/* Cột Payment Method - Uncomment nếu cần logic hiển thị Payment */}
                                    {/* <td className="px-6 py-4">
                                        <span className={classNames(
                                            "px-2 py-1 rounded border text-xs font-medium",
                                            item.paymentMethod.includes('BANKING') 
                                                ? "border-blue-200 bg-blue-50 text-blue-600" 
                                                : "border-green-200 bg-green-50 text-green-600"
                                        )}>
                                            {item.paymentMethod}
                                        </span>
                                    </td> */}
                                    <td className="px-6 py-4">
                                        {item.status === OrderStatus.COMPLETED ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                Hoàn tất
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                Đã hủy
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-gray-400 text-xs">
                                        {item.completedAt}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                                    Không tìm thấy đơn hàng nào trong ngày {dateFilter}.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        )}
        
        {/* Pagination Footer (Có thể phát triển thêm Server Pagination sau này) */}
        {!loading && filteredHistory.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-sm text-gray-500">Hiển thị {filteredHistory.length} kết quả</span>
                <div className="flex gap-2">
                    <button disabled className="px-3 py-1 border rounded text-sm disabled:opacity-50 hover:bg-gray-50">Trước</button>
                    <button className="px-3 py-1 border rounded text-sm bg-[#1d150b] text-white border-[#1d150b]">1</button>
                    <button disabled className="px-3 py-1 border rounded text-sm disabled:opacity-50 hover:bg-gray-50">Sau</button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}