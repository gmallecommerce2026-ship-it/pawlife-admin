import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/admin/guard";
import { fmtDate, parseInt0 } from "@/lib/admin/format";
import { PageHeader, Badge, DataTable, EmptyState, Pager, inputCls, btnVariant } from "@/components/admin/ui";
import type { Prisma } from "@prisma/client";

const PAGE = 20;

export default async function PlacesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requirePermission("places.read");
  const sp = await searchParams;
  const page = parseInt0(sp.page);
  const city = (sp.city ?? "").trim();
  const category = sp.category ?? "";
  const state = sp.state ?? "";
  const minRating = Number(sp.minRating) || 0;

  const where: Prisma.PlaceWhereInput = {
    ...(city ? { city: { contains: city } } : {}),
    ...(category ? { category } : {}),
    ...(state === "hidden" ? { isHidden: true } : state === "visible" ? { isHidden: false } : {}),
    ...(minRating ? { rating: { gte: minRating } } : {}),
  };

  const [rows, total, categories] = await Promise.all([
    db.place.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE }),
    db.place.count({ where }),
    db.placeCategory.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <>
      <PageHeader
        title="Địa điểm đã duyệt"
        description="Sửa thông tin, ẩn/hiện (không xóa dữ liệu), gộp địa điểm trùng"
        actions={<Link href="/admin/places/settings" className={btnVariant.ghost}>Danh mục & tiện ích</Link>}
      />

      <form className="mb-5 grid gap-3 rounded-2xl border border-gray-100 bg-white p-4 md:grid-cols-5">
        <input name="city" defaultValue={city} placeholder="Thành phố" className={inputCls} />
        <select name="category" defaultValue={category} className={inputCls}>
          <option value="">Mọi danh mục</option>
          {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        <select name="state" defaultValue={state} className={inputCls}>
          <option value="">Mọi trạng thái</option>
          <option value="visible">Đang hiển thị</option>
          <option value="hidden">Đã ẩn</option>
        </select>
        <select name="minRating" defaultValue={String(minRating || "")} className={inputCls}>
          <option value="">Mọi điểm</option>
          <option value="3">Từ 3 sao</option>
          <option value="4">Từ 4 sao</option>
        </select>
        <button className={btnVariant.primary}>Lọc</button>
      </form>

      {rows.length === 0 ? (
        <EmptyState text="Không có địa điểm phù hợp" />
      ) : (
        <DataTable head={["Tên", "Danh mục", "Thành phố", "Điểm", "Đánh giá", "Trạng thái", "Ngày duyệt", ""]}>
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-semibold text-gray-800">{r.name}</td>
              <td className="px-4 py-3 text-gray-500">{r.category}</td>
              <td className="px-4 py-3 text-gray-500">{r.city ?? "—"}</td>
              <td className="px-4 py-3">{r.rating.toFixed(1)} ★</td>
              <td className="px-4 py-3 text-gray-500">{r.reviewCount}</td>
              <td className="px-4 py-3">{r.isHidden ? <Badge tone="red">Đã ẩn</Badge> : <Badge tone="green">Hiển thị</Badge>}</td>
              <td className="px-4 py-3 text-gray-500">{fmtDate(r.createdAt, false)}</td>
              <td className="px-4 py-3 text-right"><Link href={`/admin/places/${r.id}`} className="font-semibold text-[#c49b63] hover:underline">Chi tiết →</Link></td>
            </tr>
          ))}
        </DataTable>
      )}
      <Pager page={page} pageSize={PAGE} total={total} basePath="/admin/places" query={{ city: city || undefined, category: category || undefined, state: state || undefined, minRating: minRating ? String(minRating) : undefined }} />
    </>
  );
}
