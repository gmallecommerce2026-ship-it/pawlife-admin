// src/lib/admin/audit.ts
import { db } from "@/lib/db";

export type AuditEntry = {
  adminId: string;
  ip: string | null;
  action: string;
  targetType: string;
  targetId: string;
  before?: unknown;
  after?: unknown;
  note: string;
  outcome?: "SUCCESS" | "DENIED";
};

/** Ghi lại mọi thao tác quan trọng: ai, làm gì, đối tượng nào, trước/sau, từ IP nào */
export async function logAudit(e: AuditEntry) {
  await db.auditLog.create({
    data: {
      adminId: e.adminId,
      action: e.action,
      targetType: e.targetType,
      targetId: e.targetId,
      before: e.before === undefined ? null : JSON.stringify(e.before),
      after: e.after === undefined ? null : JSON.stringify(e.after),
      note: e.note,
      ip: e.ip,
      outcome: e.outcome ?? "SUCCESS",
    },
  });
}
