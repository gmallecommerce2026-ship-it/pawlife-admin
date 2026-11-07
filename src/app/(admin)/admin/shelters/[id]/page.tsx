import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/admin/guard";
import { hasPermission } from "@/lib/admin/permissions";
import { fmtDate, maskEmail, maskPhone } from "@/lib/admin/format";
import { Badge, Card, DataTable, EmptyState, TabLinks, inputCls, labelCls, Notice } from "@/components/admin/ui";
import { SHELTER_STATUS_LABELS, REPORT_STATUS_LABELS } from "@/lib/admin/constants";
import ActionForm from "@/components/admin/ActionForm";
import ImageUploadField from "@/components/admin/ImageUploadField";
import LatLngField from "@/components/admin/LatLngField";
import { approveShelter, rejectShelter, suspendShelter, reinstateShelter, updateShelter } from "@/actions/admin/shelters";
import { startSupport } from "@/actions/admin/support";
import type { ShelterStatus } from "@prisma/client";

const TONE = { PENDING: "yellow", APPROVED: "green", SUSPENDED: "red", REJECTED: "gray" } as const;
const TABS = [
  { key: "info", label: "Thông tin" },
  { key: "pets", label: "Thú cưng" },
  { key: "applications", label: "Đơn nhận nuôi" },
  { key: "staff", label: "Nhân sự" },
  { key: "events", label: "Sự kiện" },
  { key: "reports", label: "Báo cáo" },
  { key: "logs", label: "Nhật ký" },
];

type SP = Promise<Record<string, string | undefined>>;

export default async function ShelterDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SP }) {
  const { id } = await params;
  const sp = await searchParams;
  const ctx = await requirePermission("shelters.read");
  const tab = sp.tab ?? "info";
  const canWrite = hasPermission(ctx.roles, "shelters.write");
  const canSupport = hasPermission(ctx.roles, "shelters.support");

  const shelter = await db.shelter.findUnique({
    where: { id },
    include: { owner: { select: { id: true, userName: true, fullName: true, phoneNumber: true, createdAt: true } } },
  });
  if (!shelter) notFound();

  const status = shelter.status as ShelterStatus;

  return (
    <>
      <div className="mb-2 text-sm text-gray-500">
        <Link href="/admin/shelters" className="hover:text-[#c49b63]">← Danh sách shelter</Link>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1d150b]">{shelter.name}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-gray-500">
            <Badge tone={TONE[status]}>{SHELTER_STATUS_LABELS[status]}</Badge>
            Đăng ký {fmtDate(shelter.createdAt, false)} · Chủ: {maskEmail(shelter.owner.userName)}
          </p>
        </div>
        {canSupport && status === "APPROVED" && (
          <ActionForm
            action={startSupport}
            hidden={{ shelterId: shelter.id }}
            label="Vào dashboard để hỗ trợ (30 phút)"
            variant="ghost"
            confirmMessage="Vào dashboard shelter? Shelter sẽ được thông báo."
            notePlaceholder="Lý do hỗ trợ (bắt buộc)"
            className="w-80"
          />
        )}
      </div>

      {status === "REJECTED" || status === "SUSPENDED" ? (
        shelter.statusNote && <Notice tone="red">Lý do gần nhất: {shelter.statusNote}</Notice>
      ) : null}

      <TabLinks
        items={TABS.map((t) => ({ href: `/admin/shelters/${id}?tab=${t.key}`, label: t.label, active: t.key === tab }))}
      />

      {tab === "info" && (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <h2 className="mb-4 font-bold text-[#1d150b]">Hồ sơ shelter</h2>
            <dl className="space-y-3 text-sm">
              <Row k="Email liên hệ" v={shelter.email ?? "—"} />
              <Row k="Số điện thoại" v={shelter.phone ?? "—"} />
              <Row k="Địa chỉ" v={shelter.address ?? "—"} />
              <Row k="Mô tả" v={shelter.description ?? "—"} />
              <Row k="Tài khoản đăng ký" v={`${maskEmail(shelter.owner.userName)} · ${maskPhone(shelter.owner.phoneNumber)}`} />
            </dl>

            {shelter.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shelter.imageUrl} alt="" className="mt-4 h-40 w-full rounded-xl object-cover" />
            )}

            <div className="mt-6 border-t border-gray-100 pt-5">
              <h3 className="mb-3 text-sm font-bold text-[#1d150b]">Thao tác duyệt</h3>
              {canWrite ? (
                <StatusActions id={shelter.id} status={status} />
              ) : (
                <p className="text-sm text-gray-400">Bạn chỉ có quyền xem hồ sơ.</p>
              )}
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 font-bold text-[#1d150b]">Chỉnh sửa hồ sơ</h2>
            {canWrite ? (
              <ActionForm action={updateShelter} hidden={{ id: shelter.id }} label="Lưu thay đổi" notePlaceholder="Ghi chú nội bộ: vì sao sửa? (bắt buộc)">
                <Field name="name" label="Tên shelter" defaultValue={shelter.name} required />
                <div className="grid grid-cols-2 gap-3">
                  <Field name="email" label="Email" defaultValue={shelter.email} />
                  <Field name="phone" label="Điện thoại" defaultValue={shelter.phone} />
                </div>
                <Field name="address" label="Địa chỉ" defaultValue={shelter.address} />
                <LatLngField defaultLat={shelter.lat} defaultLng={shelter.lng} />
                <div>
                  <span className={labelCls}>Mô tả</span>
                  <textarea name="description" rows={3} defaultValue={shelter.description ?? ""} className={inputCls} />
                </div>
                <ImageUploadField name="imageUrl" label="Ảnh shelter" folder="shelters" defaultValue={shelter.imageUrl} />
              </ActionForm>
            ) : (
              <p className="text-sm text-gray-400">Bạn không có quyền sửa hồ sơ.</p>
            )}
          </Card>
        </div>
      )}

      {tab === "pets" && <PetsTab shelterId={id} />}
      {tab === "applications" && <ApplicationsTab shelterId={id} />}
      {tab === "staff" && <StaffTab shelterId={id} />}
      {tab === "events" && <EventsTab shelterId={id} />}
      {tab === "reports" && <ReportsTab shelterId={id} />}
      {tab === "logs" && <LogsTab shelterId={id} />}
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2">
      <dt className="text-gray-500">{k}</dt>
      <dd className="text-gray-800">{v}</dd>
    </div>
  );
}

