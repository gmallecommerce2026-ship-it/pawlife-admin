import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/admin/guard";
import { fmtDate, maskEmail, parseInt0 } from "@/lib/admin/format";
import { PageHeader, TabLinks, DataTable, Badge, Pager, EmptyState, inputCls } from "@/components/admin/ui";
import { SHELTER_STATUS_LABELS } from "@/lib/admin/constants";
import type { ShelterStatus } from "@prisma/client";

const TABS: { key: string; status: ShelterStatus }[] = [
  { key: "pending", status: "PENDING" },
  { key: "approved", status: "APPROVED" },
  { key: "suspended", status: "SUSPENDED" },
  { key: "rejected", status: "REJECTED" },
];
const TONE = { PENDING: "yellow", APPROVED: "green", SUSPENDED: "red", REJECTED: "gray" } as const;
const PAGE = 20;

export default async function SheltersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission("shelters.read");
  const sp = await searchParams;
  const tab = TABS.find((t) => t.key === sp.tab) ?? TABS[0];
  const q = (sp.q ?? "").trim();
  const page = parseInt0(sp.page);

  const where = {
    status: tab.status,
    ...(q ? { OR: [{ name: { contains: q } }, { email: { contains: q } }] } : {}),
  };

  const [rows, total, grouped] = await Promise.all([
    db.shelter.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE,
      take: PAGE,
      include: { owner: { select: { userName: true, fullName: true } } },
    }),
    db.shelter.count({ where }),
    db.shelter.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const countOf = (s: ShelterStatus) => grouped.find((g) => g.status === s)?._count._all ?? 0;

  return (
    <>
      <PageHeader title="Quản lý shelter" description="Duyệt, đình chỉ và theo dõi các shelter" />

      <TabLinks
        items={TABS.map((t) => ({
          href: `/admin/shelters?tab=${t.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`,
          label: SHELTER_STATUS_LABELS[t.status],
          active: t.key === tab.key,
          count: countOf(t.status),
        }))}
      />

      <form className="mb-4 flex gap-2">
        <input type="hidden" name="tab" value={tab.key} />
        <input name="q" defaultValue={q} placeholder="Tìm theo tên hoặc email shelter" className={`${inputCls} max-w-sm`} />
        <button className="rounded-lg bg-[#1d150b] px-4 text-sm font-semibold text-[#c49b63]">Tìm</button>
      </form>

      {rows.length === 0 ? (
        <EmptyState text="Không có shelter nào trong mục này" />
      ) : (
        <DataTable head={["Tên shelter", "Email liên hệ", "Tài khoản đăng ký", "Trạng thái", "Ngày đăng ký", ""]}>
          {rows.map((s) => (
            <tr key={s.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-semibold text-gray-800">{s.name}</td>
              <td className="px-4 py-3 text-gray-600">{s.email ?? "—"}</td>
              <td className="px-4 py-3 text-gray-500">{maskEmail(s.owner.userName)}</td>
              <td className="px-4 py-3"><Badge tone={TONE[s.status]}>{SHELTER_STATUS_LABELS[s.status]}</Badge></td>
              <td className="px-4 py-3 text-gray-500">{fmtDate(s.createdAt)}</td>
              <td className="px-4 py-3 text-right">
                <Link href={`/admin/shelters/${s.id}`} className="font-semibold text-[#c49b63] hover:underline">Xem hồ sơ →</Link>
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      <Pager page={page} pageSize={PAGE} total={total} basePath="/admin/shelters" query={{ tab: tab.key, q: q || undefined }} />
    </>
  );
}
