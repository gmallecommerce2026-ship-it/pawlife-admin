// Bộ lọc nhật ký dùng chung cho trang và xuất CSV
import type { Prisma } from "@prisma/client";
import { fromLocalInput } from "./format";

export function buildAuditWhere(sp: Record<string, string | undefined>): Prisma.AuditLogWhereInput {
  const from = sp.from ? fromLocalInput(`${sp.from}T00:00`) : null;
  const to = sp.to ? fromLocalInput(`${sp.to}T23:59`) : null;
  return {
    ...(sp.adminId ? { adminId: sp.adminId } : {}),
    ...(sp.targetType ? { targetType: sp.targetType } : {}),
    ...(sp.targetId ? { targetId: sp.targetId } : {}),
    ...(sp.outcome ? { outcome: sp.outcome } : {}),
    ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
  };
}