function Field({ name, label, defaultValue, required }: { name: string; label: string; defaultValue?: string | null; required?: boolean }) {
  return (
    <div>
      <span className={labelCls}>{label}</span>
      <input name={name} defaultValue={defaultValue ?? ""} required={required} className={inputCls} />
    </div>
  );
}

function StatusActions({ id, status }: { id: string; status: ShelterStatus }) {
  const reasonField = (
    <input name="reason" placeholder="Lý do gửi cho shelter" className={inputCls} />
  );
  return (
    <div className="space-y-4">
      {status === "PENDING" && (
        <>
          <ActionForm action={approveShelter} hidden={{ id }} label="Duyệt shelter" variant="success" confirmMessage="Duyệt shelter này?" />
          <ActionForm action={rejectShelter} hidden={{ id }} label="Từ chối" variant="danger" confirmMessage="Từ chối hồ sơ này?">
            {reasonField}
          </ActionForm>
        </>
      )}
      {status === "APPROVED" && (
        <ActionForm action={suspendShelter} hidden={{ id }} label="Đình chỉ shelter" variant="danger" confirmMessage="Đình chỉ shelter này?">
          {reasonField}
        </ActionForm>
      )}
      {status === "SUSPENDED" && (
        <ActionForm action={reinstateShelter} hidden={{ id }} label="Mở lại shelter" variant="success" confirmMessage="Mở lại shelter này?" />
      )}
      {status === "REJECTED" && (
        <ActionForm action={approveShelter} hidden={{ id }} label="Duyệt lại" variant="success" confirmMessage="Duyệt lại shelter này?" />
      )}
    </div>
  );
}

async function PetsTab({ shelterId }: { shelterId: string }) {
  const pets = await db.pet.findMany({ where: { shelterId }, orderBy: { createdAt: "desc" } });
  if (!pets.length) return <EmptyState text="Shelter chưa có thú cưng" />;
  return (
    <DataTable head={["Tên", "Loài", "Giống", "Trạng thái", "Ngày tạo"]}>
      {pets.map((p) => (
        <tr key={p.id}>
          <td className="px-4 py-3 font-semibold">{p.name}</td>
          <td className="px-4 py-3">{p.species}</td>
          <td className="px-4 py-3 text-gray-500">{p.breed ?? "—"}</td>
          <td className="px-4 py-3"><Badge tone={p.status === "HIDDEN" ? "red" : "gray"}>{p.status}</Badge></td>
          <td className="px-4 py-3 text-gray-500">{fmtDate(p.createdAt, false)}</td>
        </tr>
      ))}
    </DataTable>
  );
}

