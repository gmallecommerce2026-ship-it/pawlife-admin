"use server";
// Hỗ trợ shelter: vào dashboard shelter (mặc định chỉ xem). Chỉnh sửa chỉ khi quyền cao nhất bật.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/admin/guard";
import { logAudit } from "@/lib/admin/audit";
import { str, requireNote } from "@/lib/admin/form";
import { SUPPORT_COOKIE, SUPPORT_MINUTES, parseSupport, type SupportSession } from "@/lib/admin/support";

async function writeCookie(s: SupportSession | null) {
  const jar = await cookies();
  if (!s) {
    jar.delete({ name: SUPPORT_COOKIE, path: "/admin" });
    return;
  }
  jar.set(SUPPORT_COOKIE, JSON.stringify(s), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: SUPPORT_MINUTES * 60,
  });
}

async function currentSupport(shelterId: string): Promise<SupportSession> {
  const jar = await cookies();
  const s = parseSupport(jar.get(SUPPORT_COOKIE)?.value);
  if (!s || s.shelterId !== shelterId) throw new Error("Phiên hỗ trợ đã hết hạn hoặc không khớp shelter");
  return s;
}

export async function startSupport(fd: FormData) {
  const ctx = await requirePermission("shelters.support");
  const shelterId = str(fd, "shelterId");
  const note = requireNote(fd);

  const shelter = await db.shelter.findUnique({ where: { id: shelterId } });
  if (!shelter) throw new Error("Shelter không tồn tại");

  const now = Date.now();
  await writeCookie({
    shelterId,
    shelterName: shelter.name,
    adminId: ctx.adminId,
    startedAt: now,
    expiresAt: now + SUPPORT_MINUTES * 60_000,
    write: false, // mặc định chỉ xem
  });

  // Shelter được thông báo mỗi lần bị truy cập
  await db.notification.create({
    data: {
      userId: shelter.ownerId,
      title: "Quản trị viên đang truy cập shelter của bạn",
      body: `Admin đang vào dashboard để hỗ trợ bạn. Lý do: ${note}`,
    },
  });

  await logAudit({
    adminId: ctx.adminId, ip: ctx.ip, action: "SUPPORT_START",
    targetType: "SHELTER", targetId: shelterId, note,
  });
  redirect(`/admin/shelters/${shelterId}/support`);
}

export async function stopSupport(fd: FormData) {
  const ctx = await requirePermission("shelters.support");
  const shelterId = str(fd, "shelterId");
  await writeCookie(null);
  await logAudit({
    adminId: ctx.adminId, ip: ctx.ip, action: "SUPPORT_END",
    targetType: "SHELTER", targetId: shelterId, note: "Kết thúc phiên hỗ trợ",
  });
  redirect(`/admin/shelters/${shelterId}`);
}

export async function toggleSupportWrite(fd: FormData) {
  const ctx = await requirePermission("support.write");
  const shelterId = str(fd, "shelterId");
  const note = requireNote(fd);
  const s = await currentSupport(shelterId);
  const next = { ...s, write: !s.write };
  await writeCookie(next);
  await logAudit({
    adminId: ctx.adminId, ip: ctx.ip, action: next.write ? "SUPPORT_WRITE_ON" : "SUPPORT_WRITE_OFF",
    targetType: "SHELTER", targetId: shelterId,
    before: { write: s.write }, after: { write: next.write }, note,
  });
  revalidatePath(`/admin/shelters/${shelterId}/support`);
}

/** Chỉ thực hiện khi phiên đang bật chế độ sửa */
export async function supportUpdateApplication(fd: FormData) {
  const ctx = await requirePermission("support.write");
  const shelterId = str(fd, "shelterId");
  const applicationId = str(fd, "applicationId");
  const status = str(fd, "status");
  const note = requireNote(fd);
  const s = await currentSupport(shelterId);
  if (!s.write) throw new Error("Phiên đang ở chế độ chỉ xem");
  if (!["NEW", "IN_REVIEW", "APPROVED", "REJECTED"].includes(status)) throw new Error("Trạng thái không hợp lệ");

  const before = await db.adoptionApplication.findFirst({ where: { id: applicationId, shelterId } });
  if (!before) throw new Error("Đơn không thuộc shelter này");
  const after = await db.adoptionApplication.update({
    where: { id: applicationId },
    data: { status: status as "NEW" | "IN_REVIEW" | "APPROVED" | "REJECTED" },
  });

  await logAudit({
    adminId: ctx.adminId, ip: ctx.ip, action: "SUPPORT_APPLICATION_UPDATE",
    targetType: "ADOPTION_APPLICATION", targetId: applicationId,
    before: { status: before.status }, after: { status: after.status, asShelter: shelterId }, note,
  });
  revalidatePath(`/admin/shelters/${shelterId}/support`);
}
