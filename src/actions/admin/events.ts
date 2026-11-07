"use server";
// Quản lý sự kiện: tạo, sửa, nhân bản, đổi trạng thái (đăng/ẩn/hủy/lưu trữ), ghim
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/admin/guard";
import { logAudit } from "@/lib/admin/audit";
import { str, num, checked, requireNote } from "@/lib/admin/form";
import { fromLocalInput } from "@/lib/admin/format";
import type { EventStatus } from "@prisma/client";

function readEvent(fd: FormData) {
  const titleVi = str(fd, "titleVi");
  const titleEn = str(fd, "titleEn");
  if (!titleVi || !titleEn) throw new Error("Thiếu tiêu đề (tiếng Việt và tiếng Anh)");

  const startsAt = fromLocalInput(str(fd, "startsAt"));
  if (!startsAt) throw new Error("Thiếu thời gian bắt đầu");
  const endsAt = fromLocalInput(str(fd, "endsAt"));
  if (endsAt && endsAt < startsAt) throw new Error("Thời gian kết thúc trước thời gian bắt đầu");

  return {
    titleVi,
    titleEn,
    descriptionVi: str(fd, "descriptionVi") || null,
    descriptionEn: str(fd, "descriptionEn") || null,
    startsAt,
    endsAt,
    area: str(fd, "area") || "Khác",
    locationName: str(fd, "locationName") || null,
    lat: num(fd, "lat"),
    lng: num(fd, "lng"),
    coverUrl: str(fd, "coverUrl") || null,
    galleryUrls: str(fd, "galleryUrls") || null,
    organizerId: str(fd, "organizerId") || null,
    pinned: checked(fd, "pinned"),
  };
}

export async function createEvent(fd: FormData) {
  const ctx = await requirePermission("events.write");
  const note = requireNote(fd);
  const data = readEvent(fd);
  const status = str(fd, "status") === "PUBLISHED" ? "PUBLISHED" : "DRAFT";

  const created = await db.event.create({ data: { ...data, status } });
  await logAudit({
    adminId: ctx.adminId, ip: ctx.ip, action: "EVENT_CREATE",
    targetType: "EVENT", targetId: created.id, after: created, note,
  });
  revalidatePath("/admin/events");
  redirect(`/admin/events/${created.id}`);
}

export async function updateEvent(fd: FormData) {
  const ctx = await requirePermission("events.write");
  const id = str(fd, "id");
  const note = requireNote(fd);
  const before = await db.event.findUnique({ where: { id } });
  if (!before) throw new Error("Sự kiện không tồn tại");

  const after = await db.event.update({ where: { id }, data: readEvent(fd) });
  await logAudit({
    adminId: ctx.adminId, ip: ctx.ip, action: "EVENT_UPDATE",
    targetType: "EVENT", targetId: id, before, after, note,
  });
  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${id}`);
  redirect(`/admin/events/${id}`);
}

export async function duplicateEvent(fd: FormData) {
  const ctx = await requirePermission("events.write");
  const id = str(fd, "id");
  const note = requireNote(fd);
  const src = await db.event.findUnique({ where: { id } });
  if (!src) throw new Error("Sự kiện không tồn tại");

  const { id: _id, createdAt, updatedAt, statusNote, ...rest } = src;
  const copy = await db.event.create({
    data: {
      ...rest,
      titleVi: `${src.titleVi} (bản sao)`,
      titleEn: `${src.titleEn} (copy)`,
      status: "DRAFT",
      pinned: false,
    },
  });
  await logAudit({
    adminId: ctx.adminId, ip: ctx.ip, action: "EVENT_DUPLICATE",
    targetType: "EVENT", targetId: copy.id, before: { sourceId: id }, after: copy, note,
  });
  revalidatePath("/admin/events");
  redirect(`/admin/events/${copy.id}/edit`);
}

const ALLOWED: EventStatus[] = ["DRAFT", "PUBLISHED", "HIDDEN", "CANCELLED", "ARCHIVED"];

export async function setEventStatus(fd: FormData) {
  const ctx = await requirePermission("events.write");
  const id = str(fd, "id");
  const note = requireNote(fd);
  const next = str(fd, "status") as EventStatus;
  if (!ALLOWED.includes(next)) throw new Error("Trạng thái không hợp lệ");

  const reason = str(fd, "reason");
  if (next === "CANCELLED" && !reason) throw new Error("Hủy sự kiện cần nhập lý do gửi cho người quan tâm");

  const before = await db.event.findUnique({ where: { id } });
  if (!before) throw new Error("Sự kiện không tồn tại");

  const after = await db.event.update({
    where: { id },
    data: { status: next, statusNote: reason || null },
  });

  // Hủy sự kiện: thông báo cho những người đã quan tâm
  if (next === "CANCELLED") {
    const interested = await db.eventInterest.findMany({ where: { eventId: id }, select: { userId: true } });
    if (interested.length) {
      await db.notification.createMany({
        data: interested.map((i) => ({
          userId: i.userId,
          title: "Sự kiện đã bị hủy",
          body: `"${before.titleVi}" đã bị hủy. Lý do: ${reason}`,
        })),
      });
    }
  }

  await logAudit({
    adminId: ctx.adminId, ip: ctx.ip, action: `EVENT_STATUS_${next}`,
    targetType: "EVENT", targetId: id,
    before: { status: before.status }, after: { status: after.status }, note,
  });
  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${id}`);
}

export async function togglePinEvent(fd: FormData) {
  const ctx = await requirePermission("events.write");
  const id = str(fd, "id");
  const note = requireNote(fd);
  const before = await db.event.findUnique({ where: { id } });
  if (!before) throw new Error("Sự kiện không tồn tại");
  const after = await db.event.update({ where: { id }, data: { pinned: !before.pinned } });
  await logAudit({
    adminId: ctx.adminId, ip: ctx.ip, action: "EVENT_PIN_TOGGLE",
    targetType: "EVENT", targetId: id,
    before: { pinned: before.pinned }, after: { pinned: after.pinned }, note,
  });
  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${id}`);
}