async function ApplicationsTab({ shelterId }: { shelterId: string }) {
  const apps = await db.adoptionApplication.findMany({
    where: { shelterId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { pet: { select: { name: true } }, applicant: { select: { fullName: true, userName: true } } },
  });
  if (!apps.length) return <EmptyState text="Chưa có đơn nhận nuôi" />;
  return (
    <DataTable head={["Thú cưng", "Người nộp", "Trạng thái", "Ngày nộp"]}>
      {apps.map((a) => (
        <tr key={a.id}>
          <td className="px-4 py-3 font-semibold">{a.pet.name}</td>
          <td className="px-4 py-3">{a.applicant.fullName ?? "—"} <span className="text-xs text-gray-400">{maskEmail(a.applicant.userName)}</span></td>
          <td className="px-4 py-3"><Badge>{a.status}</Badge></td>
          <td className="px-4 py-3 text-gray-500">{fmtDate(a.createdAt)}</td>
        </tr>
      ))}
    </DataTable>
  );
}

async function StaffTab({ shelterId }: { shelterId: string }) {
  const staff = await db.shelterStaff.findMany({ where: { shelterId }, include: { user: { select: { fullName: true, userName: true } } } });
  if (!staff.length) return <EmptyState text="Chưa có nhân sự" />;
  return (
    <DataTable head={["Họ tên", "Email", "Vai trò", "Từ ngày"]}>
      {staff.map((s) => (
        <tr key={s.id}>
          <td className="px-4 py-3 font-semibold">{s.user.fullName ?? "—"}</td>
          <td className="px-4 py-3 text-gray-500">{maskEmail(s.user.userName)}</td>
          <td className="px-4 py-3">{s.role}</td>
          <td className="px-4 py-3 text-gray-500">{fmtDate(s.createdAt, false)}</td>
        </tr>
      ))}
    </DataTable>
  );
}

async function EventsTab({ shelterId }: { shelterId: string }) {
  const events = await db.event.findMany({ where: { shelterId }, orderBy: { startsAt: "desc" } });
  if (!events.length) return <EmptyState text="Shelter chưa có sự kiện" />;
  return (
    <DataTable head={["Sự kiện", "Trạng thái", "Bắt đầu"]}>
      {events.map((e) => (
        <tr key={e.id}>
          <td className="px-4 py-3"><Link className="font-semibold hover:text-[#c49b63]" href={`/admin/events/${e.id}`}>{e.titleVi}</Link></td>
          <td className="px-4 py-3"><Badge>{e.status}</Badge></td>
          <td className="px-4 py-3 text-gray-500">{fmtDate(e.startsAt)}</td>
        </tr>
      ))}
    </DataTable>
  );
}

async function ReportsTab({ shelterId }: { shelterId: string }) {
  const petIds = (await db.pet.findMany({ where: { shelterId }, select: { id: true } })).map((p) => p.id);
  const reports = await db.report.findMany({
    where: {
      OR: [
        { targetType: "SHELTER", targetId: shelterId },
        { targetType: "PET_CONTENT", targetId: { in: petIds } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  if (!reports.length) return <EmptyState text="Không có báo cáo liên quan" />;
  return (
    <DataTable head={["Loại", "Lý do", "Trạng thái", "Thời điểm"]}>
      {reports.map((r) => (
        <tr key={r.id}>
          <td className="px-4 py-3">{r.targetType === "SHELTER" ? "Shelter" : "Thú cưng"}</td>
          <td className="px-4 py-3 text-gray-700">{r.reason}</td>
          <td className="px-4 py-3"><Badge tone={r.status === "NEW" ? "red" : "gray"}>{REPORT_STATUS_LABELS[r.status]}</Badge></td>
          <td className="px-4 py-3 text-gray-500">{fmtDate(r.createdAt)}</td>
        </tr>
      ))}
    </DataTable>
  );
}

async function LogsTab({ shelterId }: { shelterId: string }) {
  const logs = await db.auditLog.findMany({
    where: { targetType: "SHELTER", targetId: shelterId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { admin: { select: { userName: true, fullName: true } } },
  });
  if (!logs.length) return <EmptyState text="Chưa có nhật ký" />;
  return (
    <DataTable head={["Thời điểm", "Admin", "Thao tác", "Ghi chú"]}>
      {logs.map((l) => (
        <tr key={l.id}>
          <td className="px-4 py-3 text-gray-500">{fmtDate(l.createdAt)}</td>
          <td className="px-4 py-3">{l.admin.fullName ?? maskEmail(l.admin.userName)}</td>
          <td className="px-4 py-3 font-mono text-xs">{l.action}</td>
          <td className="px-4 py-3 text-gray-600">{l.note}</td>
        </tr>
      ))}
    </DataTable>
  );
}
