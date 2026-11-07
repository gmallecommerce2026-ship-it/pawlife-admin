"use server";
// Pawly Place: duyệt đề xuất, quản lý địa điểm đã duyệt, thú cưng tại quán, gộp trùng, danh mục & tiện ích
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/admin/guard";
import { logAudit } from "@/lib/admin/audit";
import { str, num, requireNote } from "@/lib/admin/form";
import { recalcPlaceRating } from "@/lib/admin/rating";


function readProposal(fd: FormData) {
  const name = str(fd, "name");
  const address = str(fd, "address");
  const lat = num(fd, "lat");
  const lng = num(fd, "lng");
  if (!name || !address || lat === null || lng === null) throw new Error("Thiếu tên, địa chỉ hoặc tọa độ");
  return {
    name,
    category: str(fd, "category") || "Khác",
    address,
    lat,
    lng,
    phone: str(fd, "phone") || null,
    website: str(fd, "website") || null,
    description: str(fd, "description") || null,
  };
}

export async function approveProposal(fd: FormData) {
  const ctx = await requirePermission("places.write");
  const id = str(fd, "id");
  const note = requireNote(fd);
  const data = readProposal(fd);

  const proposal = await db.placeProposal.findUnique({ where: { id } });
  if (!proposal) throw new Error("Đề xuất không tồn tại");
  if (proposal.status === "APPROVED") throw new Error("Đề xuất đã được duyệt");

  const result = await db.$transaction(async (tx) => {
    const { website: _website, ...placeData } = data; // Place không có trường website
    const place = await tx.place.create({ data: placeData });
    const updated = await tx.placeProposal.update({
      where: { id },
      data: { ...data, status: "APPROVED", placeId: place.id, rejectReason: null, infoRequest: null },
    });
    await tx.notification.create({
      data: {
        userId: proposal.submitterId,
        title: "Đề xuất địa điểm đã được duyệt",
        body: `"${data.name}" đã được thêm vào Pawly Place. Cảm ơn bạn!`,
      },
    });
    return { place, updated };
  });

  await logAudit({
    adminId: ctx.adminId, ip: ctx.ip, action: "PROPOSAL_APPROVE",
    targetType: "PLACE_PROPOSAL", targetId: id,
    before: { status: proposal.status }, after: { status: "APPROVED", placeId: result.place.id }, note,
  });
  revalidatePath("/admin/place-proposals");
  revalidatePath("/admin/places");
  redirect(`/admin/place-proposals?id=${id}`);
}

export async function rejectProposal(fd: FormData) {
  const ctx = await requirePermission("places.write");
  const id = str(fd, "id");
  const note = requireNote(fd);
  const template = str(fd, "reasonTemplate");
  const custom = str(fd, "reasonCustom");
  const reason = [template && template !== "_custom" ? template : "", custom].filter(Boolean).join(". ");
  if (!reason) throw new Error("Bắt buộc nhập lý do từ chối (chọn mẫu hoặc nhập)");

  const proposal = await db.placeProposal.findUnique({ where: { id } });
  if (!proposal) throw new Error("Đề xuất không tồn tại");

  await db.$transaction([
    db.placeProposal.update({ where: { id }, data: { status: "REJECTED", rejectReason: reason } }),
    db.notification.create({
      data: {
        userId: proposal.submitterId,
        title: "Đề xuất địa điểm bị từ chối",
        body: `"${proposal.name}" chưa được duyệt. Lý do: ${reason}`,
      },
    }),
  ]);

  await logAudit({
    adminId: ctx.adminId, ip: ctx.ip, action: "PROPOSAL_REJECT",
    targetType: "PLACE_PROPOSAL", targetId: id,
    before: { status: proposal.status }, after: { status: "REJECTED", rejectReason: reason }, note,
  });
  revalidatePath("/admin/place-proposals");
}

