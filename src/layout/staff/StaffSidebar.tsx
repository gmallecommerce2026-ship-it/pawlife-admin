'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FiHome, FiCoffee, FiLogOut, FiShield, FiClipboard
} from 'react-icons/fi';
import classNames from 'classnames';
import { logout } from '@/actions/logout';

interface MenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  path: string;
}

const STAFF_MENU: MenuItem[] = [
  { id: 'dashboard', label: 'Tổng quan', icon: <FiHome size={20} />, path: '/staff/dashboard' },
  { id: 'orders', label: 'Xử lý đơn hàng', icon: <FiCoffee size={20} />, path: '/staff/orders' },
  { id: 'history', label: 'Lịch sử đơn', icon: <FiClipboard size={20} />, path: '/staff/history' },
];

const SidebarItem = ({ item }: { item: MenuItem }) => {
  const pathname = usePathname();
  // Active khi path bắt đầu bằng path của item
  const isActive = pathname.startsWith(item.path);

  return (
    <div className="w-full select-none mb-1">
      <Link 
        href={item.path}
        className={classNames(
          "flex items-center gap-3 py-3 px-6 text-sm transition-all duration-200 cursor-pointer group hover:bg-stone-50",
          {
            "text-[#c49b63] bg-[#c49b63]/10 font-bold border-r-[3px] border-[#c49b63]": isActive,
            "text-gray-600": !isActive,
          }
        )}
      >
        <span className={isActive ? "text-[#c49b63]" : "text-gray-400 group-hover:text-[#c49b63]"}>
          {item.icon}
        </span>
        <span className="truncate">{item.label}</span>
      </Link>
    </div>
  );
};

const StaffSidebar = () => {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
        await logout();
    });
  };

  return (
    <aside className="fixed top-0 left-0 w-[260px] h-screen bg-white border-r border-gray-100 shadow-xl shadow-gray-200/50 z-50 flex flex-col font-sans">
      {/* Header Logo */}
      <div className="h-[80px] flex items-center px-6 border-b border-gray-100 gap-3">
        <div className="w-10 h-10 bg-[#1d150b] rounded-xl flex items-center justify-center text-[#c49b63] shadow-lg shadow-[#1d150b]/20">
          <FiShield size={20}/>
        </div>
        <div>
            <h1 className="font-bold text-lg text-[#1d150b] leading-tight font-sans">N.S Coffee</h1>
            <span className="text-[11px] text-[#c49b63] font-bold tracking-widest uppercase">Staff Portal</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar py-6">
        {STAFF_MENU.map(item => (
          <SidebarItem key={item.id} item={item} />
        ))}
      </div>
      
      <div className="p-4 border-t border-gray-100 bg-gray-50/30">
        <button 
            onClick={handleLogout}
            disabled={isPending}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
        >
            <FiLogOut size={18} /> 
            <span>{isPending ? 'Đang đăng xuất...' : 'Đăng xuất'}</span>
        </button>
      </div>
    </aside>
  );
};

export default React.memo(StaffSidebar);