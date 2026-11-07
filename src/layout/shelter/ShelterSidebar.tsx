'use client';

import React, { useState, useEffect, useTransition, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { createPortal } from 'react-dom';
import { FiLogOut, FiChevronDown } from 'react-icons/fi';
import classNames from 'classnames';
import { logout } from '@/actions/logout';
import { Lightbulb, ChevronRight } from 'lucide-react';
import { WriteMessageModal } from '@/components/WriteMessageModal';
import { getUserFromToken } from '@/utils/getUserFromToken';

interface MenuItem {
  id: string;
  label: string;
  /** Nhãn ngắn cho tab bar mobile (tối đa ~8 ký tự để không bị cắt) */
  mobileLabel?: string;
  icon?: React.ReactNode;
  path?: string;
  children?: MenuItem[];
  disabled?: boolean;
}

const enableAllItems = (items: MenuItem[]): MenuItem[] =>
  items.map((item) => ({
    ...item,
    disabled: false,
    children: item.children ? enableAllItems(item.children) : undefined,
  }));

const SHELTER_MENU: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Trang chủ',
    mobileLabel: 'Trang chủ',
    icon: <Image src="/images/trang-chu.png" alt="" width={22} height={22} />,
    path: '/shelter/dashboard',
    disabled: false,
  },
  {
    id: 'pets',
    label: 'Quản lý Pet',
    mobileLabel: 'Thú cưng',
    icon: <Image src="/images/quan-ly-pet.png" alt="" width={22} height={22} />,
    path: '/shelter/pets',
    disabled: false,
  },
  {
    id: 'applications',
    label: 'Hồ sơ nhận nuôi',
    mobileLabel: 'Hồ sơ',
    icon: <Image src="/images/dang-ky-nhan-nuoi.png" alt="" width={22} height={22} />,
    path: '/shelter/applications',
    disabled: false,
  },
  // {
  //   id: 'post-adoption',
  //   label: 'Đã nhận nuôi',
  //   mobileLabel: 'Đã nhận',
  //   icon: <Image src="/images/sau-nhan-nuoi.png" alt="" width={22} height={22} />,
  //   path: '/shelter/post-adoption',
  //   disabled: false,
  // },
  {
    id: 'profile',
    label: 'Cài đặt',
    mobileLabel: 'Cài đặt',
    icon: <Image src="/images/cai-dat.png" alt="" width={22} height={22} />,
    path: '/shelter/profile',
    disabled: false,
  },
];

/* =============================================================================
   DESKTOP — SidebarItem (giữ nguyên hành vi cũ)
   ============================================================================= */
