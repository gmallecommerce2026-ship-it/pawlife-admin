// Form sự kiện dùng chung cho tạo mới và sửa. Tiêu đề, mô tả song ngữ VI/EN; chọn vị trí trên bản đồ; ảnh bìa + thư viện.
import type { Event, Organizer } from "@prisma/client";
import ActionForm from "./ActionForm";
import ImageUploadField from "./ImageUploadField";
import LatLngField from "./LatLngField";
import { inputCls, labelCls } from "./ui";
import { toLocalInput } from "@/lib/admin/format";

type Props = {
  event?: Event | null;
  organizers: Pick<Organizer, "id" | "name" | "handle">[];
  action: (fd: FormData) => void | Promise<void>;
  label: string;
};

export default function EventForm({ event, organizers, action, label }: Props) {
  const isNew = !event;
  return (
    <ActionForm
      action={action}
      hidden={event ? { id: event.id } : {}}
      label={label}
      notePlaceholder="Ghi chú nội bộ (bắt buộc)"
      className="space-y-5"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field name="titleVi" label="Tiêu đề (tiếng Việt)" defaultValue={event?.titleVi} required />
        <Field name="titleEn" label="Tiêu đề (tiếng Anh)" defaultValue={event?.titleEn} required />
        <TextArea name="descriptionVi" label="Mô tả (tiếng Việt)" defaultValue={event?.descriptionVi} />
        <TextArea name="descriptionEn" label="Mô tả (tiếng Anh)" defaultValue={event?.descriptionEn} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <span className={labelCls}>Bắt đầu (giờ VN)</span>
          <input type="datetime-local" name="startsAt" required defaultValue={toLocalInput(event?.startsAt ?? null)} className={inputCls} />
        </div>
        <div>
          <span className={labelCls}>Kết thúc (giờ VN)</span>
          <input type="datetime-local" name="endsAt" defaultValue={toLocalInput(event?.endsAt ?? null)} className={inputCls} />
        </div>
        <Field name="area" label="Khu vực" defaultValue={event?.area} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <Field name="locationName" label="Tên địa điểm" defaultValue={event?.locationName} />
          <LatLngField defaultLat={event?.lat} defaultLng={event?.lng} />
        </div>
        <div className="space-y-3">
          <ImageUploadField name="coverUrl" label="Ảnh bìa" folder="events" defaultValue={event?.coverUrl} />
          <div>
            <span className={labelCls}>Thư viện ảnh (mỗi dòng một URL)</span>
            <textarea name="galleryUrls" rows={4} defaultValue={event?.galleryUrls ?? ""} className={inputCls} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <span className={labelCls}>Organizer</span>
          <select name="organizerId" defaultValue={event?.organizerId ?? ""} className={inputCls}>
            <option value="">— Không có —</option>
            {organizers.map((o) => (
              <option key={o.id} value={o.id}>{o.name} (@{o.handle})</option>
            ))}
          </select>
        </div>
        {isNew && (
          <div>
            <span className={labelCls}>Trạng thái ban đầu</span>
            <select name="status" defaultValue="DRAFT" className={inputCls}>
              <option value="DRAFT">Nháp</option>
              <option value="PUBLISHED">Đăng ngay</option>
            </select>
          </div>
        )}
        <label className="flex items-center gap-2 self-end text-sm font-semibold text-gray-700">
          <input type="checkbox" name="pinned" defaultChecked={event?.pinned ?? false} /> Ghim lên đầu
        </label>
      </div>
    </ActionForm>
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

function TextArea({ name, label, defaultValue }: { name: string; label: string; defaultValue?: string | null }) {
  return (
    <div>
      <span className={labelCls}>{label}</span>
      <textarea name={name} rows={4} defaultValue={defaultValue ?? ""} className={inputCls} />
    </div>
  );
}
