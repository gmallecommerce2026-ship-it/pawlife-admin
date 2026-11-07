// src/app/(staff)/staff/dashboard/page.tsx
import React from 'react';
import Link from 'next/link';
import { 
  FiClock, FiCheckCircle, FiCoffee, FiAlertCircle, 
  FiTrendingUp, FiCalendar, FiDollarSign
} from 'react-icons/fi';
import { getStaffDashboardStats } from '@/actions/dashboard';

// Force dynamic để luôn lấy dữ liệu mới nhất mỗi khi F5
export const dynamic = 'force-dynamic';

export default async function StaffDashboardPage() {
  // 1. Fetch dữ liệu thực từ Server Action
  const stats = await getStaffDashboardStats();
  
  const currentDate = new Date().toLocaleDateString('vi-VN', { 
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' 
  });

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Header & Welcome */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-[#1d150b]">Xin chào, Staff! 👋</h2>
          <p className="text-gray-500 mt-1">Chúc bạn một ca làm việc năng lượng.</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium bg-gray-50 px-4 py-2 rounded-lg text-gray-600 border border-gray-200">
          <FiCalendar className="text-[#c49b63]" />
          <span>{currentDate}</span>
          <span className="mx-2">|</span>
          <FiClock className="text-[#c49b63]" />
          <span>Giờ làm: {stats.shiftStart} - {stats.shiftEnd}</span>
        </div>
      </div>

      {/* 2. Key Metrics (Realtime Data) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Việc cần làm ngay (Pending Orders) */}
        <Link href="/staff/orders" className="group">
          <div className="bg-[#c49b63] p-6 rounded-2xl shadow-lg shadow-[#c49b63]/20 text-white relative overflow-hidden transition-transform hover:-translate-y-1">
            <div className="absolute top-0 right-0 p-4 opacity-20">
              <FiCoffee size={80} />
            </div>
            <p className="font-medium text-white/90">Đơn chờ xử lý</p>
            <h3 className="text-4xl font-bold mt-2">{stats.pendingOrders}</h3>
            <div className="mt-4 flex items-center gap-2 text-sm font-medium bg-white/20 w-fit px-3 py-1 rounded-lg backdrop-blur-sm">
              <span>Xử lý ngay</span> <FiTrendingUp />
            </div>
          </div>
        </Link>

        {/* Card 2: Hiệu suất (Completed Orders) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-full">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 font-medium">Đơn hoàn thành hôm nay</p>
              <h3 className="text-3xl font-bold text-[#1d150b] mt-2">{stats.completedToday}</h3>
              <p className="text-sm text-gray-400 mt-1 flex items-center gap-1">
                 <FiDollarSign className="text-green-500"/>
                 Doanh thu: {new Intl.NumberFormat('vi-VN').format(stats.revenueToday)}đ
              </p>
            </div>
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
              <FiCheckCircle size={24} />
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-400">
            Dữ liệu cập nhật thời gian thực
          </div>
        </div>

        {/* Card 3: Thông báo / Lưu ý (Dữ liệu từ Admin Settings) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-full relative overflow-hidden">
            <div className="absolute left-0 top-0 h-full w-1 bg-red-500"></div>
            <div>
              <div className="flex items-center gap-2 text-red-500 font-bold mb-3">
                <FiAlertCircle size={20} /> Bảng tin từ Admin
              </div>
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {stats.notification ? (
                    stats.notification
                ) : (
                    <span className="text-gray-400 italic">Không có thông báo mới.</span>
                )}
              </div>
            </div>
            <span className="text-xs text-gray-400 mt-4 border-t pt-2 block">
                Cập nhật lần cuối: Vừa xong
            </span>
        </div>
      </div>

      {/* 3. Quick Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-lg text-[#1d150b] mb-4">Phím tắt nhanh</h3>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/staff/orders" className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-gray-300 hover:border-[#c49b63] hover:bg-[#c49b63]/5 hover:text-[#c49b63] transition-all cursor-pointer gap-2 text-gray-500">
                <FiCoffee size={24} />
                <span className="font-medium text-sm">Màn hình pha chế</span>
            </Link>
            <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-gray-300 hover:border-red-400 hover:bg-red-50 hover:text-red-500 transition-all cursor-pointer gap-2 text-gray-500">
                <FiAlertCircle size={24} />
                <span className="font-medium text-sm">Báo cáo sự cố</span>
            </div>
          </div>
        </div>

        {/* Ghi chú tĩnh (có thể phát triển thành dynamic sau nếu cần) */}
        <div className="bg-[#1d150b] p-6 rounded-2xl shadow-lg text-white">
            <h3 className="font-bold text-lg mb-4 text-[#c49b63]">Nguyên tắc phục vụ</h3>
            <ul className="space-y-4 text-sm text-gray-300">
                <li className="flex gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c49b63] mt-2 shrink-0"></span>
                    <p>Luôn xác nhận lại order với khách hàng (Size, Đường, Đá).</p>
                </li>
                <li className="flex gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c49b63] mt-2 shrink-0"></span>
                    <p>Vệ sinh khu vực pha chế sau mỗi 30 phút.</p>
                </li>
            </ul>
        </div>
      </div>
    </div>
  );
}