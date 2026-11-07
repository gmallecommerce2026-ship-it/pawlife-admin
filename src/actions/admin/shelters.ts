"use server";
// Quản lý shelter: duyệt / từ chối / đình chỉ / mở lại / sửa hồ sơ
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/admin/guard";
import { logAudit } from "@/lib/admin/audit";
import { str, num, requireNote } from "@/lib/admin/form";
import type { ShelterStatus } from "@prisma/client";

async function changeStatus(
  fd: FormData,
  next: ShelterStatus,
  action: string,
  notice: { title: string; body: string },
  reasonRequired: boolean
) {
  const ctx = await requirePermission("shelters.write");
  const id = str(fd, "id");
  const note = requireNote(fd);
  const reason = str(fd, "reason");
  if (reasonRequired && !reason) throw new Error("Bắt buộc nhập lý do gửi cho shelter");

  const before = await db.shelter.findUnique({ where: { id } });
  if (!before) throw new Error("Shelter không tồn tại");

  const after = await db.shelter.update({
    where: { id },
    data: { status: next, statusNote: reason || null },
  });

  await db.notification.create({
    data: {
      userId: before.ownerId,
      title: notice.title,
      body: reason ? `${notice.body} Lý do: ${reason}` : notice.body,
    },
  });

  await logAudit({
    adminId: ctx.adminId,
    ip: ctx.ip,
    action,
    targetType: "SHELTER",
    targetId: id,
    before: { status: before.status, statusNote: before.statusNote },
    after: { status: after.status, statusNote: after.statusNote },
    note,
  });

  revalidatePath("/admin/shelters");
  revalidatePath(`/admin/shelters/${id}`);
}

export async function approveShelter(fd: FormData) {
  await changeStatus(
    fd,
    "APPROVED",
    "SHELTER_APPROVE",
    { title: "Shelter đã được duyệt", body: "Hồ sơ shelter của bạn đã được duyệt." },
    false
  );
}

export async function rejectShelter(fd: FormData) {
  await changeStatus(
    fd,
    "REJECTED",
    "SHELTER_REJECT",
    { title: "Hồ sơ shelter bị từ chối", body: "Hồ sơ shelter của bạn chưa được chấp nhận." },
    true
  );
}

export async function suspendShelter(fd: FormData) {
  await changeStatus(
    fd,
    "SUSPENDED",
    "SHELTER_SUSPEND",
    { title: "Shelter bị đình chỉ", body: "Shelter của bạn tạm bị đình chỉ." },
    true
  );
}

export async function reinstateShelter(fd: FormData) {
  await changeStatus(
    fd,
    "APPROVED",
    "SHELTER_REINSTATE",
    { title: "Shelter được mở lại", body: "Shelter của bạn đã được mở lại hoạt động." },
    false
  );
}

export async function updateShelter(fd: FormData) {
  const ctx = await requirePermission("shelters.write");
  const id = str(fd, "id");
  const note = requireNote(fd);

  const name = str(fd, "name");
  if (!name) throw new Error("Thiếu tên shelter");

  const before = await db.shelter.findUnique({ where: { id } });
  if (!before) throw new Error("Shelter không tồn tại");

  const data = {
    name,
    email: str(fd, "email") || null,
    phone: str(fd, "phone") || null,
    address: str(fd, "address") || null,
    lat: num(fd, "lat"),
    lng: num(fd, "lng"),
    description: str(fd, "description") || null,
    imageUrl: str(fd, "imageUrl") || null,
  };
  const after = await db.shelter.update({ where: { id }, data });

  // Ghi lại trước và sau khi sửa
  await logAudit({
    adminId: ctx.adminId,
    ip: ctx.ip,
    action: "SHELTER_UPDATE",
    targetType: "SHELTER",
    targetId: id,
    before,
    after,
    note,
  });

  revalidatePath(`/admin/shelters/${id}`);
}
