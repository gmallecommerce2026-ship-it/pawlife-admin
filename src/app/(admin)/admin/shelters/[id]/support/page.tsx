// Dashboard shelter khi admin hỗ trợ: mặc định chỉ xem; quyền cao nhất mới bật chế độ sửa
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/admin/guard";
import { hasPermission } from "@/lib/admin/permissions";
import { parseSupport, SUPPORT_COOKIE } from "@/lib/admin/support";
import { fmtDate, maskEmail } from "@/lib/admin/format";
import { Badge, Card, EmptyState, Notice, PageHeader, StatCard, inputCls } from "@/components/admin/ui";
import ActionForm from "@/components/admin/ActionForm";
import { startSupport } from "@/actions/admin/support";
import { toggleSupportWrite, supportUpdateApplication } from "@/actions/admin/support";

export default async function SupportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requirePermission("shelters.support");
  const shelter = await db.shelter.findUnique({ where: { id } });
  if (!shelter) notFound();

  const jar = await cookies();
  const session = parseSupport(jar.get(SUPPORT_COOKIE)?.value);
  const active = session?.shelterId === id;
  const isSuper = hasPermission(ctx.roles, "support.write");

  if (!active) {
    return (
      <>
        <PageHeader title={`Hỗ trợ: ${shelter.name}`} description="Chưa có phiên hỗ trợ đang mở cho shelter này." />
        <Card className="max-w-xl">
          <p className="mb-3 text-sm text-gray-600">Mở phiên 30 phút. Shelter sẽ nhận thông báo. Mặc định chỉ xem.</p>
          <ActionForm action={startSupport} hidden={{ shelterId: id }} label="Bắt đầu phiên hỗ trợ" notePlaceholder="Lý do hỗ trợ (bắt buộc)" />
        </Card>
        <Link href={`/admin/shelters/${id}`} className="mt-4 inline-block text-sm text-[#c49b63]">← Quay lại hồ sơ</Link>
      </>
    );
  }

  const now = new Date();
  const [pets, apps, events] = await Promise.all([
    db.pet.findMany({ where: { shelterId: id }, orderBy: { createdAt: "desc" }, take: 50 }),
    db.adoptionApplication.findMany({
      where: { shelterId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { pet: { select: { name: true } }, applicant: { select: { fullName: true, userName: true } } },
    }),
    db.event.findMany({ where: { shelterId: id, startsAt: { gte: now } }, orderBy: { startsAt: "asc" }, take: 20 }),
  ]);

  const newApps = apps.filter((a) => a.status === "NEW").length;
  const writable = session.write;

  return (
    <>
      <PageHeader
        title={`Dashboard shelter: ${shelter.name}`}
        description={`Chế độ ${writable ? "CHỈNH SỬA" : "CHỈ XEM"} · Phiên đến ${fmtDate(new Date(session.expiresAt))}`}
        actions={
          isSuper && (
            <ActionForm
              action={toggleSupportWrite}
              hidden={{ shelterId: id }}
              label={writable ? "Tắt chế độ sửa" : "Bật chế độ sửa"}
              variant={writable ? "ghost" : "danger"}
              confirmMessage={writable ? "Tắt chế độ sửa?" : "Bật chế độ sửa? Mọi thay đổi sẽ được ghi nhật ký."}
              notePlaceholder="Lý do bật/tắt chế độ sửa (bắt buộc)"
              className="w-80"
            />
          )
        }
      />

      {!writable && <Notice tone="yellow">Đang ở chế độ chỉ xem. Chỉ quyền quản trị cao nhất mới bật chế độ sửa.</Notice>}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Thú cưng" value={pets.length} />
        <StatCard label="Đơn mới" value={newApps} />
        <StatCard label="Đơn nhận nuôi" value={apps.length} />
        <StatCard label="Sự kiện sắp tới" value={events.length} />
      </div>

      <Card className="mt-6">
        <h2 className="mb-4 font-bold text-[#1d150b]">Đơn nhận nuôi</h2>
        {apps.length === 0 ? (
          <EmptyState text="Chưa có đơn nhận nuôi" />
        ) : (
          <ul className="divide-y divide-gray-100">
            {apps.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-semibold text-gray-800">{a.pet.name} <span className="text-xs font-normal text-gray-400">— {a.applicant.fullName ?? maskEmail(a.applicant.userName)}</span></p>
                  <p className="text-xs text-gray-500">{fmtDate(a.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge>{a.status}</Badge>
                  {writable && isSuper && (
                    <ActionForm action={supportUpdateApplication} hidden={{ shelterId: id, applicationId: a.id }} label="Cập nhật" variant="ghost" className="w-72">
                      <select name="status" defaultValue={a.status} className={inputCls}>
                        <option value="NEW">Mới</option>
                        <option value="IN_REVIEW">Đang xem xét</option>
                        <option value="APPROVED">Chấp thuận</option>
                        <option value="REJECTED">Từ chối</option>
                      </select>
                    </ActionForm>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
