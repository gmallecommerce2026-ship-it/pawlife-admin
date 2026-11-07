import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/admin/guard";
import { hasPermission } from "@/lib/admin/permissions";
import { PageHeader, DataTable, EmptyState, Badge, inputCls, btnVariant } from "@/components/admin/ui";

export default async function OrganizersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const ctx = await requirePermission("organizers.read");
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const rows = await db.organizer.findMany({
    where: q ? { OR: [{ name: { contains: q } }, { handle: { contains: q } }] } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { _count: { select: { events: true } } },
  });
  const canWrite = hasPermission(ctx.roles, "organizers.write");

  return (
    <>
      <PageHeader
        title="Organizer"
        description="Hồ sơ người tổ chức sự kiện. Xác minh để tránh giả mạo."
        actions={canWrite && <Link href="/admin/organizers/new" className={btnVariant.primary}>+ Tạo organizer</Link>}
      />
      <form className="mb-4 flex gap-2">
        <input name="q" defaultValue={q} placeholder="Tìm theo tên hoặc handle" className={`${inputCls} max-w-sm`} />
        <button className={btnVariant.primary}>Tìm</button>
      </form>
      {rows.length === 0 ? (
        <EmptyState text="Chưa có organizer" />
      ) : (
        <DataTable head={["Tên", "Handle", "Xác minh", "Số sự kiện", ""]}>
          {rows.map((o) => (
            <tr key={o.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-semibold">{o.name}</td>
              <td className="px-4 py-3 text-gray-500">@{o.handle}</td>
              <td className="px-4 py-3"><Badge tone={o.isVerified ? "blue" : "gray"}>{o.isVerified ? "Đã xác minh" : "Chưa"}</Badge></td>
              <td className="px-4 py-3">{o._count.events}</td>
              <td className="px-4 py-3 text-right"><Link href={`/admin/organizers/${o.id}`} className="font-semibold text-[#c49b63] hover:underline">Chi tiết →</Link></td>
            </tr>
          ))}
        </DataTable>
      )}
    </>
  );
}
