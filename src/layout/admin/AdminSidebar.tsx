// src/layout/admin/AdminSidebar.tsx
'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  FiHome, FiUsers, FiShoppingBag, FiBox, FiSettings, 
  FiLogOut, FiChevronDown, FiShield, FiPackage, 
  FiDollarSign, FiFileText, FiLayers
} from 'react-icons/fi';
import classNames from 'classnames';
import { logout } from '@/actions/logout';

interface MenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  path?: string;
  children?: MenuItem[];
}

const ADMIN_MENU: MenuItem[] = [
  { id: 'dashboard', label: 'Tổng quan', icon: <FiHome size={20} />, path: '/admin/dashboard' },
  { id: 'orders', label: 'Đơn hàng', icon: <FiPackage size={20} />, path: '/admin/orders' },
  {
    id: 'products',
    label: 'Sản phẩm & Menu',
    icon: <FiBox size={20} />,
    children: [
      { id: 'all_products', label: 'Danh sách món', path: '/admin/products' },
      { id: 'create_product', label: 'Thêm món mới', path: '/admin/create-product' },
      { id: 'categories', label: 'Danh mục', path: '/admin/categories' },
      { id: 'create_category', label: 'Tạo danh mục', path: '/admin/create-category' },
    ]
  },
  {
    id: 'users',
    label: 'Khách hàng',
    icon: <FiUsers size={20} />,
    children: [
      { id: 'all_users', label: 'Danh sách người dùng', path: '/admin/users' },
    ]
  },
  { id: 'settings', label: 'Cài đặt', icon: <FiSettings size={20} />, path: '/admin/settings' },
];

const SidebarItem = ({ item, level = 0, isOpen, toggleOpen }: { 
  item: MenuItem, level?: number, isOpen: (id: string) => boolean, toggleOpen: (id: string) => void
}) => {
  const pathname = usePathname();
  const hasChildren = item.children && item.children.length > 0;
  
  const checkActive = (menuItemPath?: string) => menuItemPath ? pathname.startsWith(menuItemPath) : false;
  const isSelfActive = checkActive(item.path);
  const isChildActive = item.children?.some(child => checkActive(child.path));
  const isActive = isSelfActive || isChildActive;
  
  useEffect(() => {
    if (isChildActive && !isOpen(item.id)) toggleOpen(item.id);
  }, [pathname, isChildActive, item.id, isOpen, toggleOpen]);

  const handleClick = (e: React.MouseEvent) => {
    if (hasChildren) {
      e.preventDefault();
      toggleOpen(item.id);
    }
  };

  return (
    <div className="w-full select-none">
      <Link 
        href={item.path || '#'}
        onClick={handleClick}
        className={classNames(
          "flex items-center justify-between py-3 px-6 text-sm transition-all duration-200 cursor-pointer group hover:bg-stone-50",
          {
            // --- CẬP NHẬT STYLE: COFFEE THEME ---
            "text-[#c49b63] bg-[#c49b63]/10 font-bold border-r-[3px] border-[#c49b63]": isActive && level === 0,
            "text-gray-600": !isActive && level === 0,
            "pl-12 py-2.5": level === 1,
            "text-[#c49b63] font-medium": isSelfActive && level > 0,
            "text-gray-500 hover:text-[#c49b63]": !isSelfActive && level > 0,
          }
        )}
      >
        <div className="flex items-center gap-3">
          {level === 0 && (
            <span className={isActive ? "text-[#c49b63]" : "text-gray-400 group-hover:text-[#c49b63]"}>
              {item.icon}
            </span>
          )}
          <span className="truncate">{item.label}</span>
        </div>
        {hasChildren && (
          <FiChevronDown 
            size={16} 
            className={classNames("text-gray-400 transition-transform duration-200", isOpen(item.id) ? "rotate-180" : "")} 
          />
        )}
      </Link>
      
      <div className={classNames("overflow-hidden transition-all duration-300 bg-gray-50/50", isOpen(item.id) ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0")}>
        {item.children?.map(child => (
          <SidebarItem key={child.id} item={child} level={level + 1} isOpen={isOpen} toggleOpen={toggleOpen} />
        ))}
      </div>
    </div>
  );
};

const AdminSidebar = () => {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({ 'products': true });
  const [isPending, startTransition] = useTransition();
  const toggleOpen = (id: string) => setOpenItems(prev => ({ ...prev, [id]: !prev[id] }));
  const handleLogout = () => {
    startTransition(async () => {
        await logout();
    });
  };
  return (
    <aside className="fixed top-0 left-0 w-[260px] h-screen bg-white border-r border-gray-100 shadow-xl shadow-gray-200/50 z-50 flex flex-col font-sans">
      {/* Header Logo */}
      <div className="h-[80px] flex items-center px-6 border-b border-gray-100 gap-3">
        {/* Logo Icon cách điệu theo màu Coffee */}
        <div className="w-10 h-10 bg-[#1d150b] rounded-xl flex items-center justify-center text-[#c49b63] shadow-lg shadow-[#1d150b]/20">
          <FiShield size={20}/>
        </div>
        <div>
            <h1 className="font-bold text-lg text-[#1d150b] leading-tight font-sans">N.S Coffee</h1>
            <span className="text-[11px] text-gray-500 font-bold tracking-widest uppercase">Admin Panel</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar py-6 space-y-1">
        {ADMIN_MENU.map(item => (
          <SidebarItem key={item.id} item={item} isOpen={(id) => !!openItems[id]} toggleOpen={toggleOpen} />
        ))}
      </div>
      
      <div className="p-4 border-t border-gray-100 bg-gray-50/30">
        <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
            <FiLogOut size={18} /> <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
};

export default React.memo(AdminSidebar);