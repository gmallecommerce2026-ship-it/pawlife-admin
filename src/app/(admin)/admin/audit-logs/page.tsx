// Nhật ký thao tác: ai, làm gì, đối tượng nào, lúc nào, từ IP nào. Có trước/sau. Ghi cả truy cập bị từ chối.
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/admin/guard";
import { fmtDate, parseInt0, maskEmail } from "@/lib/admin/format";
import { buildAuditWhere } from "@/lib/admin/auditQuery";
import { PageHeader, Badge, Card, EmptyState, Pager, inputCls, btnVariant } from "@/components/admin/ui";

const PAGE = 50;

function pretty(json: string | null) {
  if (!json) return "—";
  try {
    return JSON.stringify(JSON.parse(json), null, 2);
  } catch {
    return json;
  }
}

export default async function AuditLogsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requirePermission("audit.read");
  const sp = await searchParams;
  const page = parseInt0(sp.page);
  const where = buildAuditWhere(sp);

  const [logs, total, admins] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE,
      take: PAGE,
      include: { admin: { select: { userName: true, fullName: true } } },
    }),
    db.auditLog.count({ where }),
    db.user.findMany({ where: { adminRoles: { some: {} } }, select: { id: true, fullName: true, userName: true } }),
  ]);

  const query = {
    adminId: sp.adminId, targetType: sp.targetType, targetId: sp.targetId,
    outcome: sp.outcome, from: sp.from, to: sp.to,
  };
  const exportHref = `/admin/audit-logs/export?${new URLSearchParams(
    Object.entries(query).filter(([, v]) => v) as [string, string][]
  ).toString()}`;

  return (
    <>
      <PageHeader
        title="Nhật ký thao tác"
        description="Mọi thao tác quan trọng và các lần truy cập bị từ chối"
        actions={<a href={exportHref} className={btnVariant.ghost}>Xuất CSV</a>}
      />

      <form className="mb-5 grid gap-3 rounded-2xl border border-gray-100 bg-white p-4 md:grid-cols-6">
        <select name="adminId" defaultValue={sp.adminId ?? ""} className={inputCls}>
          <option value="">Mọi admin</option>
          {admins.map((a) => <option key={a.id} value={a.id}>{a.fullName ?? maskEmail(a.userName)}</option>)}
        </select>
        <select name="targetType" defaultValue={sp.targetType ?? ""} className={inputCls}>
          <option value="">Mọi loại đối tượng</option>
          {["SHELTER", "EVENT", "ORGANIZER", "PLACE", "PLACE_PROPOSAL", "PLACE_CATEGORY", "AMENITY", "PLACE_REVIEW", "USER", "ADMIN", "REPORT", "PERMISSION", "ADOPTION_APPLICATION"].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <input name="targetId" defaultValue={sp.targetId ?? ""} placeholder="ID đối tượng" className={inputCls} />
        <select name="outcome" defaultValue={sp.outcome ?? ""} className={inputCls}>
          <option value="">Mọi kết quả</option>
          <option value="SUCCESS">Thành công</option>
          <option value="DENIED">Bị từ chối</option>
        </select>
        <input type="date" name="from" defaultValue={sp.from ?? ""} className={inputCls} />
        <div className="flex gap-2">
          <input type="date" name="to" defaultValue={sp.to ?? ""} className={inputCls} />
          <button className={btnVariant.primary}>Lọc</button>
        </div>
      </form>

      {logs.length === 0 ? (
        <EmptyState text="Không có nhật ký phù hợp" />
      ) : (
        <div className="space-y-2">
          {logs.map((l) => (
            <Card key={l.id} className="!p-4">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="text-gray-500">{fmtDate(l.createdAt)}</span>
                <span className="font-semibold">{l.admin.fullName ?? maskEmail(l.admin.userName)}</span>
                <Badge tone={l.outcome === "DENIED" ? "red" : "green"}>{l.action}</Badge>
                <span className="text-gray-600">{l.targetType} <span className="font-mono text-xs">{l.targetId}</span></span>
                <span className="text-xs text-gray-400">IP {l.ip ?? "—"}</span>
              </div>
              <p className="mt-2 text-sm text-gray-700">Ghi chú: {l.note}</p>
              {(l.before || l.after) && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs font-semibold text-[#c49b63]">Xem thay đổi trước / sau</summary>
                  <div className="mt-2 grid gap-3 md:grid-cols-2">
                    <pre className="max-h-64 overflow-auto rounded-lg bg-gray-50 p-3 text-xs"><strong>Trước</strong>{"\n"}{pretty(l.before)}</pre>
                    <pre className="max-h-64 overflow-auto rounded-lg bg-gray-50 p-3 text-xs"><strong>Sau</strong>{"\n"}{pretty(l.after)}</pre>
                  </div>
                </details>
              )}
            </Card>
          ))}
        </div>
      )}

      <Pager page={page} pageSize={PAGE} total={total} basePath="/admin/audit-logs" query={query} />
    </>
  );
}
