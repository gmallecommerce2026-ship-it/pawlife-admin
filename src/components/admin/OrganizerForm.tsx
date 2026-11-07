import type { Organizer } from "@prisma/client";
import ActionForm from "./ActionForm";
import ImageUploadField from "./ImageUploadField";
import { inputCls, labelCls } from "./ui";

export default function OrganizerForm({
  organizer,
  action,
  label,
}: {
  organizer?: Organizer | null;
  action: (fd: FormData) => void | Promise<void>;
  label: string;
}) {
  return (
    <ActionForm action={action} hidden={organizer ? { id: organizer.id } : {}} label={label} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <span className={labelCls}>Tên hiển thị</span>
          <input name="name" required defaultValue={organizer?.name ?? ""} className={inputCls} />
        </div>
        <div>
          <span className={labelCls}>Handle (không có @)</span>
          <input name="handle" required defaultValue={organizer?.handle ?? ""} className={inputCls} />
        </div>
      </div>
      <div>
        <span className={labelCls}>Giới thiệu</span>
        <textarea name="bio" rows={3} defaultValue={organizer?.bio ?? ""} className={inputCls} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <ImageUploadField name="avatarUrl" label="Avatar" folder="avatars" defaultValue={organizer?.avatarUrl} />
        <ImageUploadField name="coverUrl" label="Ảnh bìa" folder="covers" defaultValue={organizer?.coverUrl} />
      </div>
    </ActionForm>
  );
}
