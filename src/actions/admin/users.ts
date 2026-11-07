"use server";
// Khóa tạm thời / vĩnh viễn và mở khóa người dùng. Admin không đọc được mật khẩu/OTP/2FA.
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/admin/guard";
import { logAudit } from "@/lib/admin/audit";
import { str, requireNote } from "@/lib/admin/form";

export async function lockUser(fd: FormData) {
  const ctx = await requirePermission("users.lock");
  const userId = str(fd, "userId");
  const note = requireNote(fd);
  const mode = str(fd, "mode");
  const days = Math.max(1, Math.min(365, Number(str(fd, "days")) || 7));

  if (userId === ctx.adminId) throw new Error("Không thể tự khóa chính mình");
  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) throw new Error("Người dùng không tồn tại");
  if (target.role === "ADMIN") throw new Error("Không thể khóa tài khoản quản trị viên tại đây");

  const data =
    mode === "PERMANENT"
      ? { lockedPermanently: true, lockedUntil: null, lockReason: note }
      : { lockedPermanently: false, lockedUntil: new Date(Date.now() + days * 86400_000), lockReason: note };

  const after = await db.user.update({ where: { id: userId }, data });

  await logAudit({
    adminId: ctx.adminId, ip: ctx.ip,
    action: mode === "PERMANENT" ? "USER_LOCK_PERMANENT" : `USER_LOCK_${days}D`,
    targetType: "USER", targetId: userId,
    before: { lockedUntil: target.lockedUntil, lockedPermanently: target.lockedPermanently },
    after: { lockedUntil: after.lockedUntil, lockedPermanently: after.lockedPermanently },
    note,
  });
  revalidatePath("/admin/users");
  revalidatePath("/admin/reviews");
}

export async function unlockUser(fd: FormData) {
  const ctx = await requirePermission("users.lock");
  const userId = str(fd, "userId");
  const note = requireNote(fd);
  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) throw new Error("Người dùng không tồn tại");
  const after = await db.user.update({
    where: { id: userId },
    data: { lockedPermanently: false, lockedUntil: null, lockReason: null },
  });
  await logAudit({
    adminId: ctx.adminId, ip: ctx.ip, action: "USER_UNLOCK",
    targetType: "USER", targetId: userId,
    before: { lockedUntil: target.lockedUntil, lockedPermanently: target.lockedPermanently },
    after: { lockedUntil: after.lockedUntil, lockedPermanently: after.lockedPermanently },
    note,
  });
  revalidatePath("/admin/users");
}
