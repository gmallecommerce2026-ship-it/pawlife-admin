// Duyệt đề xuất địa điểm: hàng đợi (cũ nhất trước) + màn hình chia đôi: trái là thông tin, phải là bản đồ
import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/admin/guard";
import { fmtDate, distanceMeters } from "@/lib/admin/format";
import { PROPOSAL_REJECT_REASONS } from "@/lib/admin/constants";
import { Badge, Card, EmptyState, Notice, TabLinks, inputCls, labelCls } from "@/components/admin/ui";
import ActionForm from "@/components/admin/ActionForm";
import LatLngField from "@/components/admin/LatLngField";
import { approveProposal, rejectProposal, requestProposalInfo } from "@/actions/admin/places";
import type { ProposalStatus } from "@prisma/client";

const TABS: { key: string; statuses: ProposalStatus[]; label: string }[] = [
  { key: "queue", statuses: ["PENDING", "NEEDS_INFO"], label: "Hàng đợi" },
  { key: "pending", statuses: ["PENDING"], label: "Chờ duyệt" },
  { key: "needinfo", statuses: ["NEEDS_INFO"], label: "Chờ bổ sung" },
  { key: "approved", statuses: ["APPROVED"], label: "Đã duyệt" },
  { key: "rejected", statuses: ["REJECTED"], label: "Đã từ chối" },
];