const SidebarItem = ({
  item,
  level = 0,
  isOpen,
  toggleOpen,
}: {
  item: MenuItem;
  level?: number;
  isOpen: (id: string) => boolean;
  toggleOpen: (id: string) => void;
}) => {
  const pathname = usePathname();
  const hasChildren = item.children && item.children.length > 0;
  const linkRef = useRef<HTMLAnchorElement>(null);
  const [tooltipTop, setTooltipTop] = useState<number | null>(null);

  const checkActive = (menuItemPath?: string) =>
    menuItemPath ? pathname.startsWith(menuItemPath) : false;
  const isSelfActive = checkActive(item.path);
  const isChildActive = item.children?.some((child) => checkActive(child.path));
  const isActive = isSelfActive || isChildActive;

  useEffect(() => {
    if (isChildActive && !isOpen(item.id)) toggleOpen(item.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, isChildActive, item.id]);

  const handleClick = (e: React.MouseEvent) => {
    if (item.disabled) {
      e.preventDefault();
      return;
    }
    if (hasChildren) {
      e.preventDefault();
      toggleOpen(item.id);
    }
  };

  const handleMouseEnter = () => {
    if (!item.disabled) return;
    if (linkRef.current) {
      const rect = linkRef.current.getBoundingClientRect();
      setTooltipTop(rect.top + rect.height / 2);
    }
  };
  const handleMouseLeave = () => {
    if (!item.disabled) return;
    setTooltipTop(null);
  };

  return (
    <div className="w-full select-none mb-1 px-4">
      <Link
        ref={linkRef}
        href={item.disabled ? '#' : item.path || '#'}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-disabled={item.disabled}
        className={classNames(
          'flex items-center justify-between py-3 rounded-xl text-[16px] transition-all duration-200',
          item.disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
          {
            'bg-gray-50 text-red font-regular': isActive && level === 0 && !item.disabled,
            'text-[#787486] font-regular hover:bg-gray-50 hover:text-[#0D062D]': !isActive && level === 0 && !item.disabled,
            'text-[#E89B5A] font-regular': isSelfActive && level > 0 && !item.disabled,
            'text-[#787486] hover:text-[#E89B5A]': !isSelfActive && level > 0 && !item.disabled,
            'text-[#787486] font-regular': item.disabled,
          }
        )}
      >
        <div className="flex items-center flex-1 min-w-0">
          {level === 0 && (
            <div className="w-[56px] flex items-center justify-center shrink-0">
              <span className={isActive && !item.disabled ? 'text-[#0D062D]' : 'text-[#787486] transition-colors'}>
                {item.icon}
              </span>
            </div>
          )}

          <span
            className={classNames(
              'truncate transition-all duration-300 overflow-hidden',
              level > 0 ? 'pl-4 group-hover:pl-[60px]' : '',
              'max-w-0 group-hover:max-w-[200px] opacity-0 group-hover:opacity-100'
            )}
          >
            {item.label}
          </span>
        </div>

        {hasChildren && !item.disabled && (
          <FiChevronDown
            size={50}
            className={classNames(
              'text-[#787486] transition-all duration-300 shrink-0 overflow-hidden',
              'max-w-0 group-hover:max-w-5 opacity-0 group-hover:opacity-100',
              isOpen(item.id) ? 'rotate-180' : ''
            )}
          />
        )}
      </Link>

      {item.disabled && tooltipTop !== null && typeof document !== 'undefined' &&
        createPortal(
          <div
            style={{ top: tooltipTop, left: 300 }}
            className="fixed -translate-y-1/2 whitespace-nowrap bg-[#0D062D] text-white text-[12px] font-medium px-3 py-1.5 rounded-lg shadow-lg z-[9999] pointer-events-none animate-in fade-in duration-150"
          >
            Tính năng đang được phát triển
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#0D062D]" />
          </div>,
          document.body
        )
      }

      {!item.disabled && (
        <div
          className={classNames(
            'overflow-hidden transition-all duration-300',
            isOpen(item.id)
              ? 'max-h-0 group-hover:max-h-[500px] opacity-0 group-hover:opacity-100 mt-0 group-hover:mt-1'
              : 'max-h-0 opacity-0'
          )}
        >
          {item.children?.map((child) => (
            <SidebarItem key={child.id} item={child} level={level + 1} isOpen={isOpen} toggleOpen={toggleOpen} />
          ))}
        </div>
      )}
    </div>
  );
};

/* =============================================================================
   MOBILE — Tab bar dưới (kính mờ, kiểu iOS)
   ============================================================================= */
const MobileTabBar = ({
  items,
  avatarSrc,
  accountOpen,
  onOpenAccount,
}: {
  items: MenuItem[];
  avatarSrc: string;
  accountOpen: boolean;
  onOpenAccount: () => void;
}) => {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Điều hướng chính"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-black/[0.06] bg-white/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl backdrop-saturate-150 md:hidden"
    >
      <ul className="mx-auto flex h-[60px] max-w-[560px] items-stretch px-2">
        {items.map((item) => {
          const active = !!item.path && pathname.startsWith(item.path);
          const content = (
            <>
              <span
                className={classNames(
                  'flex h-8 w-14 items-center justify-center rounded-full transition-colors duration-200',
                  active ? 'bg-[#E89B5A]/15' : 'bg-transparent'
                )}
              >
                <span className={classNames('transition-all duration-200', active ? 'opacity-100' : 'opacity-45 grayscale')}>
                  {item.icon}
                </span>
              </span>
              <span
                className={classNames(
                  'text-[10px] leading-none tracking-tight transition-colors',
                  active ? 'font-semibold text-[#0D062D]' : 'font-medium text-[#8E8E93]'
                )}
              >
                {item.mobileLabel ?? item.label}
              </span>
            </>
          );

          return (
            <li key={item.id} className="flex-1">
              {item.disabled ? (
                <div aria-disabled="true" className="flex h-full flex-col items-center justify-center gap-1 opacity-40">
                  {content}
                </div>
              ) : (
                <Link
                  href={item.path || '#'}
                  aria-current={active ? 'page' : undefined}
                  className="flex h-full flex-col items-center justify-center gap-1 transition-transform duration-150 active:scale-90"
                >
                  {content}
                </Link>
              )}
            </li>
          );
        })}

        <li className="flex-1">
          <button
            type="button"
            onClick={onOpenAccount}
            aria-haspopup="dialog"
            aria-expanded={accountOpen}
            className="flex h-full w-full flex-col items-center justify-center gap-1 transition-transform duration-150 active:scale-90"
          >
            <span className="flex h-8 w-14 items-center justify-center">
              <Image
                src={avatarSrc}
                alt=""
                width={26}
                height={26}
                className={classNames(
                  'h-[26px] w-[26px] rounded-full bg-white object-cover ring-2 transition-all',
                  accountOpen ? 'ring-[#E89B5A]' : 'ring-transparent'
                )}
              />
            </span>
            <span
              className={classNames(
                'text-[10px] leading-none tracking-tight',
                accountOpen ? 'font-semibold text-[#0D062D]' : 'font-medium text-[#8E8E93]'
              )}
            >
              Tôi
            </span>
          </button>
        </li>
      </ul>
    </nav>
  );
};

