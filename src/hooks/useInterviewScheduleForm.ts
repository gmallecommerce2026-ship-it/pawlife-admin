import { useEffect, useRef, useState, useCallback } from 'react';
import { AdoptionApplication } from '@/types/application';

export interface InterviewMember {
  id: string;
  name: string;
  note: string;
}

export interface InterviewSubmitPayload {
  title: string;
  format: 'Online' | 'Offline';
  location: string | null;
  durationMinutes: number;
  scheduledAt: string;
  members: InterviewMember[];
  reminderMinutesBefore: number;
  reviewNote: string;
}

const REMINDER_MINUTES_BEFORE = 10;
export const DURATION_OPTIONS = [30, 45, 60, 90];

const createEmptyMember = (): InterviewMember => ({
  id: crypto.randomUUID(),
  name: '',
  note: '',
});

export const toDatetimeLocalValue = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
};

export const pickLocale = (json: any, locale: 'vi' | 'en' = 'vi') =>
  json && typeof json === 'object'
    ? (json[locale] ?? json.vi ?? json.en ?? '')
    : (json ?? '');

export const getPetInfoLabel = (pet?: AdoptionApplication['pet']) => {
  if (!pet) return 'Chưa rõ thông tin';
  let ageLabel = '';
  if ((pet as any).dob) {
    const birth = new Date((pet as any).dob);
    if (!Number.isNaN(birth.getTime())) {
      const now = new Date();
      let months =
        (now.getFullYear() - birth.getFullYear()) * 12 +
        (now.getMonth() - birth.getMonth());
      if (now.getDate() < birth.getDate()) months -= 1;
      ageLabel =
        months < 12
          ? `${Math.max(months, 0)} tháng tuổi`
          : `${Math.floor(months / 12)} tuổi`;
    }
  }
  return (
    [ageLabel, pickLocale((pet as any).breed)].filter(Boolean).join(' - ') ||
    'Chưa rõ thông tin'
  );
};

// Xây state ban đầu (hoặc state đồng bộ lại) từ 1 appointment object
function buildStateFromAppointment(
  application: AdoptionApplication,
  appointment: any,
) {
  const defaultTitle =
    appointment?.title ||
    `Hẹn phỏng vấn nhận nuôi ${application.pet?.name || ''}`.trim();

  const format: 'Online' | 'Offline' = appointment?.type === 'ONLINE' ? 'Online' : 'Offline';

  const duration = (() => {
    if (appointment?.startTime && appointment?.endTime) {
      const [sh, sm] = appointment.startTime.split(':').map(Number);
      const [eh, em] = appointment.endTime.split(':').map(Number);
      const diff = eh * 60 + em - (sh * 60 + sm);
      return diff > 0 ? diff : 60;
    }
    return 60;
  })();

  const location =
    appointment?.location || (application.pet as any)?.shelter?.address || '';

  const dateSlot = appointment?.appointmentDate
    ? new Date(appointment.appointmentDate).toISOString()
    : '';

  const members: InterviewMember[] =
    Array.isArray(appointment?.members) && appointment.members.length > 0
      ? appointment.members.map((m: any) => ({
          id: m.id || crypto.randomUUID(),
          name: m.name || '',
          note: m.note || '',
        }))
      : [createEmptyMember()];

  return { title: defaultTitle, format, duration, location, dateSlot, members };
}

