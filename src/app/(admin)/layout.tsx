// src/app/(admin)/layout.tsx
import React from 'react';
import AdminSidebar from '@/layout/admin/AdminSidebar'; // Đảm bảo đường dẫn đúng
import { FiBell, FiSearch } from 'react-icons/fi'; // Thêm icon cho header

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f5f5f5] flex">
        {/* Page Content Container */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl">
            {children}
          </div>
        </main>
    </div>
  );
}