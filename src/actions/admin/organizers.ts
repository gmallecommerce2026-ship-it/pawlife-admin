"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/admin/guard";
import { logAudit } from "@/lib/admin/audit";
import { str, checked, requireNote } from "@/lib/admin/form";

function readOrganizer(fd: FormData) {
  const handle = str(fd, "handle").replace(/^@/, "").toLowerCase().replace(/[^a-z0-9_.]/g, "");
  const name = str(fd, "name");
  if (!handle || !name) throw new Error("Thiếu tên hoặc handle");
  return {
    handle,
    name,
    bio: str(fd, "bio") || null,
    avatarUrl: str(fd, "avatarUrl") || null,
    coverUrl: str(fd, "coverUrl") || null,
  };
}

export async function createOrganizer(fd: FormData) {
  const ctx = await requirePermission("organizers.write");
  const note = requireNote(fd);
  const data = readOrganizer(fd);
  const exists = await db.organizer.findUnique({ where: { handle: data.handle } });
  if (exists) throw new Error("Handle đã tồn tại");
  const created = await db.organizer.create({ data });
  await logAudit({
    adminId: ctx.adminId, ip: ctx.ip, action: "ORGANIZER_CREATE",
    targetType: "ORGANIZER", targetId: created.id, after: created, note,
  });
  revalidatePath("/admin/organizers");
  redirect(`/admin/organizers/${created.id}`);
}

export async function updateOrganizer(fd: FormData) {
  const ctx = await requirePermission("organizers.write");
  const id = str(fd, "id");
  const note = requireNote(fd);
  const data = readOrganizer(fd);
  const before = await db.organizer.findUnique({ where: { id } });
  if (!before) throw new Error("Organizer không tồn tại");
  const clash = await db.organizer.findFirst({ where: { handle: data.handle, NOT: { id } } });
  if (clash) throw new Error("Handle đã thuộc organizer khác");
  const after = await db.organizer.update({ where: { id }, data });
  await logAudit({
    adminId: ctx.adminId, ip: ctx.ip, action: "ORGANIZER_UPDATE",
    targetType: "ORGANIZER", targetId: id, before, after, note,
  });
  revalidatePath(`/admin/organizers/${id}`);
}

export async function toggleVerifyOrganizer(fd: FormData) {
  const ctx = await requirePermission("organizers.write");
  const id = str(fd, "id");
  const note = requireNote(fd);
  const before = await db.organizer.findUnique({ where: { id } });
  if (!before) throw new Error("Organizer không tồn tại");
  const after = await db.organizer.update({ where: { id }, data: { isVerified: !before.isVerified } });
  await logAudit({
    adminId: ctx.adminId, ip: ctx.ip, action: after.isVerified ? "ORGANIZER_VERIFY" : "ORGANIZER_UNVERIFY",
    targetType: "ORGANIZER", targetId: id,
    before: { isVerified: before.isVerified }, after: { isVerified: after.isVerified }, note,
  });
  revalidatePath("/admin/organizers");
  revalidatePath(`/admin/organizers/${id}`);
}