export default async function PlaceProposalsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requirePermission("places.read");
  const sp = await searchParams;
  const tab = TABS.find((t) => t.key === sp.tab) ?? TABS[0];

  // Cũ nhất hiện trước
  const queue = await db.placeProposal.findMany({
    where: { status: { in: tab.statuses } },
    orderBy: { createdAt: "asc" },
    take: 100,
    select: { id: true, name: true, category: true, createdAt: true, status: true },
  });
  const selectedId = sp.id ?? queue[0]?.id;
  const p = selectedId ? await db.placeProposal.findUnique({ where: { id: selectedId } }) : null;

  // Cảnh báo trùng: địa điểm đã có trong vòng 150m và tên gần giống
  let duplicates: { id: string; name: string; meters: number }[] = [];
  if (p) {
    const delta = 0.0015;
    const nearby = await db.place.findMany({
      where: { lat: { gte: p.lat - delta, lte: p.lat + delta }, lng: { gte: p.lng - delta, lte: p.lng + delta } },
      select: { id: true, name: true, lat: true, lng: true },
    });
    const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
    duplicates = nearby
      .map((n) => ({ id: n.id, name: n.name, meters: distanceMeters(p.lat, p.lng, n.lat, n.lng) }))
      .filter((n) => n.meters <= 150 || norm(n.name) === norm(p.name));
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1d150b]">Duyệt đề xuất địa điểm</h1>
        <p className="mt-1 text-sm text-gray-500">Pawly Place · cũ nhất hiện trước</p>
      </div>

      <TabLinks items={TABS.map((t) => ({ href: `/admin/place-proposals?tab=${t.key}`, label: t.label, active: t.key === tab.key }))} />

      <div className="mb-6 max-h-64 overflow-y-auto rounded-2xl border border-gray-100 bg-white">
        {queue.length === 0 ? (
          <EmptyState text="Không có đề xuất nào" />
        ) : (
          queue.map((q) => (
            <Link
              key={q.id}
              href={`/admin/place-proposals?tab=${tab.key}&id=${q.id}`}
              className={`flex items-center justify-between border-b border-gray-50 px-4 py-3 text-sm hover:bg-gray-50 ${q.id === p?.id ? "bg-[#c49b63]/10" : ""}`}
            >
              <span className="font-semibold text-gray-800">{q.name} <span className="font-normal text-gray-400">· {q.category}</span></span>
              <span className="flex items-center gap-3 text-gray-500">
                <Badge tone={q.status === "NEEDS_INFO" ? "yellow" : q.status === "APPROVED" ? "green" : q.status === "REJECTED" ? "red" : "blue"}>{q.status}</Badge>
                {fmtDate(q.createdAt)}
              </span>
            </Link>
          ))
        )}
      </div>

      {!p ? (
        <EmptyState text="Chọn một đề xuất trong hàng đợi" />
      ) : (
        <>
          {p.status === "APPROVED" && <Notice tone="green">Đề xuất này đã được duyệt và tạo địa điểm.</Notice>}
          {p.status === "REJECTED" && p.rejectReason && <Notice tone="red">Lý do từ chối: {p.rejectReason}</Notice>}
          {p.status === "NEEDS_INFO" && p.infoRequest && <Notice tone="yellow">Đã yêu cầu bổ sung: {p.infoRequest}</Notice>}
          {duplicates.length > 0 && (
            <Notice tone="red">
              <strong>Cảnh báo trùng:</strong> có địa điểm gần giống đã tồn tại:{" "}
              {duplicates.map((d) => `${d.name} (${Math.round(d.meters)}m)`).join("; ")}
            </Notice>
          )}

          <ActionForm
            action={approveProposal}
            hidden={{ id: p.id }}
            label="Duyệt và tạo địa điểm"
            variant="success"
            confirmMessage="Duyệt đề xuất và tạo địa điểm trên bản đồ?"
            className="space-y-0"
          >
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <h2 className="mb-4 font-bold text-[#1d150b]">Thông tin đề xuất</h2>
                <div className="space-y-3">
                  <Input name="name" label="Tên địa điểm" defaultValue={p.name} required />
                  <Input name="category" label="Danh mục" defaultValue={p.category} />
                  <Input name="address" label="Địa chỉ" defaultValue={p.address} required />
                  <div className="grid grid-cols-2 gap-3">
                    <Input name="phone" label="Điện thoại" defaultValue={p.phone} />
                    <Input name="website" label="Website" defaultValue={p.website} />
                  </div>
                  <div>
                    <span className={labelCls}>Mô tả</span>
                    <textarea name="description" rows={3} defaultValue={p.description ?? ""} className={inputCls} />
                  </div>
                  <p className="text-xs text-gray-400">Người gửi: {p.submitterId} · {fmtDate(p.createdAt)}</p>
                </div>
              </Card>
              <Card>
                <h2 className="mb-4 font-bold text-[#1d150b]">Vị trí trên bản đồ</h2>
                <LatLngField required defaultLat={p.lat} defaultLng={p.lng} />
                {duplicates.length > 0 && (
                  <ul className="mt-3 space-y-1 text-xs text-red-600">
                    {duplicates.map((d) => (
                      <li key={d.id}>Gần: {d.name} · {Math.round(d.meters)}m · <Link href={`/admin/places/${d.id}`} className="underline">xem</Link></li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </ActionForm>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card>
              <h3 className="mb-3 font-bold text-[#1d150b]">Từ chối</h3>
              <ActionForm action={rejectProposal} hidden={{ id: p.id }} label="Từ chối đề xuất" variant="danger" confirmMessage="Từ chối đề xuất này?">
                <select name="reasonTemplate" className={inputCls} defaultValue="">
                  <option value="">— Chọn lý do mẫu —</option>
                  {PROPOSAL_REJECT_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  <option value="_custom">Lý do khác (nhập bên dưới)</option>
                </select>
                <input name="reasonCustom" placeholder="Nhập lý do (bắt buộc nếu không chọn mẫu)" className={inputCls} />
              </ActionForm>
            </Card>
            <Card>
              <h3 className="mb-3 font-bold text-[#1d150b]">Yêu cầu bổ sung thông tin</h3>
              <ActionForm action={requestProposalInfo} hidden={{ id: p.id }} label="Gửi yêu cầu bổ sung" variant="ghost">
                <textarea name="infoRequest" rows={2} required placeholder="Cần bổ sung: ảnh, giờ mở cửa, số điện thoại..." className={inputCls} />
              </ActionForm>
            </Card>
          </div>
        </>
      )}
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
