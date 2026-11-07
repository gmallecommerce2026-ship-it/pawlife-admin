import { requirePermission } from "@/lib/admin/guard";
import { PageHeader, Card } from "@/components/admin/ui";
import OrganizerForm from "@/components/admin/OrganizerForm";
import { createOrganizer } from "@/actions/admin/organizers";

export default async function NewOrganizerPage() {
  await requirePermission("organizers.write");
  return (
    <>
      <PageHeader title="Tạo organizer" />
      <Card><OrganizerForm action={createOrganizer} label="Tạo organizer" /></Card>
    </>
  );
}
