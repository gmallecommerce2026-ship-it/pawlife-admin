// Kiểm duyệt đánh giá địa điểm bị báo cáo: xem nội dung, ảnh, lịch sử báo cáo, số lần người viết bị báo cáo
import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/admin/guard";
import { hasPermission } from "@/lib/admin/permissions";
import { fmtDate, maskEmail } from "@/lib/admin/format";
import { Badge, Card, EmptyState, inputCls, labelCls } from "@/components/admin/ui";
import ActionForm from "@/components/admin/ActionForm";
import { actOnReportTarget } from "@/actions/admin/moderation";
import { lockUser } from "@/actions/admin/users";

export default async function ReviewsPage() {
  const ctx = await requirePermission("reports.read");
  const canWrite = hasPermission(ctx.roles, "reports.write");

  const open = await db.report.findMany({
    where: { targetType: "PLACE_REVIEW", status: { in: ["NEW", "IN_PROGRESS"] } },
    orderBy: { createdAt: "asc" },
    take: 300,
  });

  // Gom theo đánh giá, đánh giá có nhiều báo cáo lên đầu
  const groups = new Map<string, { count: number; reasons: string[]; first: Date }>();
  for (const r of open) {
    const g = groups.get(r.targetId) ?? { count: 0, reasons: [], first: r.createdAt };
    g.count++;
    if (g.reasons.length < 3) g.reasons.push(r.reason);
    groups.set(r.targetId, g);
  }
  const ids = [...groups.keys()];
  const reviews = ids.length
    ? await db.placeReview.findMany({
        where: { id: { in: ids } },
        include: {
          author: { select: { id: true, userName: true, fullName: true, lockedPermanently: true, lockedUntil: true } },
          place: { select: { name: true } },
        },
      })
    : [];

  // Số lần người viết bị báo cáo (tính trên mọi báo cáo đánh giá của họ)
  const authorIds = [...new Set(reviews.map((r) => r.authorId))];
  const authorReviews = authorIds.length
    ? await db.placeReview.findMany({ where: { authorId: { in: authorIds } }, select: { id: true, authorId: true } })
    : [];
  const reportedCount = authorIds.length
    ? await db.report.findMany({
        where: { targetType: "PLACE_REVIEW", targetId: { in: authorReviews.map((a) => a.id) } },
        select: { targetId: true },
      })
    : [];
  const reviewAuthor = new Map(authorReviews.map((a) => [a.id, a.authorId]));
  const authorReportCount = new Map<string, number>();
  for (const r of reportedCount) {
    const a = reviewAuthor.get(r.targetId);
    if (a) authorReportCount.set(a, (authorReportCount.get(a) ?? 0) + 1);
  }

  const rows = reviews
    .map((r) => ({ review: r, ...groups.get(r.id)! }))
    .sort((a, b) => b.count - a.count || a.first.getTime() - b.first.getTime());

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1d150b]">Kiểm duyệt đánh giá</h1>
        <p className="mt-1 text-sm text-gray-500">Đánh giá địa điểm bị người dùng báo cáo. Nhiều báo cáo hơn lên đầu.</p>
      </div>

      {rows.length === 0 ? (
        <EmptyState text="Không có đánh giá nào đang chờ kiểm duyệt" />
      ) : (
        <div className="space-y-4">
          {rows.map(({ review: r, count, reasons, first }) => {
            const locked = r.author.lockedPermanently || (r.author.lockedUntil && r.author.lockedUntil > new Date());
            return (
              <Card key={r.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="red">{count} báo cáo</Badge>
                      <Link href={`/admin/places/${r.placeId}`} className="font-semibold text-gray-800 hover:text-[#c49b63]">{r.place.name}</Link>
                      <span className="text-sm text-gray-500">· {r.rating} ★ · {fmtDate(r.createdAt)}</span>
                    </div>
                    <p className="mt-3 whitespace-pre-line text-sm text-gray-700">{r.content}</p>
                    {r.imageUrls && (
                      <div className="mt-3 flex gap-2 overflow-x-auto">
                        {r.imageUrls.split("\n").filter(Boolean).map((u) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={u} src={u} alt="" className="h-24 w-24 rounded-lg object-cover" />
                        ))}
                      </div>
                    )}
                    <div className="mt-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
                      <p className="font-semibold text-gray-700">Lý do báo cáo gần đây:</p>
                      <ul className="mt-1 list-disc pl-4">{reasons.map((x, i) => <li key={i}>{x}</li>)}</ul>
                      <p className="mt-2">Báo cáo mới nhất từ: {fmtDate(first)}</p>
                    </div>
                  </div>

                  <div className="w-full space-y-2 text-sm md:w-72">
                    <p className="text-gray-600">
                      Người viết: <strong>{r.author.fullName ?? "—"}</strong> <span className="text-xs text-gray-400">{maskEmail(r.author.userName)}</span>
                    </p>
                    <p className="text-gray-600">Người viết bị báo cáo: <strong>{authorReportCount.get(r.authorId) ?? 0}</strong> lần</p>
                    {locked && <Badge tone="red">Đang bị khóa</Badge>}
                  </div>
                </div>

                {canWrite && (
                  <div className="mt-5 grid gap-4 border-t border-gray-100 pt-4 md:grid-cols-3">
                    <ActionForm action={actOnReportTarget} hidden={{ targetType: "PLACE_REVIEW", targetId: r.id, decision: "HIDE" }} label="Gỡ đánh giá" variant="danger" confirmMessage="Gỡ đánh giá này và tính lại điểm?" notePlaceholder="Lý do gỡ (bắt buộc)" />
                    <ActionForm action={actOnReportTarget} hidden={{ targetType: "PLACE_REVIEW", targetId: r.id, decision: "DISMISS" }} label="Bỏ qua báo cáo" variant="ghost" confirmMessage="Bỏ qua các báo cáo này?" />
                    {!locked && (
                      <ActionForm action={lockUser} hidden={{ userId: r.authorId }} label="Khóa người viết" variant="danger" confirmMessage="Khóa người viết đánh giá này?" notePlaceholder="Lý do khóa (bắt buộc)">
                        <div className="grid grid-cols-2 gap-2">
                          <select name="mode" className={inputCls} defaultValue="TEMP">
                            <option value="TEMP">Tạm thời</option>
                            <option value="PERMANENT">Vĩnh viễn</option>
                          </select>
                          <input name="days" type="number" min={1} max={365} defaultValue={7} className={inputCls} aria-label="Số ngày khóa" />
                        </div>
                      </ActionForm>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