export async function requestProposalInfo(fd: FormData) {
  const ctx = await requirePermission("places.write");
  const id = str(fd, "id");
  const note = requireNote(fd);
  const request = str(fd, "infoRequest");
  if (!request) throw new Error("Nhập nội dung cần bổ sung");

  const proposal = await db.placeProposal.findUnique({ where: { id } });
  if (!proposal) throw new Error("Đề xuất không tồn tại");

  await db.$transaction([
    db.placeProposal.update({ where: { id }, data: { status: "NEEDS_INFO", infoRequest: request } }),
    db.notification.create({
      data: {
        userId: proposal.submitterId,
        title: "Cần bổ sung thông tin đề xuất",
        body: `"${proposal.name}": ${request}`,
      },
    }),
  ]);

  await logAudit({
    adminId: ctx.adminId, ip: ctx.ip, action: "PROPOSAL_REQUEST_INFO",
    targetType: "PLACE_PROPOSAL", targetId: id,
    before: { status: proposal.status }, after: { status: "NEEDS_INFO", infoRequest: request }, note,
  });
  revalidatePath("/admin/place-proposals");
}

export async function savePlace(fd: FormData) {
  const ctx = await requirePermission("places.write");
  const id = str(fd, "id");
  const note = requireNote(fd);
  const name = str(fd, "name");
  if (!name) throw new Error("Thiếu tên địa điểm");

  const before = await db.place.findUnique({ where: { id } });
  if (!before) throw new Error("Địa điểm không tồn tại");

  const after = await db.place.update({
    where: { id },
    data: {
      name,
      category: str(fd, "category") || "Khác",
      city: str(fd, "city") || null,
      address: str(fd, "address"),
      phone: str(fd, "phone") || null,
      description: str(fd, "description") || null,
      openingHours: str(fd, "openingHours") || null,
      amenities: str(fd, "amenities") || null,
      menuText: str(fd, "menuText") || null,
      coverUrl: str(fd, "coverUrl") || null,
      imageUrls: str(fd, "imageUrls") || null,
      lat: num(fd, "lat") ?? before.lat,
      lng: num(fd, "lng") ?? before.lng,
    },
  });
  await logAudit({
    adminId: ctx.adminId, ip: ctx.ip, action: "PLACE_UPDATE",
    targetType: "PLACE", targetId: id, before, after, note,
  });
  revalidatePath(`/admin/places/${id}`);
}

export async function setPlaceHidden(fd: FormData) {
  const ctx = await requirePermission("places.write");
  const id = str(fd, "id");
  const note = requireNote(fd); // cũng là lý do ẩn
  const hide = str(fd, "hidden") === "1";
  const before = await db.place.findUnique({ where: { id } });
  if (!before) throw new Error("Địa điểm không tồn tại");
  const after = await db.place.update({
    where: { id },
    data: { isHidden: hide, hiddenReason: hide ? note : null },
  });
  await logAudit({
    adminId: ctx.adminId, ip: ctx.ip, action: hide ? "PLACE_HIDE" : "PLACE_SHOW",
    targetType: "PLACE", targetId: id,
    before: { isHidden: before.isHidden }, after: { isHidden: after.isHidden }, note,
  });
  revalidatePath("/admin/places");
  revalidatePath(`/admin/places/${id}`);
}

export async function addPlacePet(fd: FormData) {
  const ctx = await requirePermission("places.write");
  const placeId = str(fd, "placeId");
  const note = requireNote(fd);
  const name = str(fd, "name");
  if (!name) throw new Error("Thiếu tên thú cưng");
  const pet = await db.placePet.create({
    data: { placeId, name, species: str(fd, "species") || "Khác", imageUrl: str(fd, "imageUrl") || null },
  });
  await logAudit({
    adminId: ctx.adminId, ip: ctx.ip, action: "PLACE_PET_ADD",
    targetType: "PLACE", targetId: placeId, after: pet, note,
  });
  revalidatePath(`/admin/places/${placeId}`);
}

