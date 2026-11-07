// src/components/layout/Header/UserAccountDropdown.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { HeaderIcons as Icons } from './HeaderIcons';
import { Ticket } from 'lucide-react';
import ShootingStarIcon from '@/icons/shooting-star.svg';
import { usePathname } from 'next/navigation';

interface UserAccountDropdownProps {
  user: any;
  logout: () => void;
}

const UserAccountDropdown = ({ user, logout }: UserAccountDropdownProps) => {
  const pathname = usePathname();
  return (
    <div className="group relative h-full flex items-center">
      {/* Trigger Button */}
      <div className="flex items-center gap-2 cursor-pointer py-2">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${user ? 'border-brand-orange bg-orange-50' : 'border-gray-200 bg-gray-50 group-hover:bg-gray-100'}`}>
          {user?.avatar ? (
            <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover rounded-full" />
          ) : (
            <Icons.User className={`w-5 h-5 ${user ? 'text-brand-orange' : 'text-gray-500'}`} />
          )}
        </div>
        <div className="hidden xl:flex flex-col">
          <span className="text-[11px] text-white leading-tight">
            {user ? 'Xin chào,' : 'Tài khoản'}
          </span>
          <div className="flex items-center gap-1">
            <span className="text-[13px] font-bold text-white leading-tight max-w-[100px] truncate">
                {user ? (user.name || 'Member') : 'Đăng nhập / Đăng ký'}
            </span>
            {user && <Icons.ChevronDown className="w-3 h-3 text-gray-400" />}
          </div>
        </div>
      </div>

      {/* Bridge */}
      <div className="absolute top-full right-0 w-[200px] h-3 bg-transparent z-40 block" />

      {/* Dropdown Content */}
      <div className="absolute top-[calc(100%+8px)] right-0 w-[260px] bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 z-[100]">
        
        {user ? (
          // Logged In State
          <div className="flex flex-col py-2">
            <div className="px-4 py-3 border-b border-gray-100 mb-2 bg-gradient-to-r from-orange-50 to-white">
              <p className="text-sm font-bold text-gray-800">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email || 'Thành viên thân thiết'}</p>
            </div>
            
            <div className="h-px bg-gray-100 my-2 mx-4"></div>
            <button onClick={logout} className="w-full text-left px-4 py-2.5 hover:bg-red-50 flex items-center gap-3 text-sm text-gray-700 hover:text-red-600 transition-colors">
              <Icons.LogOut className="w-4 h-4" /> Đăng xuất
            </button>
          </div>
        ) : (
          // Guest State
          <div className="p-5 flex flex-col items-center text-center">
            <p className="text-sm text-gray-600 mb-4">
              Đăng nhập để nhận thông báo và theo dõi đơn hàng dễ dàng hơn.
            </p>
            <Link href="/login" className="w-full">
              <button className="w-full py-2.5 bg-brand-orange text-white text-sm font-bold rounded-lg shadow-lg shadow-orange-200 hover:bg-brand-orange-dark transition-all transform hover:scale-[1.02]">
                Đăng nhập
              </button>
            </Link>
            <div className="mt-3 text-xs text-gray-500">
              Chưa có tài khoản? <Link href="/register" className="text-brand-orange font-bold hover:underline">Đăng ký ngay</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserAccountDropdown;