import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/admin/guard";
import { hasPermission } from "@/lib/admin/permissions";
import { fmtDate } from "@/lib/admin/format";
import { Badge, Card, PageHeader, StatCard, btnVariant } from "@/components/admin/ui";
import ActionForm from "@/components/admin/ActionForm";
import { setEventStatus, togglePinEvent, duplicateEvent } from "@/actions/admin/events";
import type { EventStatus } from "@prisma/client";

const LABEL: Record<EventStatus, string> = { DRAFT: "Nháp", PUBLISHED: "Đã đăng", HIDDEN: "Đã ẩn", CANCELLED: "Đã hủy", ARCHIVED: "Đã lưu trữ" };
const TONE = { DRAFT: "gray", PUBLISHED: "green", HIDDEN: "yellow", CANCELLED: "red", ARCHIVED: "purple" } as const;

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requirePermission("events.read");
  const canWrite = hasPermission(ctx.roles, "events.write");

  const event = await db.event.findUnique({
    where: { id },
    include: {
      organizer: { select: { name: true, handle: true, isVerified: true } },
      _count: { select: { interests: true, hides: true } },
    },
  });
  if (!event) notFound();

  const s = event.status;
  const hidden = { id: event.id };

  return (
    <>
      <div className="mb-2 text-sm text-gray-500"><Link href="/admin/events" className="hover:text-[#c49b63]">← Danh sách sự kiện</Link></div>
      <PageHeader
        title={event.titleVi}
        description={`${event.titleEn} · ${fmtDate(event.startsAt)}`}
        actions={
          canWrite && (
            <>
              <Link href={`/admin/events/${event.id}/edit`} className={btnVariant.ghost}>Sửa</Link>
            </>
          )
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Badge tone={TONE[s]}>{LABEL[s]}</Badge>
        {event.pinned && <Badge tone="purple">Đã ghim</Badge>}
        {event.organizer && <Badge tone={event.organizer.isVerified ? "blue" : "gray"}>{event.organizer.name} @{event.organizer.handle}</Badge>}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Người quan tâm" value={event._count.interests} />
        <StatCard label="Người đã ẩn sự kiện" value={event._count.hides} />
        <StatCard label="Khu vực" value={event.area} />
        <StatCard label="Kết thúc" value={event.endsAt ? fmtDate(event.endsAt) : "—"} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-bold text-[#1d150b]">Nội dung</h2>
          <p className="text-sm text-gray-700"><strong>VI:</strong> {event.descriptionVi ?? "—"}</p>
          <p className="mt-2 text-sm text-gray-700"><strong>EN:</strong> {event.descriptionEn ?? "—"}</p>
          <p className="mt-4 text-sm text-gray-500">Địa điểm: {event.locationName ?? "—"} {event.lat && event.lng ? `(${event.lat.toFixed(5)}, ${event.lng.toFixed(5)})` : ""}</p>
          {event.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.coverUrl} alt="" className="mt-4 h-48 w-full rounded-xl object-cover" />
          )}
          {event.statusNote && <p className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">Lý do trạng thái: {event.statusNote}</p>}
        </Card>

        {canWrite && (
          <Card>
            <h2 className="mb-4 font-bold text-[#1d150b]">Thao tác</h2>
            <div className="space-y-5">
              {s !== "PUBLISHED" && s !== "CANCELLED" && (
                <ActionForm action={setEventStatus} hidden={{ ...hidden, status: "PUBLISHED" }} label="Đăng sự kiện" variant="success" confirmMessage="Đăng sự kiện này?" />
              )}
              {s === "PUBLISHED" && (
                <ActionForm action={setEventStatus} hidden={{ ...hidden, status: "HIDDEN" }} label="Ẩn sự kiện" variant="ghost" confirmMessage="Ẩn sự kiện này?" />
              )}
              {s === "HIDDEN" && (
                <ActionForm action={setEventStatus} hidden={{ ...hidden, status: "PUBLISHED" }} label="Hiện lại" variant="success" confirmMessage="Hiện lại sự kiện?" />
              )}
              {s !== "CANCELLED" && s !== "ARCHIVED" && (
                <ActionForm action={setEventStatus} hidden={{ ...hidden, status: "CANCELLED" }} label="Hủy sự kiện" variant="danger" confirmMessage="Hủy sự kiện? Người quan tâm sẽ nhận thông báo." notePlaceholder="Ghi chú nội bộ (bắt buộc)">
                  <input name="reason" required placeholder="Lý do gửi cho người quan tâm (bắt buộc)" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                </ActionForm>
              )}
              {s !== "ARCHIVED" && (
                <ActionForm action={setEventStatus} hidden={{ ...hidden, status: "ARCHIVED" }} label="Lưu trữ" variant="ghost" confirmMessage="Lưu trữ sự kiện?" />
              )}
              <ActionForm action={togglePinEvent} hidden={hidden} label={event.pinned ? "Bỏ ghim" : "Ghim lên đầu"} variant="ghost" />
              <ActionForm action={duplicateEvent} hidden={hidden} label="Nhân bản thành nháp" variant="ghost" confirmMessage="Tạo bản sao ở trạng thái nháp?" />
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
