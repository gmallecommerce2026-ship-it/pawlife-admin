// src/lib/admin/guard.ts
import type { AdminRoleType } from "@prisma/client";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { hasPermission, type Permission } from "./permissions";
import { logAudit } from "./audit";
import { MOCK, MOCK_COOKIE } from "@/lib/mock/config";

export type AdminContext = {
  adminId: string;
  name: string;
  roles: AdminRoleType[];
  isSuper: boolean;
  ip: string | null;
};

function getIp(h: Headers): string | null {
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return h.get("x-real-ip");
}

export async function getAdminContext(): Promise<AdminContext | null> {
  if (MOCK) {
    // FE mock: phiên là cookie chứa id admin demo
    const id = (await cookies()).get(MOCK_COOKIE)?.value;
    if (!id) return null;
    const u = await db.user.findUnique({ where: { id } });
    if (!u || u.role !== "ADMIN") return null;
    const rows = await db.adminRoleAssignment.findMany({ where: { userId: id }, select: { role: true } });
    const roles = rows.map((r) => r.role);
    return { adminId: id, name: u.fullName ?? u.userName, roles, isSuper: roles.includes("SUPER_ADMIN"), ip: null };
  }

  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") return null;

  const rows = await db.adminRoleAssignment.findMany({
    where: { userId: session.user.id },
    select: { role: true },
  });
  const roles = rows.map((r) => r.role);
  const h = await headers();

  return {
    adminId: session.user.id,
    name: session.user.name ?? session.user.email ?? "Admin",
    roles,
    isSuper: roles.includes("SUPER_ADMIN"),
    ip: getIp(h),
  };
}

/**
 * Dùng ở đầu mọi trang/action admin. Không đủ quyền -> ghi nhật ký DENIED và chuyển hướng.
 */
export async function requirePermission(permission: Permission): Promise<AdminContext> {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/login");

  if (!hasPermission(ctx.roles, permission)) {
    await logAudit({
      adminId: ctx.adminId,
      ip: ctx.ip,
      action: "ACCESS_DENIED",
      targetType: "PERMISSION",
      targetId: permission,
      note: "Truy cập bị từ chối (thiếu quyền)",
      outcome: "DENIED",
    });
    redirect("/admin/forbidden");
  }
  return ctx;
}
