"use client";
// Sidebar admin theo bố cục của shelter: thu gọn 88px, hover mở rộng; trên mobile là thanh tab dưới + mục "Khác"
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Store, CalendarDays, Users, Inbox, Map, Tag, Star, Flag, User, ScrollText, ShieldCheck,
  LogOut, ChevronDown, MoreHorizontal, X, type LucideIcon,
} from "lucide-react";
import type { MenuItem } from "@/lib/admin/menu";

const ICONS: Record<string, LucideIcon> = {
  home: Home, shelter: Store, calendar: CalendarDays, users: Users, inbox: Inbox, map: Map,
  tag: Tag, star: Star, flag: Flag, user: User, log: ScrollText, shield: ShieldCheck,
};

type Props = {
  items: MenuItem[];
  name: string;
  roles: string[];
  logoutAction: (fd: FormData) => void | Promise<void>;
};

export default function Sidebar({ items, name, roles, logoutAction }: Props) {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Mục khớp dài nhất được coi là đang chọn (ví dụ /admin/places và /admin/places/settings)
  const activeHref = items
    .map((i) => i.href)
    .filter((h) => pathname === h || pathname.startsWith(h + "/"))
    .sort((a, b) => b.length - a.length)[0];

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const words = name.split(" ").filter(Boolean);
  const initials = words.length ? (words[0][0] + (words.length > 1 ? words[words.length - 1][0] : "")).toUpperCase() : "AD";
  const tabItems = items.slice(0, 4);

  return (
    <>
      {/* ===== Desktop / tablet (≥ md) =====
          Chiều rộng sidebar nằm trong luồng flex: khi mở ra, nội dung bên phải co lại đúng bằng phần mở thêm. */}
      <div className="group relative z-50 hidden h-full w-[88px] shrink-0 border-r border-transparent bg-white transition-[width,border-color] duration-[480ms] ease-[cubic-bezier(0.32,0.72,0,1)] hover:w-[272px] hover:border-[#EEEEF2] md:block">
        <aside
          onMouseLeave={() => setProfileOpen(false)}
          className="flex h-full w-full flex-col overflow-hidden whitespace-nowrap bg-white font-sans"
        >
          {/* Hồ sơ */}
          <div ref={profileRef} className="relative px-[22px] pb-6 pt-10 transition-[padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:px-6">
            <button type="button" onClick={() => setProfileOpen((v) => !v)} className="flex w-full items-center gap-3 text-left">
              <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-[#0D062D] text-sm font-semibold text-white ring-2 ring-transparent transition-all duration-300 group-hover:ring-[#E89B5A]/40">
                {initials}
              </div>
              <div className="min-w-0 max-w-0 -translate-x-2 overflow-hidden opacity-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:max-w-[150px] group-hover:translate-x-0 group-hover:opacity-100 group-hover:delay-75">
                <h3 className="truncate text-[16px] font-medium leading-tight text-[#0D062D]">{name}</h3>
                <p className="mt-0.5 truncate text-[13px] font-light text-[#787486]">{roles[0] ?? "Quản trị viên"}</p>
              </div>
              <ChevronDown
                size={18}
                className={`ml-auto max-w-0 shrink-0 overflow-hidden text-gray-400 opacity-0 transition-all duration-500 group-hover:max-w-5 group-hover:opacity-100 ${profileOpen ? "rotate-180 text-[#E89B5A]" : ""}`}
              />
            </button>

            {profileOpen && (
              <div className="absolute left-6 right-6 top-[84px] z-50 hidden overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl group-hover:block">
                <div className="border-b border-gray-50 bg-gray-50/60 px-4 py-3">
                  <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">Vai trò</p>
                  <p className="truncate text-[13px] font-medium text-[#0D062D]">{roles.join(", ") || "Chưa được gán quyền"}</p>
                </div>
                <form action={logoutAction}>
                  <button type="submit" className="flex w-full items-center gap-3 px-4 py-3 text-[14px] font-medium text-red-600 transition-colors duration-200 hover:bg-red-50">
                    <LogOut size={18} />
                    <span>Đăng xuất</span>
                  </button>
                </form>
              </div>
            )}
          </div>

          <div className="mx-auto mb-4 h-px w-[44px] bg-[#EEEEF2] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:w-[calc(100%-48px)]" />

          {/* Menu: min-h-0 để vùng này co lại và cuộn, không đẩy thẻ quyền ra khỏi màn hình */}
          <nav className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-2">
            {items.map((item, idx) => {
              const active = item.href === activeHref;
              const Icon = ICONS[item.icon] ?? Home;
              const stagger = { transitionDelay: `${60 + idx * 22}ms` } as const;
              return (
                <div key={item.href}>
                  {item.section && (
                    <p className="h-[34px] px-7 pt-3 text-[10px] font-bold uppercase tracking-widest text-[#B0AAB8] opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-hover:delay-150">
                      {item.section}
                    </p>
                  )}
                  <div className="mb-1 px-4">
                    <Link
                      href={item.href}
                      title={item.label}
                      className={`group/item relative flex items-center rounded-xl py-2.5 text-[15px] transition-colors duration-200 ${
                        active ? "bg-[#F5F3FA] font-medium text-[#0D062D]" : "text-[#787486] hover:bg-[#F7F7FA] hover:text-[#0D062D]"
                      }`}
                    >
                      {active && <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-[#E89B5A]" />}
                      <div className="flex w-[56px] shrink-0 items-center justify-center">
                        <span
                          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 ${
                            active ? "bg-[#E89B5A]/15 text-[#C9772F]" : "text-[#787486] group-hover/item:scale-110"
                          }`}
                        >
                          <Icon size={19} />
                        </span>
                      </div>
                      <span
                        style={stagger}
                        className="max-w-0 -translate-x-3 truncate overflow-hidden opacity-0 transition-[max-width,opacity,transform] duration-[420ms] ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:max-w-[200px] group-hover:translate-x-0 group-hover:opacity-100"
                      >
                        {item.label}
                      </span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Thẻ quyền: shrink-0 để luôn hiện đầy đủ ở đáy */}
          <div className="mx-4 mb-5 mt-3 shrink-0 rounded-2xl bg-gradient-to-b from-[#FFFDF4] to-[#FFE07A] p-3 shadow-[0_6px_18px_-8px_rgba(255,190,60,0.5)]">
            <ShieldCheck size={22} className="mx-auto text-[#B7791F]" />
            <div className="max-h-0 overflow-hidden opacity-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:max-h-40 group-hover:opacity-100 group-hover:delay-100">
              <p className="mt-2 text-[12px] font-semibold text-[#1A1A1A]">Quyền của bạn</p>
              <p className="whitespace-normal text-[12px] leading-snug text-[#7A7565]">{roles.join(", ") || "Chưa được gán quyền"}</p>
            </div>
          </div>
        </aside>
      </div>

      {/* ===== Mobile (< md): thanh tab dưới ===== */}
      <nav aria-label="Điều hướng quản trị" className="fixed inset-x-0 bottom-0 z-40 border-t border-black/[0.06] bg-white/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl md:hidden">
        <ul className="mx-auto flex h-[60px] max-w-[560px] items-stretch px-2">
          {tabItems.map((item) => {
            const active = item.href === activeHref;
            const Icon = ICONS[item.icon] ?? Home;
            return (
              <li key={item.href} className="flex-1">
                <Link href={item.href} aria-current={active ? "page" : undefined} className="flex h-full flex-col items-center justify-center gap-1">
                  <span className={`flex h-8 w-14 items-center justify-center rounded-full ${active ? "bg-[#E89B5A]/15" : ""}`}>
                    <Icon size={20} className={active ? "text-[#0D062D]" : "text-[#8E8E93]"} />
                  </span>
                  <span className={`text-[10px] leading-none ${active ? "font-semibold text-[#0D062D]" : "font-medium text-[#8E8E93]"}`}>{item.short}</span>
                </Link>
              </li>
            );
          })}
          <li className="flex-1">
            <button type="button" onClick={() => setSheetOpen(true)} className="flex h-full w-full flex-col items-center justify-center gap-1">
              <span className="flex h-8 w-14 items-center justify-center">
                <MoreHorizontal size={20} className="text-[#8E8E93]" />
              </span>
              <span className="text-[10px] font-medium leading-none text-[#8E8E93]">Khác</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Sheet "Khác" trên mobile */}
      {sheetOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div onClick={() => setSheetOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
          <div className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-[28px] bg-[#F5F5F7] px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 shadow-[0_-10px_40px_rgba(0,0,0,0.18)]">
            <div className="mb-3 flex items-center justify-between px-1">
              <div className="min-w-0">
                <p className="truncate text-[16px] font-semibold text-[#0D062D]">{name}</p>
                <p className="truncate text-[12px] text-[#787486]">{roles.join(", ") || "Chưa được gán quyền"}</p>
              </div>
              <button type="button" onClick={() => setSheetOpen(false)} aria-label="Đóng" className="flex h-9 w-9 items-center justify-center rounded-full bg-white">
                <X size={18} />
              </button>
            </div>

            <div className="overflow-hidden rounded-[20px] bg-white">
              {items.map((item) => {
                const active = item.href === activeHref;
                const Icon = ICONS[item.icon] ?? Home;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSheetOpen(false)}
                    className={`flex min-h-[52px] items-center gap-3 border-b border-gray-50 px-4 last:border-0 ${active ? "font-semibold text-[#0D062D]" : "text-[#787486]"}`}
                  >
                    <Icon size={18} className={active ? "text-[#E89B5A]" : "text-gray-400"} />
                    <span className="text-[15px]">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <form action={logoutAction} className="mt-3 overflow-hidden rounded-[20px] bg-white">
              <button type="submit" className="flex min-h-[56px] w-full items-center gap-3 px-4 text-left text-red-600">
                <LogOut size={18} />
                <span className="text-[15px] font-medium">Đăng xuất</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
