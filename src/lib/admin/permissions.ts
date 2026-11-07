// src/lib/admin/permissions.ts
import type { AdminRoleType } from "@prisma/client";

export const ALL_ROLES: AdminRoleType[] = [
  "SUPER_ADMIN",
  "SHELTER_APPROVER",
  "PLACE_APPROVER",
  "EVENT_MANAGER",
  "CONTENT_MODERATOR",
  "SUPPORT",
];

export const ROLE_LABELS: Record<AdminRoleType, string> = {
  SUPER_ADMIN: "Quản trị cao nhất",
  SHELTER_APPROVER: "Duyệt shelter",
  PLACE_APPROVER: "Duyệt địa điểm",
  EVENT_MANAGER: "Quản lý sự kiện",
  CONTENT_MODERATOR: "Kiểm duyệt nội dung",
  SUPPORT: "Hỗ trợ (chỉ xem)",
};

/**
 * Ma trận quyền. SUPER_ADMIN luôn có mọi quyền.
 * Quyền rỗng [] = chỉ SUPER_ADMIN.
 */
export const PERMISSIONS = {
  dashboard: ALL_ROLES,
  "shelters.read": ["SHELTER_APPROVER", "SUPPORT"],
  "shelters.write": ["SHELTER_APPROVER"],
  "shelters.support": ["SHELTER_APPROVER", "SUPPORT"], // vào dashboard shelter để hỗ trợ (chỉ xem)
  "support.write": [], // bật chế độ sửa khi hỗ trợ: chỉ quyền cao nhất
  "events.read": ["EVENT_MANAGER", "SUPPORT"],
  "events.write": ["EVENT_MANAGER"],
  "organizers.read": ["EVENT_MANAGER", "SUPPORT"],
  "organizers.write": ["EVENT_MANAGER"],
  "places.read": ["PLACE_APPROVER", "SUPPORT"],
  "places.write": ["PLACE_APPROVER"],
  "reports.read": ["CONTENT_MODERATOR", "SUPPORT"],
  "reports.write": ["CONTENT_MODERATOR"],
  "users.read": ["CONTENT_MODERATOR", "SUPPORT"],
  "users.lock": ["CONTENT_MODERATOR"],
  "stats.read": ["SUPPORT"],
  "audit.read": [],
  "admins.manage": [],
} as const satisfies Record<string, readonly AdminRoleType[]>;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(roles: AdminRoleType[], permission: Permission): boolean {
  if (roles.includes("SUPER_ADMIN")) return true;
  return (PERMISSIONS[permission] as readonly AdminRoleType[]).some((r) => roles.includes(r));
}
