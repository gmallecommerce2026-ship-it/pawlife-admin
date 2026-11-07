"use server";
// Hàng đợi báo cáo tập trung + kiểm duyệt đánh giá. Một quyết định áp dụng cho mọi báo cáo của cùng một đối tượng.
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/admin/guard";
import { logAudit } from "@/lib/admin/audit";
import { str, requireNote } from "@/lib/admin/form";
import { recalcPlaceRating } from "@/lib/admin/rating";
import type { ReportTargetType } from "@prisma/client";

type Decision = "IN_PROGRESS" | "RESOLVE" | "DISMISS" | "HIDE";

export async function actOnReportTarget(fd: FormData) {
  const ctx = await requirePermission("reports.write");
  const targetType = str(fd, "targetType") as ReportTargetType;
  const targetId = str(fd, "targetId");
  const decision = str(fd, "decision") as Decision;
  const note = requireNote(fd);
  if (!["IN_PROGRESS", "RESOLVE", "DISMISS", "HIDE"].includes(decision)) throw new Error("Quyết định không hợp lệ");

  if (decision === "IN_PROGRESS") {
    await db.report.updateMany({
      where: { targetType, targetId, status: "NEW" },
      data: { status: "IN_PROGRESS" },
    });
    await logAudit({ adminId: ctx.adminId, ip: ctx.ip, action: "REPORT_IN_PROGRESS", targetType, targetId, note });
    revalidatePath("/admin/reports");
    revalidatePath("/admin/reviews");
    return;
  }

  const openReports = await db.report.findMany({
    where: { targetType, targetId, status: { in: ["NEW", "IN_PROGRESS"] } },
    select: { id: true },
  });

  let effect = "Chỉ đóng báo cáo";

  if (decision === "HIDE") {
    switch (targetType) {
      case "EVENT":
        await db.event.update({ where: { id: targetId }, data: { status: "HIDDEN", statusNote: note } });
        effect = "Ẩn sự kiện";
        break;
      case "PLACE":
        await db.place.update({ where: { id: targetId }, data: { isHidden: true, hiddenReason: note } });
        effect = "Ẩn địa điểm";
        break;
      case "PLACE_REVIEW": {
        const review = await db.placeReview.update({
          where: { id: targetId },
          data: { isRemoved: true, removedReason: note },
        });
        await recalcPlaceRating(review.placeId);
        effect = "Gỡ đánh giá và tính lại điểm";
        break;
      }
      case "PET_CONTENT":
        await db.pet.update({ where: { id: targetId }, data: { status: "HIDDEN" } });
        effect = "Ẩn thú cưng";
        break;
      case "SHELTER": {
        const shelter = await db.shelter.update({ where: { id: targetId }, data: { status: "SUSPENDED" } });
        await db.notification.create({
          data: {
            userId: shelter.ownerId,
            title: "Shelter bị đình chỉ",
            body: "Shelter của bạn tạm bị đình chỉ do vi phạm chính sách nội dung.",
          },
        });
        effect = "Đình chỉ shelter";
        break;
      }
      default:
        effect = "Không có đối tượng nội dung để ẩn, chỉ đóng báo cáo";
    }
  }

  const status = decision === "DISMISS" ? "DISMISSED" : "RESOLVED";
  if (openReports.length) {
    await db.report.updateMany({
      where: { id: { in: openReports.map((r) => r.id) } },
      data: { status },
    });
  }

  await logAudit({
    adminId: ctx.adminId,
    ip: ctx.ip,
    action: `REPORT_${decision}`,
    targetType,
    targetId,
    before: { openReports: openReports.length },
    after: { status, effect },
    note,
  });

  revalidatePath("/admin/reports");
  revalidatePath("/admin/reviews");
}