export function useInterviewScheduleForm(application: AdoptionApplication) {
  // existingAppointment giờ là state, không phải const — để có thể "hydrate" ngay
  // sau khi submit thành công (hiện link Meet tự tạo mà không cần đóng/mở lại modal)
  const [existingAppointment, setExistingAppointment] = useState<any>(
    (application as any)?.appointment ?? null,
  );

  const initial = buildStateFromAppointment(application, existingAppointment);

  const [title, setTitle] = useState(initial.title);
  const [format, setFormatState] = useState<'Online' | 'Offline'>(initial.format);
  const [duration, setDuration] = useState(initial.duration);
  const [location, setLocation] = useState(initial.location);
  const [dateSlot, setDateSlot] = useState<string>(initial.dateSlot);
  const [members, setMembers] = useState<InterviewMember[]>(initial.members);

  const [errors, setErrors] = useState<{
    dateSlot?: string;
    members?: string;
    location?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // FIX: đồng bộ lại toàn bộ form mỗi khi appointment thật sự đổi (id hoặc
  // updatedAt/meetLink khác) — chứ không chỉ chạy 1 lần lúc mount. Đây là
  // nguyên nhân gây bug "chọn Online ở modal này, sang modal khác lại thấy Offline".
  const lastSyncedKeyRef = useRef<string>(
    JSON.stringify({
      id: (application as any)?.appointment?.id ?? null,
      updatedAt: (application as any)?.appointment?.updatedAt ?? null,
      meetLink: (application as any)?.appointment?.meetLink ?? null,
      type: (application as any)?.appointment?.type ?? null,
    }),
  );

  useEffect(() => {
    const nextAppointment = (application as any)?.appointment ?? null;
    const nextKey = JSON.stringify({
      id: nextAppointment?.id ?? null,
      updatedAt: nextAppointment?.updatedAt ?? null,
      meetLink: nextAppointment?.meetLink ?? null,
      type: nextAppointment?.type ?? null,
    });

    if (nextKey === lastSyncedKeyRef.current) return; // không có gì mới, khỏi reset
    lastSyncedKeyRef.current = nextKey;

    const next = buildStateFromAppointment(application, nextAppointment);
    setExistingAppointment(nextAppointment);
    setTitle(next.title);
    setFormatState(next.format);
    setDuration(next.duration);
    setLocation(next.location);
    setDateSlot(next.dateSlot);
    setMembers(next.members);
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [application]);

  const addMember = () => setMembers((prev) => [...prev, createEmptyMember()]);

  const removeMember = (id: string) =>
    setMembers((prev) => (prev.length > 1 ? prev.filter((m) => m.id !== id) : prev));

  const updateMember = (id: string, field: 'name' | 'note', value: string) =>
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)));

  const setDate = (isoOrLocalValue: string, isLocalInput = false) => {
    const iso = !isoOrLocalValue
      ? ''
      : isLocalInput
      ? new Date(isoOrLocalValue).toISOString()
      : isoOrLocalValue;
    setDateSlot(iso);
    if (errors.dateSlot) setErrors((prev) => ({ ...prev, dateSlot: undefined }));
  };

  const changeFormat = (next: 'Online' | 'Offline') => {
    setFormatState(next);
    if (errors.location) setErrors((prev) => ({ ...prev, location: undefined }));
  };

  const validate = () => {
    const nextErrors: typeof errors = {};

    if (!dateSlot) {
      nextErrors.dateSlot = 'Vui lòng chọn ngày & giờ hẹn';
    } else if (new Date(dateSlot).getTime() < Date.now() - 5 * 60 * 1000) {
      nextErrors.dateSlot = 'Thời gian hẹn phải ở tương lai';
    }

    if (format === 'Offline' && !location.trim()) {
      nextErrors.location = 'Vui lòng nhập địa điểm phỏng vấn';
    }

    const filledMembers = members.filter((m) => m.name.trim());
    if (filledMembers.length === 0) {
      nextErrors.members = 'Cần ít nhất 1 thành viên tham gia';
    }

    setErrors(nextErrors);
    return { valid: Object.keys(nextErrors).length === 0, filledMembers };
  };

  const buildPayload = (): InterviewSubmitPayload | null => {
    const { valid, filledMembers } = validate();
    if (!valid) return null;

    const dateLabel = new Date(dateSlot).toLocaleString('vi-VN', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
    const placeInfo =
      format === 'Offline'
        ? `Địa điểm: ${location}`
        : 'Hình thức: Google Meet (link tạo tự động)';
    const reviewNote = `Lịch phỏng vấn (${format}): ${title}. Ngày giờ: ${dateLabel}. ${placeInfo}. Thành viên: ${filledMembers
      .map((m) => m.name)
      .join(', ')}`;

    return {
      title,
      format,
      location: format === 'Offline' ? location : null,
      durationMinutes: duration,
      scheduledAt: dateSlot,
      members: filledMembers,
      reminderMinutesBefore: REMINDER_MINUTES_BEFORE,
      reviewNote,
    };
  };

  // onSubmit giờ PHẢI trả về appointment object mà BE vừa tạo/cập nhật
  // (bao gồm meetLink) — để hook hydrate ngay, khỏi cần đóng/mở lại modal
  // mới thấy link Meet vừa tạo.
  const submit = useCallback(
    async (onSubmit: (data: InterviewSubmitPayload) => Promise<any>) => {
      const payload = buildPayload();
      if (!payload || isSubmitting) return false;

      setSubmitError(null);
      setIsSubmitting(true);
      try {
        const savedAppointment = await onSubmit(payload);
        if (savedAppointment && typeof savedAppointment === 'object') {
          setExistingAppointment(savedAppointment);
          lastSyncedKeyRef.current = JSON.stringify({
            id: savedAppointment?.id ?? null,
            updatedAt: savedAppointment?.updatedAt ?? null,
            meetLink: savedAppointment?.meetLink ?? null,
            type: savedAppointment?.type ?? null,
          });
        }
        return true;
      } catch (err: any) {
        setSubmitError(err?.message || 'Có lỗi xảy ra khi lên lịch, vui lòng thử lại.');
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [title, format, duration, location, dateSlot, members, isSubmitting],
  );

  return {
    existingAppointment,
    title, setTitle,
    format, changeFormat,
    duration, setDuration,
    location, setLocation,
    dateSlot, setDate,
    members, addMember, removeMember, updateMember,
    errors, setErrors,
    isSubmitting, submitError,
    submit,
  };
}