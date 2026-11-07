import { db } from "@/lib/db";
import { requirePermission } from "@/lib/admin/guard";
import { PageHeader, Card } from "@/components/admin/ui";
import EventForm from "@/components/admin/EventForm";
import { createEvent } from "@/actions/admin/events";

export default async function NewEventPage() {
  await requirePermission("events.write");
  const organizers = await db.organizer.findMany({ select: { id: true, name: true, handle: true }, orderBy: { name: "asc" } });
  return (
    <>
      <PageHeader title="Tạo sự kiện" description="Điền đầy đủ tiếng Việt và tiếng Anh" />
      <Card>
        <EventForm organizers={organizers} action={createEvent} label="Tạo sự kiện" />
      </Card>
    </>
  );
}
