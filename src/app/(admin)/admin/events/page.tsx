import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/admin/guard";
import { hasPermission } from "@/lib/admin/permissions";
import { fmtDate, parseInt0, fromLocalInput } from "@/lib/admin/format";
import { PageHeader, Badge, DataTable, EmptyState, Pager, inputCls, btnVariant } from "@/components/admin/ui";
import type { EventStatus, Prisma } from "@prisma/client";

const STATUSES: EventStatus[] = ["DRAFT", "PUBLISHED", "HIDDEN", "CANCELLED", "ARCHIVED"];
const STATUS_LABEL: Record<EventStatus, string> = {
  DRAFT: "Nháp", PUBLISHED: "Đã đăng", HIDDEN: "Đã ẩn", CANCELLED: "Đã hủy", ARCHIVED: "Đã lưu trữ",
};
const TONE = { DRAFT: "gray", PUBLISHED: "green", HIDDEN: "yellow", CANCELLED: "red", ARCHIVED: "purple" } as const;
const PAGE = 20;

export default async function EventsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const ctx = await requirePermission("events.read");
  const sp = await searchParams;
  const page = parseInt0(sp.page);
  const status = STATUSES.find((s) => s.toString() === sp.status);
  const area = (sp.area ?? "").trim();
  const organizerId = sp.organizerId ?? "";
  const from = fromLocalInput(sp.from ? `${sp.from}T00:00` : "");
  const to = fromLocalInput(sp.to ? `${sp.to}T23:59` : "");

  const where: Prisma.EventWhereInput = {
    ...(status ? { status } : {}),
    ...(area ? { area: { contains: area } } : {}),
    ...(organizerId ? { organizerId } : {}),
    ...(from || to ? { startsAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
  };

  const [events, total, organizers] = await Promise.all([
    db.event.findMany({
      where,
      orderBy: [{ pinned: "desc" }, { startsAt: "desc" }],
      skip: (page - 1) * PAGE,
      take: PAGE,
      include: {
        organizer: { select: { name: true } },
        _count: { select: { interests: true, hides: true } },
      },
    }),
    db.event.count({ where }),
    db.organizer.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const canWrite = hasPermission(ctx.roles, "events.write");
  const query = { status: sp.status, area: area || undefined, organizerId: organizerId || undefined, from: sp.from, to: sp.to };

  return (
    <>
      <PageHeader
        title="Quản lý sự kiện"
        description="Tạo, sửa, đăng, ẩn, hủy và lưu trữ sự kiện"
        actions={canWrite && <Link href="/admin/events/new" className={btnVariant.primary}>+ Tạo sự kiện</Link>}
      />

      <form className="mb-5 grid gap-3 rounded-2xl border border-gray-100 bg-white p-4 md:grid-cols-6">
        <select name="status" defaultValue={sp.status ?? ""} className={inputCls}>
          <option value="">Mọi trạng thái</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
        <input name="area" defaultValue={area} placeholder="Khu vực" className={inputCls} />
        <select name="organizerId" defaultValue={organizerId} className={inputCls}>
          <option value="">Mọi organizer</option>
          {organizers.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <input type="date" name="from" defaultValue={sp.from ?? ""} className={inputCls} />
        <input type="date" name="to" defaultValue={sp.to ?? ""} className={inputCls} />
        <button className={btnVariant.primary}>Lọc</button>
      </form>

      {events.length === 0 ? (
        <EmptyState text="Không có sự kiện phù hợp bộ lọc" />
      ) : (
        <DataTable head={["Sự kiện", "Trạng thái", "Thời gian", "Khu vực", "Organizer", "Quan tâm / Ẩn", ""]}>
          {events.map((e) => (
            <tr key={e.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {e.pinned && <Badge tone="purple">Ghim</Badge>}
                  <span className="font-semibold text-gray-800">{e.titleVi}</span>
                </div>
                <span className="text-xs text-gray-400">{e.titleEn}</span>
              </td>
              <td className="px-4 py-3"><Badge tone={TONE[e.status]}>{STATUS_LABEL[e.status]}</Badge></td>
              <td className="px-4 py-3 text-gray-500">{fmtDate(e.startsAt)}</td>
              <td className="px-4 py-3 text-gray-500">{e.area}</td>
              <td className="px-4 py-3 text-gray-500">{e.organizer?.name ?? "—"}</td>
              <td className="px-4 py-3 text-gray-600">{e._count.interests} / {e._count.hides}</td>
              <td className="px-4 py-3 text-right"><Link href={`/admin/events/${e.id}`} className="font-semibold text-[#c49b63] hover:underline">Chi tiết →</Link></td>
            </tr>
          ))}
        </DataTable>
      )}

      <Pager page={page} pageSize={PAGE} total={total} basePath="/admin/events" query={query} />
    </>
  );
}
