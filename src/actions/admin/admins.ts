"use server";
// Quản lý quản trị viên: chỉ quyền cao nhất
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/admin/guard";
import { logAudit } from "@/lib/admin/audit";
import { str, requireNote } from "@/lib/admin/form";
import { ALL_ROLES } from "@/lib/admin/permissions";
import type { AdminRoleType } from "@prisma/client";

export async function grantRole(fd: FormData) {
  const ctx = await requirePermission("admins.manage");
  const email = str(fd, "email").toLowerCase();
  const role = str(fd, "role") as AdminRoleType;
  const note = requireNote(fd);
  if (!ALL_ROLES.includes(role)) throw new Error("Vai trò không hợp lệ");

  const user = await db.user.findFirst({ where: { userName: email } });
  if (!user) throw new Error("Không tìm thấy tài khoản với email này");

  await db.$transaction([
    db.adminRoleAssignment.upsert({
      where: { userId_role: { userId: user.id, role } },
      update: {},
      create: { userId: user.id, role },
    }),
    db.user.update({ where: { id: user.id }, data: { role: "ADMIN" } }),
  ]);

  await logAudit({
    adminId: ctx.adminId, ip: ctx.ip, action: "ADMIN_GRANT_ROLE",
    targetType: "ADMIN", targetId: user.id, after: { role }, note,
  });
  revalidatePath("/admin/admins");
}

export async function revokeRole(fd: FormData) {
  const ctx = await requirePermission("admins.manage");
  const assignmentId = str(fd, "assignmentId");
  const note = requireNote(fd);
  const row = await db.adminRoleAssignment.findUnique({ where: { id: assignmentId } });
  if (!row) throw new Error("Không tồn tại");

  if (row.role === "SUPER_ADMIN") {
    const supers = await db.adminRoleAssignment.count({ where: { role: "SUPER_ADMIN" } });
    if (supers <= 1) throw new Error("Phải còn ít nhất một quản trị cao nhất");
  }

  await db.adminRoleAssignment.delete({ where: { id: assignmentId } });
  const remaining = await db.adminRoleAssignment.count({ where: { userId: row.userId } });
  if (remaining === 0) {
    await db.user.update({ where: { id: row.userId }, data: { role: "CUSTOMER" } });
  }

  await logAudit({
    adminId: ctx.adminId, ip: ctx.ip, action: "ADMIN_REVOKE_ROLE",
    targetType: "ADMIN", targetId: row.userId, before: { role: row.role }, note,
  });
  revalidatePath("/admin/admins");
}

export async function disableAdmin(fd: FormData) {
  const ctx = await requirePermission("admins.manage");
  const userId = str(fd, "userId");
  const note = requireNote(fd);
  if (userId === ctx.adminId) throw new Error("Không thể tự tắt tài khoản của mình");

  const roles = await db.adminRoleAssignment.findMany({ where: { userId } });
  if (roles.some((r) => r.role === "SUPER_ADMIN")) {
    const supers = await db.adminRoleAssignment.count({ where: { role: "SUPER_ADMIN" } });
    if (supers <= 1) throw new Error("Không thể tắt quản trị cao nhất cuối cùng");
  }

  await db.$transaction([
    db.adminRoleAssignment.deleteMany({ where: { userId } }),
    db.user.update({ where: { id: userId }, data: { role: "CUSTOMER" } }),
  ]);

  await logAudit({
    adminId: ctx.adminId, ip: ctx.ip, action: "ADMIN_DISABLE",
    targetType: "ADMIN", targetId: userId,
    before: { roles: roles.map((r) => r.role) }, after: { role: "CUSTOMER", roles: [] }, note,
  });
  revalidatePath("/admin/admins");
}
