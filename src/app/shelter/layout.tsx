import React from 'react';
import ShelterSidebar from '@/layout/shelter/ShelterSidebar';
import AuthProvider from '@/components/auth/AuthProvider';
import ShelterMobileNav from '@/layout/shelter/ShelterMobileNav';

export default function ShelterLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="relative flex min-h-[100dvh] bg-white">
        <div className="hidden lg:flex"><ShelterSidebar /></div>

        <main className="flex-1 min-w-0 lg:pt-[22px] transition-all duration-300 ease-in-out">
          <div className="w-full h-full p-4 sm:p-6 lg:p-[32px] min-h-[100dvh] lg:min-h-[calc(100vh-44px)] pb-[calc(88px+env(safe-area-inset-bottom))] lg:pb-[32px] bg-white lg:border border-[#D9D9D9] lg:rounded-tl-[30px] overflow-hidden relative z-20 lg:shadow-sm pt-[calc(1rem+env(safe-area-inset-top))] lg:pt-[32px]">
            {children}
          </div>
        </main>

        <ShelterMobileNav />
      </div>
    </AuthProvider>
  );
}