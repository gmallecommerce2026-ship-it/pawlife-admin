'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  PawPrint, ClipboardList, Store, Box, ArrowRight, Activity,
  TrendingUp, PieChart as PieChartIcon, QrCode, Loader2,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { shelterService, ShelterDashboardStats } from '@/services/shelterService';

export default function ShelterDashboardPage() {
  const [data, setData] = useState<ShelterDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date());

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await shelterService.getDashboardStats();
        setData(res);
      } catch (err: any) {
        setError(err.message || 'Đã có lỗi xảy ra khi tải dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-[1100px] mx-auto flex items-center justify-center h-[400px]">
        <Loader2 className="animate-spin text-[#E89B5A]" size={32} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full max-w-[1100px] mx-auto flex flex-col items-center justify-center h-[400px] gap-3 text-gray-500">
        <p>{error ?? 'Không có dữ liệu'}</p>
      </div>
    );
  }

  const { stats, adoptionTrend, petTypeDistribution } = data;

  return (
    <div className="w-full max-w-[1100px] mx-auto flex flex-col gap-8 pb-10 font-sans">
      <div className="flex flex-col gap-2">
        <p className="text-[13px] font-bold text-[#E89B5A] tracking-widest uppercase">{today}</p>
        <h1 className="font-['Be_Vietnam_Pro',_sans-serif] text-[32px] sm:text-[40px] text-[#0D062D] font-bold leading-tight tracking-tight">
          Chào mừng trở lại 👋
        </h1>
        <p className="text-[15px] text-gray-500">
          Đây là trung tâm điều khiển, nơi bạn quản lý hồ sơ trạm, thú cưng và các đơn nhận nuôi.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Thú cưng có sẵn" value={String(stats.availablePets)} icon={<PawPrint size={20} />} color="text-[#3B82F6]" bg="bg-[#EFF6FF]" />
        <StatCard title="Đơn chờ duyệt" value={String(stats.pendingApplications)} icon={<ClipboardList size={20} />} color="text-[#E89B5A]" bg="bg-[#FFF4EA]" />
        <StatCard title="Đã nhận nuôi" value={String(stats.adoptedCount)} icon={<Activity size={20} />} color="text-[#22C55E]" bg="bg-[#F0FDF4]" />
        <StatCard title="QR đã cấp" value={String(stats.qrIssued)} icon={<QrCode size={20} />} color="text-[#A855F7]" bg="bg-[#FAF5FF]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-[24px] p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
          <div className="mb-6">
            <h2 className="text-[18px] font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp size={20} className="text-[#E89B5A]" />
              Thống kê nhận nuôi
            </h2>
            <p className="text-[13px] text-gray-400 mt-1">Xu hướng 6 tháng gần nhất</p>
          </div>

          {adoptionTrend.every((d) => d.dogs === 0 && d.cats === 0) ? (
            <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">
              Chưa có dữ liệu nhận nuôi trong 6 tháng gần đây
            </div>
          ) : (
            <div className="w-full h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={adoptionTrend} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorDogs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3DB2FF" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3DB2FF" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCats" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E89B5A" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#E89B5A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.08)' }} cursor={{ stroke: '#E89B5A', strokeWidth: 1, strokeDasharray: '5 5' }} />
                  <Area type="monotone" name="Chó" dataKey="dogs" stroke="#3DB2FF" strokeWidth={3} fillOpacity={1} fill="url(#colorDogs)" />
                  <Area type="monotone" name="Mèo" dataKey="cats" stroke="#E89B5A" strokeWidth={3} fillOpacity={1} fill="url(#colorCats)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-100 rounded-[24px] p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col">
          <div className="mb-2">
            <h2 className="text-[18px] font-bold text-gray-900 flex items-center gap-2">
              <PieChartIcon size={20} className="text-[#FF6B93]" />
              Phân loại Pet
            </h2>
            <p className="text-[13px] text-gray-400 mt-1">Cấu trúc thú cưng tại trạm</p>
          </div>

          {petTypeDistribution.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm min-h-[250px]">
              Trạm chưa có thú cưng nào
            </div>
          ) : (
            <div className="flex-1 w-full h-full min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={petTypeDistribution} cx="50%" cy="50%" innerRadius={65} outerRadius={85} paddingAngle={5} dataKey="value" stroke="none">
                    {petTypeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.08)' }} itemStyle={{ fontSize: '14px', fontWeight: 500 }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '13px', color: '#4B5563', paddingTop: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="mt-2">
        <h2 className="text-[18px] font-bold text-[#0D062D] mb-4">Lối tắt quản lý</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <ActionCard href="/shelter/pets" icon={<PawPrint size={24} />} title="Quản lý Pets" desc="Thêm, sửa, xóa và cập nhật trạng thái thú cưng." />
          <ActionCard href="/shelter/applications" icon={<ClipboardList size={24} />} title="Đơn nhận nuôi" desc="Duyệt hồ sơ Kanban, lên lịch phỏng vấn và bàn giao." />
          <ActionCard href="/shelter/post-adoption" icon={<Box size={24} />} title="Theo dõi sau nhận nuôi" desc="Kiểm tra trạng thái sức khỏe thú cưng sau khi về nhà mới." />
          <ActionCard href="/shelter/profile" icon={<Store size={24} />} title="Hồ sơ trạm" desc="Cập nhật thông tin liên hệ, giờ mở cửa và hình ảnh." />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, bg }: { title: string; value: string; icon: React.ReactNode; color: string; bg: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-[20px] p-5 flex flex-col gap-3 shadow-[0_4px_15px_rgb(0,0,0,0.02)] hover:shadow-[0_4px_20px_rgb(0,0,0,0.06)] transition-shadow">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${bg} ${color}`}>{icon}</div>
      <div>
        <p className="text-[26px] font-bold text-gray-900 leading-none mb-1.5">{value}</p>
        <p className="text-[13px] text-gray-500 font-medium">{title}</p>
      </div>
    </div>
  );
}

function ActionCard({ href, icon, title, desc }: { href: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link href={href} className="group flex items-center justify-between bg-white border border-gray-200/80 rounded-[20px] p-6 hover:border-[#E89B5A] hover:shadow-[0_8px_30px_rgb(232,155,90,0.12)] transition-all duration-300">
      <div className="flex items-center gap-5">
        <div className="w-[56px] h-[56px] rounded-2xl bg-[#FFF4EA] text-[#E89B5A] flex items-center justify-center group-hover:scale-110 group-hover:bg-[#E89B5A] group-hover:text-white transition-all duration-300 shadow-sm shrink-0">
          {icon}
        </div>
        <div className="flex flex-col gap-1.5">
          <h3 className="font-bold text-[16px] text-gray-900 group-hover:text-[#E89B5A] transition-colors">{title}</h3>
          <p className="text-[13px] text-gray-500 leading-snug max-w-[260px]">{desc}</p>
        </div>
      </div>
      <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#FFF4EA] transition-colors shrink-0">
        <ArrowRight size={18} className="text-gray-400 group-hover:text-[#E89B5A] group-hover:translate-x-1 transition-all duration-300" />
      </div>
    </Link>
  );
}