// Xuất CSV nhật ký — chỉ quyền cao nhất
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminContext } from "@/lib/admin/guard";
import { hasPermission } from "@/lib/admin/permissions";
import { logAudit } from "@/lib/admin/audit";
import { buildAuditWhere } from "@/lib/admin/auditQuery";

const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;

export async function GET(req: NextRequest) {
  const ctx = await getAdminContext();
  if (!ctx) return new NextResponse("Unauthorized", { status: 401 });
  if (!hasPermission(ctx.roles, "audit.read")) {
    await logAudit({ adminId: ctx.adminId, ip: ctx.ip, action: "ACCESS_DENIED", targetType: "PERMISSION", targetId: "audit.read", note: "Xuất CSV bị từ chối", outcome: "DENIED" });
    return new NextResponse("Forbidden", { status: 403 });
  }

  const sp = Object.fromEntries(req.nextUrl.searchParams.entries());
  const rows = await db.auditLog.findMany({
    where: buildAuditWhere(sp),
    orderBy: { createdAt: "desc" },
    take: 10000,
    include: { admin: { select: { userName: true, fullName: true } } },
  });

  const header = ["Thời gian", "Admin", "Email admin", "Thao tác", "Loại đối tượng", "ID đối tượng", "Kết quả", "IP", "Ghi chú", "Trước", "Sau"];
  const lines = rows.map((r) =>
    [r.createdAt.toISOString(), r.admin.fullName ?? "", r.admin.userName, r.action, r.targetType, r.targetId, r.outcome, r.ip ?? "", r.note, r.before ?? "", r.after ?? ""]
      .map(esc)
      .join(",")
  );
  const csv = "\uFEFF" + [header.map(esc).join(","), ...lines].join("\r\n");

  await logAudit({ adminId: ctx.adminId, ip: ctx.ip, action: "AUDIT_EXPORT", targetType: "AUDIT_LOG", targetId: "csv", note: `Xuất ${rows.length} dòng nhật ký`, after: { rows: rows.length } });

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="audit-logs-${date}.csv"`,
    },
  });
}
