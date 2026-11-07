'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PawPrint, FileText, Settings, LayoutDashboard } from 'lucide-react';

const TABS = [
  { href: '/shelter/dashboard', label: 'Trang chủ', Icon: LayoutDashboard },
  { href: '/shelter/pets', label: 'Thú cưng', Icon: PawPrint },
  { href: '/shelter/applications', label: 'Hồ sơ', Icon: FileText },
  { href: '/shelter/profile', label: 'Cài đặt', Icon: Settings },
];

export default function ShelterMobileNav() {
  const path = usePathname() ?? '';
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-[60] bg-white/80 backdrop-blur-2xl border-t border-black/5 pb-[env(safe-area-inset-bottom)]">
      <ul className="flex items-stretch justify-around h-[56px]">
        {TABS.map(({ href, label, Icon }) => {
          const active = path === href || path.startsWith(href + '/');
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                prefetch={false}
                className="h-full flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform"
              >
                <Icon size={22} strokeWidth={active ? 2.4 : 1.8} className={active ? 'text-[#E89B5A]' : 'text-gray-400'} />
                <span className={`text-[10px] ${active ? 'text-[#E89B5A] font-semibold' : 'text-gray-400'}`}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}