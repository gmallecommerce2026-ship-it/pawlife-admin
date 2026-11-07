import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/admin/guard";
import { hasPermission } from "@/lib/admin/permissions";
import { fmtDate } from "@/lib/admin/format";
import { Badge, Card, DataTable, EmptyState, PageHeader } from "@/components/admin/ui";
import OrganizerForm from "@/components/admin/OrganizerForm";
import ActionForm from "@/components/admin/ActionForm";
import { updateOrganizer, toggleVerifyOrganizer } from "@/actions/admin/organizers";

export default async function OrganizerDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requirePermission("organizers.read");
  const canWrite = hasPermission(ctx.roles, "organizers.write");
  const org = await db.organizer.findUnique({ where: { id } });
  if (!org) notFound();
  const events = await db.event.findMany({ where: { organizerId: id }, orderBy: { startsAt: "desc" } });

  return (
    <>
      <div className="mb-2 text-sm text-gray-500"><Link href="/admin/organizers" className="hover:text-[#c49b63]">← Organizer</Link></div>
      <PageHeader title={org.name} description={`@${org.handle}`} actions={<Badge tone={org.isVerified ? "blue" : "gray"}>{org.isVerified ? "Đã xác minh" : "Chưa xác minh"}</Badge>} />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-bold text-[#1d150b]">Hồ sơ</h2>
          {canWrite ? (
            <>
              <OrganizerForm organizer={org} action={updateOrganizer} label="Lưu hồ sơ" />
              <div className="mt-6 border-t border-gray-100 pt-5">
                <ActionForm
                  action={toggleVerifyOrganizer}
                  hidden={{ id: org.id }}
                  label={org.isVerified ? "Bỏ xác minh" : "Xác minh organizer"}
                  variant={org.isVerified ? "ghost" : "success"}
                  confirmMessage="Thay đổi trạng thái xác minh?"
                />
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500">{org.bio ?? "—"}</p>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 font-bold text-[#1d150b]">Sự kiện ({events.length})</h2>
          {events.length === 0 ? (
            <EmptyState text="Organizer chưa có sự kiện" />
          ) : (
            <DataTable head={["Sự kiện", "Trạng thái", "Bắt đầu"]}>
              {events.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-3"><Link href={`/admin/events/${e.id}`} className="font-semibold hover:text-[#c49b63]">{e.titleVi}</Link></td>
                  <td className="px-4 py-3"><Badge>{e.status}</Badge></td>
                  <td className="px-4 py-3 text-gray-500">{fmtDate(e.startsAt)}</td>
                </tr>
              ))}
            </DataTable>
          )}
        </Card>
      </div>
    </>
  );
}