export async function removePlacePet(fd: FormData) {
  const ctx = await requirePermission("places.write");
  const placeId = str(fd, "placeId");
  const petId = str(fd, "petId");
  const note = requireNote(fd);
  const pet = await db.placePet.findUnique({ where: { id: petId } });
  if (!pet) throw new Error("Thú cưng không tồn tại");
  await db.placePet.delete({ where: { id: petId } });
  await logAudit({
    adminId: ctx.adminId, ip: ctx.ip, action: "PLACE_PET_REMOVE",
    targetType: "PLACE", targetId: placeId, before: pet, note,
  });
  revalidatePath(`/admin/places/${placeId}`);
}

/** Gộp địa điểm trùng: đánh giá của nguồn được chuyển sang địa điểm gốc, nguồn bị xóa */
export async function mergePlaces(fd: FormData) {
  const ctx = await requirePermission("places.write");
  const sourceId = str(fd, "sourceId");
  const targetId = str(fd, "targetId");
  const note = requireNote(fd);
  if (!targetId || sourceId === targetId) throw new Error("Chọn địa điểm gốc khác với địa điểm nguồn");

  const [source, target] = await Promise.all([
    db.place.findUnique({ where: { id: sourceId } }),
    db.place.findUnique({ where: { id: targetId } }),
  ]);
  if (!source || !target) throw new Error("Không tìm thấy địa điểm");

  await db.$transaction([
    db.placeReview.updateMany({ where: { placeId: sourceId }, data: { placeId: targetId } }),
    db.place.delete({ where: { id: sourceId } }),
  ]);
  await recalcPlaceRating(targetId);

  await logAudit({
    adminId: ctx.adminId, ip: ctx.ip, action: "PLACE_MERGE",
    targetType: "PLACE", targetId,
    before: { mergedSource: source }, after: { targetId, reviewsMovedFrom: sourceId }, note,
  });
  revalidatePath("/admin/places");
  redirect(`/admin/places/${targetId}`);
}

export async function addTaxonomy(fd: FormData) {
  const ctx = await requirePermission("places.write");
  const kind = str(fd, "kind");
  const name = str(fd, "name");
  const note = requireNote(fd);
  if (!name) throw new Error("Thiếu tên");
  if (kind === "category") {
    const row = await db.placeCategory.create({ data: { name } });
    await logAudit({ adminId: ctx.adminId, ip: ctx.ip, action: "CATEGORY_ADD", targetType: "PLACE_CATEGORY", targetId: row.id, after: row, note });
  } else {
    const row = await db.amenity.create({ data: { name } });
    await logAudit({ adminId: ctx.adminId, ip: ctx.ip, action: "AMENITY_ADD", targetType: "AMENITY", targetId: row.id, after: row, note });
  }
  revalidatePath("/admin/places/settings");
}

export async function toggleTaxonomy(fd: FormData) {
  const ctx = await requirePermission("places.write");
  const kind = str(fd, "kind");
  const id = str(fd, "id");
  const note = requireNote(fd);
  if (kind === "category") {
    const row = await db.placeCategory.findUnique({ where: { id } });
    if (!row) throw new Error("Không tồn tại");
    const after = await db.placeCategory.update({ where: { id }, data: { isVisible: !row.isVisible } });
    await logAudit({ adminId: ctx.adminId, ip: ctx.ip, action: "CATEGORY_TOGGLE", targetType: "PLACE_CATEGORY", targetId: id, before: { isVisible: row.isVisible }, after: { isVisible: after.isVisible }, note });
  } else {
    const row = await db.amenity.findUnique({ where: { id } });
    if (!row) throw new Error("Không tồn tại");
    const after = await db.amenity.update({ where: { id }, data: { isVisible: !row.isVisible } });
    await logAudit({ adminId: ctx.adminId, ip: ctx.ip, action: "AMENITY_TOGGLE", targetType: "AMENITY", targetId: id, before: { isVisible: row.isVisible }, after: { isVisible: after.isVisible }, note });
  }
  revalidatePath("/admin/places/settings");
}
