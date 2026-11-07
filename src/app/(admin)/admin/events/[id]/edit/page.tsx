import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/admin/guard";
import { PageHeader, Card } from "@/components/admin/ui";
import EventForm from "@/components/admin/EventForm";
import { updateEvent } from "@/actions/admin/events";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePermission("events.write");
  const [event, organizers] = await Promise.all([
    db.event.findUnique({ where: { id } }),
    db.organizer.findMany({ select: { id: true, name: true, handle: true }, orderBy: { name: "asc" } }),
  ]);
  if (!event) notFound();
  return (
    <>
      <PageHeader title="Sửa sự kiện" description={event.titleVi} />
      <Card>
        <EventForm event={event} organizers={organizers} action={updateEvent} label="Lưu thay đổi" />
      </Card>
    </>
  );
}
