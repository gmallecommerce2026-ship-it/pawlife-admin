// src/lib/admin/menu.ts
import type { Permission } from "./permissions";

export type MenuItem = {
  href: string;
  label: string;
  short: string; // nhãn ngắn cho thanh tab dưới trên mobile
  icon: string; // tên icon, map ở Sidebar.tsx
  permission: Permission;
  section?: string;
};

export const ADMIN_MENU: MenuItem[] = [
  { href: "/admin/dashboard", label: "Tổng quan", short: "Tổng quan", icon: "home", permission: "dashboard" },

  { href: "/admin/shelters", label: "Shelter", short: "Shelter", icon: "shelter", permission: "shelters.read", section: "Shelter" },

  { href: "/admin/events", label: "Sự kiện", short: "Sự kiện", icon: "calendar", permission: "events.read", section: "Sự kiện" },
  { href: "/admin/organizers", label: "Organizer", short: "Organizer", icon: "users", permission: "organizers.read" },

  { href: "/admin/place-proposals", label: "Đề xuất địa điểm", short: "Đề xuất", icon: "inbox", permission: "places.read", section: "Pawly Place" },
  { href: "/admin/places", label: "Địa điểm đã duyệt", short: "Địa điểm", icon: "map", permission: "places.read" },
  { href: "/admin/places/settings", label: "Danh mục & tiện ích", short: "Danh mục", icon: "tag", permission: "places.write" },

  { href: "/admin/reviews", label: "Đánh giá bị báo cáo", short: "Đánh giá", icon: "star", permission: "reports.read", section: "Kiểm duyệt" },
  { href: "/admin/reports", label: "Hàng đợi báo cáo", short: "Báo cáo", icon: "flag", permission: "reports.read" },

  { href: "/admin/users", label: "Người dùng", short: "Người dùng", icon: "user", permission: "users.read", section: "Hệ thống" },
  { href: "/admin/audit-logs", label: "Nhật ký thao tác", short: "Nhật ký", icon: "log", permission: "audit.read" },
  { href: "/admin/admins", label: "Quản trị viên", short: "Admin", icon: "shield", permission: "admins.manage" },
];