/* =============================================================================
   MOBILE — Sheet tài khoản (kéo xuống để đóng)
   ============================================================================= */
const MobileAccountSheet = ({
  open,
  onClose,
  avatarSrc,
  name,
  email,
  roleLabel,
  isPending,
  onLogout,
  onWriteMessage,
}: {
  open: boolean;
  onClose: () => void;
  avatarSrc: string;
  name: string;
  email: string;
  roleLabel: string;
  isPending: boolean;
  onLogout: () => void;
  onWriteMessage: () => void;
}) => {
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef<number | null>(null);

  useEffect(() => {
    if (!open) {
      setDragY(0);
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (typeof document === 'undefined') return null;

  const onTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    setIsDragging(true);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (startY.current === null) return;
    setDragY(Math.max(0, e.touches[0].clientY - startY.current));
  };
  const onTouchEnd = () => {
    if (dragY > 90) onClose();
    setDragY(0);
    setIsDragging(false);
    startY.current = null;
  };

  return createPortal(
    <div
      className={classNames('fixed inset-0 z-[100] md:hidden', open ? 'pointer-events-auto' : 'pointer-events-none')}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={classNames(
          'absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0'
        )}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Tài khoản"
        style={{
          transform: open ? `translateY(${dragY}px)` : 'translateY(100%)',
          transition: isDragging ? 'none' : 'transform 340ms cubic-bezier(0.32, 0.72, 0, 1)',
        }}
        className="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-[#F5F5F7] px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-10px_40px_rgba(0,0,0,0.18)]"
      >
        {/* Vùng kéo */}
        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          className="flex justify-center pb-3 pt-2.5"
        >
          <span className="h-1.5 w-10 rounded-full bg-black/15" />
        </div>

        {/* Hồ sơ */}
        <div className="flex items-center gap-3.5 rounded-[20px] bg-white p-4">
          <Image
            src={avatarSrc}
            alt=""
            width={56}
            height={56}
            className="h-14 w-14 shrink-0 rounded-full border border-gray-100 bg-white object-cover"
          />
          <div className="min-w-0">
            <p className="truncate text-[17px] font-semibold tracking-[-0.01em] text-[#0D062D]">{name}</p>
            <p className="truncate text-[14px] text-[#787486]">{email}</p>
            <span className="mt-1.5 inline-block rounded-full bg-[#FFF4EC] px-2.5 py-0.5 text-[11px] font-semibold text-[#C9772F]">
              {roleLabel}
            </span>
          </div>
        </div>

        {/* Nhóm hành động */}
        <div className="mt-3 overflow-hidden rounded-[20px] bg-white">
          <button
            type="button"
            onClick={onWriteMessage}
            className="flex min-h-[56px] w-full items-center gap-3 px-4 text-left transition-colors active:bg-black/[0.04]"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#FFF3C4]">
              <Lightbulb size={18} className="text-[#FFB800]" fill="#FFB800" strokeWidth={1} />
            </span>
            <span className="flex-1 text-[16px] text-[#0D062D]">Viết một tin nhắn</span>
            <ChevronRight size={18} className="text-gray-300" />
          </button>
        </div>

        <div className="mt-3 overflow-hidden rounded-[20px] bg-white">
          <button
            type="button"
            onClick={onLogout}
            disabled={isPending}
            className="flex min-h-[56px] w-full items-center gap-3 px-4 text-left transition-colors active:bg-red-50 disabled:opacity-50"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-red-50">
              <FiLogOut size={17} className="text-red-600" />
            </span>
            <span className="flex-1 text-[16px] font-medium text-red-600">
              {isPending ? 'Đang xử lý...' : 'Đăng xuất'}
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-3 h-[52px] w-full rounded-[16px] bg-white text-[16px] font-semibold text-[#0D062D] transition-transform active:scale-[0.98]"
        >
          Đóng
        </button>
      </div>
    </div>,
    document.body
  );
};

/* =============================================================================
   SHELL
   ============================================================================= */
const ShelterSidebar = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setUser(getUserFromToken());
  }, []);

  const isTestUser = user?.email?.toLowerCase() === 'admin@pawlife.vn';

  const menuItems = React.useMemo(
    () => (isTestUser ? enableAllItems(SHELTER_MENU) : SHELTER_MENU),
    [isTestUser]
  );

  const [openItems, setOpenItems] = useState<Record<string, boolean>>({ pets: true });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isWriteMessageOpen, setIsWriteMessageOpen] = useState(false);
  const [isAccountSheetOpen, setIsAccountSheetOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();

  const toggleOpen = (id: string) => setOpenItems((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleLogout = () => {
    startTransition(async () => {
      await logout();
    });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const avatarSrc: string = user?.image || '/images/logo/pawlife-logo.png';

  return (
    <>
      {/* ============ DESKTOP / TABLET (≥ md): sidebar thu gọn, hover mở rộng ============ */}
      <aside
        onMouseLeave={() => setIsProfileOpen(false)}
        className="group sticky top-0 left-0 hidden h-screen w-[88px] shrink-0 flex-col overflow-hidden whitespace-nowrap bg-white font-sans transition-[width] duration-300 ease-in-out z-50 md:flex hover:w-[272px]"
      >
        {/* 1. User Profile Area */}
        <div className="relative pt-10 px-[22px] group-hover:px-6 pb-6 flex flex-col transition-all duration-300" ref={profileRef}>
          <div
            className="flex items-center gap-3 cursor-pointer w-full"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <Image
              src={avatarSrc}
              alt="Profile Avatar"
              width={42}
              height={42}
              priority
              className="rounded-full object-cover border border-gray-100 hover:border-[#E89B5A] transition-colors shrink-0 bg-white"
            />
            <div className="flex flex-col justify-center min-w-0 opacity-0 group-hover:opacity-100 max-w-0 group-hover:max-w-[150px] transition-all duration-300 overflow-hidden">
              <h3 className="text-[16px] text-[#0D062D] font-light leading-tight truncate">
                {user?.name || user?.email || 'PawLife Shelter'}
              </h3>
              <p className="text-[14px] text-[#787486] font-light leading-tight mt-0.5 truncate">Admin</p>
            </div>

            <FiChevronDown
              size={20}
              className={classNames(
                'ml-auto transition-all duration-300 shrink-0 overflow-hidden max-w-0 group-hover:max-w-5 opacity-0 group-hover:opacity-100',
                isProfileOpen ? 'rotate-180 text-[#E89B5A]' : 'text-gray-400 hover:text-[#E89B5A]'
              )}
            />
          </div>

          {/* Dropdown Menu */}
          <div
            className={classNames(
              'absolute top-[84px] left-6 right-6 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden transition-all duration-200 origin-top',
              isProfileOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none',
              'hidden group-hover:block'
            )}
          >
            <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Tài khoản</p>
              <p className="text-[13px] font-medium text-[#0D062D] truncate">{user?.email || ''}</p>
            </div>
            <button
              onClick={handleLogout}
              disabled={isPending}
              className="w-full flex items-center gap-3 px-4 py-3 text-[14px] font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <FiLogOut size={18} />
              <span>{isPending ? 'Đang xử lý...' : 'Đăng xuất'}</span>
            </button>
          </div>
        </div>

        <div className="w-[44px] group-hover:w-[85%] mx-auto h-px bg-[#F1F1F1] mb-5 transition-all duration-300" />

        {/* 2. Menu Navigation */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {menuItems.map((item) => (
            <SidebarItem key={item.id} item={item} isOpen={(id) => !!openItems[id]} toggleOpen={toggleOpen} />
          ))}
          <div className="w-[44px] group-hover:w-[85%] mx-auto h-px bg-[#F1F1F1] my-4 transition-all duration-300" />
        </div>

        {/* 3. Thoughts Time Card */}
        <div className="px-6 mb-5 mt-2">
          <div className="relative w-full drop-shadow-[0_6px_16px_rgba(255,210,100,0.25)]">
            <div className="relative w-full bg-gradient-to-b from-[#FFFDF4] to-[#FFE07A] rounded-[24px] transition-all duration-300 h-[56px] group-hover:h-[205px] flex flex-col items-center">
              <div className="absolute left-1/2 -translate-x-1/2 top-0 group-hover:-top-7 w-[56px] h-[56px] bg-[#FFFDF4] rounded-full flex items-center justify-center transition-all duration-300 z-10">
                <div className="absolute w-[36px] h-[36px] bg-[#FFD700] rounded-full blur-[14px] opacity-80"></div>
                <Lightbulb size={26} className="relative z-20 text-[#FFB800]" fill="#FFB800" strokeWidth={1} />
              </div>

              <div className="absolute top-8 left-0 w-full px-5 opacity-0 group-hover:opacity-100 flex flex-col items-center pointer-events-none group-hover:pointer-events-auto transition-all duration-300 z-0">
                <h4 className="text-[14px] font-regular text-[#1A1A1A] mb-3 tracking-wide mt-1">Thời gian suy ngẫm</h4>
                <p className="text-[12px] text-[#7A7565] text-center leading-[1.6] mb-6 font-light px-2 whitespace-normal">
                  Chúng tôi chưa nhận được thông báo nào, bạn có thể chia sẻ suy nghĩ của mình.
                </p>
                <button
                  type="button"
                  onClick={() => setIsWriteMessageOpen(true)}
                  className="w-full py-[11px] bg-[#FFFDF4]/50 rounded-full text-[14px] font-regular text-black border-[1px] border-white shadow-[0_2px_12px_rgba(255,200,0,0.15)] hover:bg-white hover:scale-[1.02] transition-all"
                >
                  Viết một tin nhắn
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ============ MOBILE (< md): tab bar dưới + sheet tài khoản ============ */}
      <MobileTabBar
        items={menuItems}
        avatarSrc={avatarSrc}
        accountOpen={isAccountSheetOpen}
        onOpenAccount={() => setIsAccountSheetOpen(true)}
      />
      <MobileAccountSheet
        open={isAccountSheetOpen}
        onClose={() => setIsAccountSheetOpen(false)}
        avatarSrc={avatarSrc}
        name={user?.name || user?.email || 'PawLife Shelter'}
        email={user?.email || ''}
        roleLabel="Admin"
        isPending={isPending}
        onLogout={handleLogout}
        onWriteMessage={() => {
          setIsAccountSheetOpen(false);
          setIsWriteMessageOpen(true);
        }}
      />

      {/* Đặt NGOÀI <aside> để vẫn hiện được khi aside bị ẩn trên mobile */}
      {isWriteMessageOpen && <WriteMessageModal onClose={() => setIsWriteMessageOpen(false)} />}
    </>
  );
};

export default React.memo(ShelterSidebar);