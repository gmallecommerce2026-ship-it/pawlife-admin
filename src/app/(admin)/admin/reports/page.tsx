// Hàng đợi báo cáo tập trung: mọi loại (sự kiện, đánh giá, thú cưng, shelter, Pawly Place, quét tag)
// Gom theo đối tượng; đối tượng có nhiều báo cáo lên đầu.
import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/admin/guard";
import { hasPermission } from "@/lib/admin/permissions";
import { fmtDate } from "@/lib/admin/format";
import { REPORT_TARGET_LABELS, REPORT_STATUS_LABELS } from "@/lib/admin/constants";
import { Badge, Card, EmptyState, TabLinks, inputCls, btnVariant } from "@/components/admin/ui";
import ActionForm from "@/components/admin/ActionForm";
import { actOnReportTarget } from "@/actions/admin/moderation";
import type { ReportTargetType, ReportStatus } from "@prisma/client";

const TYPES = Object.keys(REPORT_TARGET_LABELS) as ReportTargetType[];
const DETAIL_HREF: Partial<Record<ReportTargetType, string>> = {
  EVENT: "/admin/events",
  PLACE: "/admin/places",
  SHELTER: "/admin/shelters",
  PLACE_REVIEW: "/admin/reviews",
};

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const ctx = await requirePermission("reports.read");
  const canWrite = hasPermission(ctx.roles, "reports.write");
  const sp = await searchParams;
  const type = TYPES.find((t) => t === sp.type);
  const view = sp.view === "closed" ? "closed" : "open";
  const statuses: ReportStatus[] = view === "open" ? ["NEW", "IN_PROGRESS"] : ["RESOLVED", "DISMISSED"];

  const reports = await db.report.findMany({
    where: { status: { in: statuses }, ...(type ? { targetType: type } : {}) },
    orderBy: { createdAt: "asc" },
    take: 500,
  });

  // Gom theo (loại, đối tượng)
  const groups = new Map<string, { type: ReportTargetType; targetId: string; count: number; reasons: string[]; first: Date; last: Date; statuses: Set<ReportStatus> }>();
  for (const r of reports) {
    const key = `${r.targetType}:${r.targetId}`;
    const g = groups.get(key) ?? { type: r.targetType, targetId: r.targetId, count: 0, reasons: [], first: r.createdAt, last: r.createdAt, statuses: new Set() };
    g.count++;
    g.last = r.createdAt;
    if (g.reasons.length < 3) g.reasons.push(r.reason);
    g.statuses.add(r.status);
    groups.set(key, g);
  }
  const rows = [...groups.values()].sort((a, b) => b.count - a.count || a.first.getTime() - b.first.getTime());

  const countsRaw = await db.report.groupBy({ by: ["status"], _count: { _all: true } });
  const countOpen = countsRaw.filter((c) => c.status === "NEW" || c.status === "IN_PROGRESS").reduce((s, c) => s + c._count._all, 0);

  const qs = (extra: Record<string, string>) => {
    const p = new URLSearchParams({ view, ...(type ? { type } : {}), ...extra });
    return `/admin/reports?${p.toString()}`;
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1d150b]">Hàng đợi báo cáo</h1>
        <p className="mt-1 text-sm text-gray-500">{countOpen} báo cáo đang mở. Đối tượng nhiều báo cáo được đẩy lên đầu. Mọi quyết định cần ghi chú nội bộ.</p>
      </div>

      <TabLinks
        items={[
          { href: qs({}).replace(`view=${view}`, "view=open"), label: "Đang mở", active: view === "open" },
          { href: qs({}).replace(`view=${view}`, "view=closed"), label: "Đã đóng", active: view === "closed" },
        ]}
      />

      <form className="mb-5 flex flex-wrap gap-2">
        <input type="hidden" name="view" value={view} />
        <select name="type" defaultValue={type ?? ""} className={`${inputCls} max-w-xs`}>
          <option value="">Mọi loại báo cáo</option>
          {TYPES.map((t) => <option key={t} value={t}>{REPORT_TARGET_LABELS[t]}</option>)}
        </select>
        <button className={btnVariant.ghost}>Lọc</button>
      </form>

      {rows.length === 0 ? (
        <EmptyState text="Không có báo cáo phù hợp" />
      ) : (
        <div className="space-y-3">
          {rows.map((g) => {
            const href = DETAIL_HREF[g.type];
            return (
              <Card key={`${g.type}:${g.targetId}`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="blue">{REPORT_TARGET_LABELS[g.type]}</Badge>
                      <Badge tone="red">{g.count} báo cáo</Badge>
                      {[...g.statuses].map((s) => <Badge key={s}>{REPORT_STATUS_LABELS[s]}</Badge>)}
                    </div>
                    <p className="mt-2 font-mono text-xs text-gray-500">
                      ID: {g.targetId}{" "}
                      {href && <Link href={`${href}/${g.targetId}`} className="font-sans font-semibold text-[#c49b63] hover:underline">Mở đối tượng →</Link>}
                    </p>
                    <ul className="mt-2 list-disc pl-5 text-sm text-gray-700">
                      {g.reasons.map((x, i) => <li key={i}>{x}</li>)}
                    </ul>
                    <p className="mt-2 text-xs text-gray-400">Từ {fmtDate(g.first)} đến {fmtDate(g.last)}</p>
                  </div>

                  {canWrite && view === "open" && (
                    <ActionForm action={actOnReportTarget} hidden={{ targetType: g.type, targetId: g.targetId }} label="Thực hiện" className="w-full md:w-80" confirmMessage="Xác nhận thực hiện quyết định này? Nếu là ẩn/gỡ, nội dung sẽ bị ảnh hưởng ngay." notePlaceholder="Ghi chú nội bộ (bắt buộc)">
                      <select name="decision" defaultValue="RESOLVE" className={inputCls}>
                        <option value="IN_PROGRESS">Đánh dấu đang xử lý</option>
                        <option value="HIDE">Ẩn / gỡ nội dung</option>
                        <option value="RESOLVE">Đóng (đã xử lý)</option>
                        <option value="DISMISS">Bỏ qua</option>
                      </select>
                    </ActionForm>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
