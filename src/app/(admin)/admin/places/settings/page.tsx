// Danh mục và tiện ích hiển thị trong app
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/admin/guard";
import { PageHeader, Card, Badge, EmptyState, inputCls } from "@/components/admin/ui";
import ActionForm from "@/components/admin/ActionForm";
import { addTaxonomy, toggleTaxonomy } from "@/actions/admin/places";

export default async function PlaceSettingsPage() {
  await requirePermission("places.write");
  const [categories, amenities] = await Promise.all([
    db.placeCategory.findMany({ orderBy: { sortOrder: "asc" } }),
    db.amenity.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <PageHeader title="Danh mục & tiện ích" description="Ẩn hoặc hiện mục trong app. Mọi thay đổi có ghi chú và nhật ký." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Taxonomy kind="category" title="Danh mục" rows={categories} />
        <Taxonomy kind="amenity" title="Tiện ích" rows={amenities} />
      </div>
    </>
  );
}

function Taxonomy({ kind, title, rows }: { kind: "category" | "amenity"; title: string; rows: { id: string; name: string; isVisible: boolean }[] }) {
  return (
    <Card>
      <h2 className="mb-4 font-bold text-[#1d150b]">{title}</h2>
      {rows.length === 0 ? (
        <EmptyState text="Chưa có mục nào" />
      ) : (
        <ul className="mb-5 divide-y divide-gray-100">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <span className="font-semibold text-gray-800">{r.name}</span>
              <div className="flex items-center gap-3">
                <Badge tone={r.isVisible ? "green" : "gray"}>{r.isVisible ? "Hiển thị" : "Đang ẩn"}</Badge>
                <ActionForm action={toggleTaxonomy} hidden={{ kind, id: r.id }} label={r.isVisible ? "Ẩn" : "Hiện"} variant="ghost" className="w-64" notePlaceholder="Lý do (bắt buộc)" />
              </div>
            </li>
          ))}
        </ul>
      )}
      <ActionForm action={addTaxonomy} hidden={{ kind }} label={`Thêm ${title.toLowerCase()}`} variant="ghost">
        <input name="name" required placeholder="Tên mới" className={inputCls} />
      </ActionForm>
    </Card>
  );
}
