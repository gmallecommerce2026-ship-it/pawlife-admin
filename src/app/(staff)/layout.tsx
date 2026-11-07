import React from 'react';
import StaffSidebar from '@/layout/staff/StaffSidebar'; 

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f5f5f5] flex">
        {/* Sidebar */}
        <StaffSidebar />
        
        {/* Main Content - Thêm margin-left bằng width của sidebar */}
        <main className="flex-1 ml-[260px] p-6 overflow-y-auto min-h-screen">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
    </div>
  );
}