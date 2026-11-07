import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/admin/guard";
import { hasPermission } from "@/lib/admin/permissions";
import { fmtDate } from "@/lib/admin/format";
import { Badge, Card, DataTable, EmptyState, inputCls, labelCls } from "@/components/admin/ui";
import ActionForm from "@/components/admin/ActionForm";
import LatLngField from "@/components/admin/LatLngField";
import ImageUploadField from "@/components/admin/ImageUploadField";
import { savePlace, setPlaceHidden, addPlacePet, removePlacePet, mergePlaces } from "@/actions/admin/places";

export default async function PlaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requirePermission("places.read");
  const canWrite = hasPermission(ctx.roles, "places.write");

  const [place, pets, reviews, others] = await Promise.all([
    db.place.findUnique({ where: { id } }),
    db.placePet.findMany({ where: { placeId: id }, orderBy: { createdAt: "desc" } }),
    db.placeReview.findMany({
      where: { placeId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { author: { select: { fullName: true } } },
    }),
    db.place.findMany({ where: { id: { not: id } }, select: { id: true, name: true, address: true }, orderBy: { name: "asc" }, take: 300 }),
  ]);
  if (!place) notFound();

  return (
    <>
      <div className="mb-2 text-sm text-gray-500"><Link href="/admin/places" className="hover:text-[#c49b63]">← Địa điểm đã duyệt</Link></div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-[#1d150b]">{place.name}</h1>
        {place.isHidden ? <Badge tone="red">Đã ẩn</Badge> : <Badge tone="green">Hiển thị</Badge>}
        <span className="text-sm text-gray-500">{place.rating.toFixed(1)} ★ · {place.reviewCount} đánh giá</span>
      </div>
      {place.isHidden && place.hiddenReason && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">Lý do ẩn: {place.hiddenReason}</p>}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-bold text-[#1d150b]">Thông tin</h2>
          {canWrite ? (
            <ActionForm action={savePlace} hidden={{ id: place.id }} label="Lưu thay đổi" notePlaceholder="Ghi chú nội bộ: sửa gì và vì sao (bắt buộc)">
              <Input name="name" label="Tên" defaultValue={place.name} required />
              <div className="grid grid-cols-2 gap-3">
                <Input name="category" label="Danh mục" defaultValue={place.category} />
                <Input name="city" label="Thành phố" defaultValue={place.city} />
              </div>
              <Input name="address" label="Địa chỉ" defaultValue={place.address} />
              <Input name="phone" label="Điện thoại" defaultValue={place.phone} />
              <Area name="description" label="Mô tả" defaultValue={place.description} />
              <Area name="openingHours" label="Giờ mở cửa (mỗi dòng một ngày)" defaultValue={place.openingHours} />
              <Area name="amenities" label="Tiện ích (cách nhau bằng dấu phẩy)" defaultValue={place.amenities} />
              <Area name="menuText" label="Menu (mỗi dòng: tên - giá)" defaultValue={place.menuText} />
              <ImageUploadField name="coverUrl" label="Ảnh bìa" folder="places" defaultValue={place.coverUrl} />
              <Area name="imageUrls" label="Thư viện ảnh (mỗi dòng một URL)" defaultValue={place.imageUrls} />
              <LatLngField defaultLat={place.lat} defaultLng={place.lng} />
            </ActionForm>
          ) : (
            <p className="text-sm text-gray-600">{place.address}</p>
          )}
        </Card>

        <div className="space-y-6">
          {canWrite && (
            <Card>
              <h2 className="mb-3 font-bold text-[#1d150b]">Ẩn / hiện</h2>
              {place.isHidden ? (
                <ActionForm action={setPlaceHidden} hidden={{ id: place.id, hidden: "0" }} label="Hiện địa điểm" variant="success" confirmMessage="Hiện lại địa điểm?" />
              ) : (
                <ActionForm action={setPlaceHidden} hidden={{ id: place.id, hidden: "1" }} label="Ẩn địa điểm" variant="ghost" confirmMessage="Ẩn địa điểm này? Dữ liệu không bị xóa." notePlaceholder="Lý do ẩn (bắt buộc)" />
              )}
            </Card>
          )}

          <Card>
            <h2 className="mb-3 font-bold text-[#1d150b]">Thú cưng làm việc tại quán ({pets.length})</h2>
            {pets.length === 0 ? (
              <EmptyState text="Chưa có thú cưng" />
            ) : (
              <ul className="mb-4 divide-y divide-gray-100">
                {pets.map((p) => (
                  <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                    <span>{p.name} <span className="text-gray-400">· {p.species}</span></span>
                    {canWrite && (
                      <ActionForm action={removePlacePet} hidden={{ placeId: place.id, petId: p.id }} label="Gỡ" variant="ghost" confirmMessage={`Gỡ ${p.name} khỏi quán?`} />
                    )}
                  </li>
                ))}
              </ul>
            )}
            {canWrite && (
              <ActionForm action={addPlacePet} hidden={{ placeId: place.id }} label="Thêm thú cưng" variant="ghost">
                <div className="grid grid-cols-2 gap-2">
                  <input name="name" required placeholder="Tên" className={inputCls} />
                  <input name="species" placeholder="Loài" className={inputCls} />
                </div>
              </ActionForm>
            )}
          </Card>

          {canWrite && (
            <Card>
              <h2 className="mb-2 font-bold text-[#1d150b]">Gộp với địa điểm trùng</h2>
              <p className="mb-3 text-xs text-gray-500">Địa điểm này sẽ bị xóa; đánh giá của nó được chuyển sang địa điểm đích.</p>
              <ActionForm action={mergePlaces} hidden={{ sourceId: place.id }} label="Gộp vào địa điểm đã chọn" variant="danger" confirmMessage="Gộp và xóa địa điểm này? Không thể hoàn tác dễ dàng.">
                <select name="targetId" required className={inputCls} defaultValue="">
                  <option value="" disabled>— Chọn địa điểm gốc —</option>
                  {others.map((o) => <option key={o.id} value={o.id}>{o.name} · {o.address}</option>)}
                </select>
              </ActionForm>
            </Card>
          )}
        </div>
      </div>

      <Card className="mt-6">
        <h2 className="mb-4 font-bold text-[#1d150b]">Đánh giá gần đây</h2>
        {reviews.length === 0 ? (
          <EmptyState text="Chưa có đánh giá" />
        ) : (
          <DataTable head={["Người viết", "Điểm", "Nội dung", "Trạng thái", "Ngày"]}>
            {reviews.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3">{r.author.fullName ?? "—"}</td>
                <td className="px-4 py-3">{r.rating} ★</td>
                <td className="px-4 py-3 text-gray-700">{r.content.slice(0, 120)}</td>
                <td className="px-4 py-3">{r.isRemoved ? <Badge tone="red">Đã gỡ</Badge> : <Badge tone="green">Hiện</Badge>}</td>
                <td className="px-4 py-3 text-gray-500">{fmtDate(r.createdAt, false)}</td>
              </tr>
            ))}
          </DataTable>
        )}
      </Card>
    </>
  );
}

function Input({ name, label, defaultValue, required }: { name: string; label: string; defaultValue?: string | null; required?: boolean }) {
  return (
    <div>
      <span className={labelCls}>{label}</span>
      <input name={name} defaultValue={defaultValue ?? ""} required={required} className={inputCls} />
    </div>
  );
}

function Area({ name, label, defaultValue }: { name: string; label: string; defaultValue?: string | null }) {
  return (
    <div>
      <span className={labelCls}>{label}</span>
      <textarea name={name} rows={3} defaultValue={defaultValue ?? ""} className={inputCls} />
    </div>
  );
}
