// src/app/shelter/applications/components/InterviewScheduleModal.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  ArrowRight,
  Mars,
  Venus,
  Calendar,
  Trash2,
  Video,
  MapPin,
  ExternalLink,
  Copy,
  Check,
  RotateCw,
  Loader2,
} from 'lucide-react';
import { AdoptionApplication } from '@/types/application';
import { apiClient } from '@/lib/api/ApiClient';
import {
  RelatedApplicationsNotice, RelatedApplicationsWarnIcon,
  PetIdRow, PetCardActions, OtherPetsDropdown,
  getPetIdLabel,
  PetIdInline,
} from './RelatedApplications';
export interface InterviewMember {
  id: string;
  name: string;
  email: string;
  note: string;
}

export interface InterviewSubmitPayload {
  title: string;
  format: 'Online' | 'Offline';
  location: string | null;
  meetingLink?: string | null;
  durationMinutes: number;
  scheduledAt: string;
  members: Array<{ id: string; name: string; email?: string; note?: string }>;
  reminderMinutesBefore: number;
  reviewNote: string;
}

interface InterviewScheduleModalProps {
  application: AdoptionApplication;
  onClose: () => void;
  onSubmit: (data: InterviewSubmitPayload) => Promise<any>;
  onRefresh?: () => void;
  onReplacePet?: (application: AdoptionApplication) => void;
}

const REMINDER_MINUTES_BEFORE = 10;
const DURATION_OPTIONS = [30, 45, 60, 90];

export const pickLocale = (value: any, locale: 'vi' | 'en' = 'vi'): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    return value[locale] ?? value.vi ?? value.en ?? '';
  }
  return String(value);
};

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

const createEmptyMember = (): InterviewMember => ({
  id: crypto.randomUUID(),
  name: '',
  email: '',
  note: '',
});

const toDatetimeLocalValue = (dateOrIso?: string | Date | null) => {
  if (!dateOrIso) return '';
  const d = typeof dateOrIso === 'string' ? new Date(dateOrIso) : dateOrIso;
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

export const InterviewScheduleModal: React.FC<InterviewScheduleModalProps> = ({
  application,
  onClose,
  onSubmit,
  onRefresh,
  onReplacePet,
}) => {
  const existingAppointment = (application as any)?.appointment;
  const [isOtherPetsOpen, setIsOtherPetsOpen] = useState(false);
  const defaultTitle =
    existingAppointment?.title ||
    `Hẹn phỏng vấn nhận nuôi ${application.pet?.name || ''}`.trim();

  const [title, setTitle] = useState(defaultTitle);
  const [format, setFormat] = useState<'Online' | 'Offline'>(
    existingAppointment ? (existingAppointment.type === 'ONLINE' ? 'Online' : 'Offline') : 'Online'
  );

  // State Link Google Meet thực tế từ API
  const [meetLink, setMeetLink] = useState<string>(existingAppointment?.meetLink || '');
  const [isLoadingMeetLink, setIsLoadingMeetLink] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const initialDuration = (() => {
    if (existingAppointment?.startTime && existingAppointment?.endTime) {
      const [sh, sm] = existingAppointment.startTime.split(':').map(Number);
      const [eh, em] = existingAppointment.endTime.split(':').map(Number);
      const diff = eh * 60 + em - (sh * 60 + sm);
      return diff > 0 ? diff : 60;
    }
    return 60;
  })();

  const [duration, setDuration] = useState(initialDuration);
  const [location, setLocation] = useState(
    existingAppointment?.location ||
    (application.pet as any)?.shelter?.address ||
    ''
  );

  const [dateSlot, setDateSlot] = useState<string>(() => {
    if (existingAppointment?.appointmentDate) {
      return new Date(existingAppointment.appointmentDate).toISOString();
    }
    return '';
  });

  const [members, setMembers] = useState<InterviewMember[]>(() => {
    if (
      Array.isArray(existingAppointment?.members) &&
      existingAppointment.members.length > 0
    ) {
      return existingAppointment.members.map((m: any) => ({
        id: m.id || crypto.randomUUID(),
        name: m.name || '',
        email: m.email || '',
        note: m.note || '',
      }));
    }
    return [createEmptyMember()];
  });

  const [errors, setErrors] = useState<{
    dateSlot?: string;
    members?: string;
    location?: string;
    meetLink?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 👉 HÀM GỌI API BACKEND TẠO PHÒNG GOOGLE MEET THẬT
  const fetchRealMeetLink = useCallback(async () => {
    try {
      setIsLoadingMeetLink(true);
      const res: any = await apiClient.get('/applications/quick-meet-link');

      // Hỗ trợ mọi cấu trúc response từ Axios / NestJS
      const realLink =
        res?.data?.data?.meetLink ||
        res?.data?.meetLink ||
        res?.meetLink;

      if (realLink) {
        setMeetLink(realLink);
        setErrors((prev) => ({ ...prev, meetLink: undefined }));
      } else {
        console.warn('API trả về thành công nhưng không có meetLink:', res);
      }
    } catch (error: any) {
      console.error('Lỗi khi gọi API tạo link Meet:', error?.response?.data || error?.message);
    } finally {
      setIsLoadingMeetLink(false);
    }
  }, []);
  const appointmentKey = JSON.stringify((application as any)?.appointment ?? null);
  // Tự động gọi API lấy link thật khi mở modal (nếu chưa có lịch trước đó)
  useEffect(() => {
    const appt = (application as any)?.appointment;
    if (appt) {
      setTitle(appt.title || defaultTitle);
      setFormat(appt.type === 'ONLINE' ? 'Online' : 'Offline');
      setMeetLink(appt.meetLink || '');
      setDateSlot(appt.appointmentDate ? new Date(appt.appointmentDate).toISOString() : '');
      setLocation(appt.location || (application.pet as any)?.shelter?.address || '');
      if (Array.isArray(appt.members) && appt.members.length > 0) {
        setMembers(
          appt.members.map((m: any) => ({
            id: m.id || crypto.randomUUID(),
            name: m.name || '',
            email: m.email || '',
            note: m.note || '',
          }))
        );
      }
    } else {
      // Đơn mới move vào cột "Hẹn phỏng vấn" -> mặc định Online + tự tạo link Meet thật
      setFormat('Online');
      fetchRealMeetLink();
    }
  }, [application.id, appointmentKey]);

  const isMale = application.pet?.gender !== 'FEMALE';

  const handleAddMember = () => setMembers((prev) => [...prev, createEmptyMember()]);

  const handleRemoveMember = (id: string) =>
    setMembers((prev) => (prev.length > 1 ? prev.filter((m) => m.id !== id) : prev));

  const handleMemberChange = (id: string, field: 'name' | 'email' | 'note', value: string) =>
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)));

  const handleDateChange = (localDateString: string) => {
    if (!localDateString) {
      setDateSlot('');
      return;
    }
    const iso = new Date(localDateString).toISOString();
    setDateSlot(iso);
    if (errors.dateSlot) setErrors((prev) => ({ ...prev, dateSlot: undefined }));
  };

  const handleFormatChange = (next: 'Online' | 'Offline') => {
    setFormat(next);
    if (next === 'Offline' && !location.trim()) {
      setLocation((application.pet as any)?.shelter?.address || '');
    }
    if (next === 'Online' && !meetLink.trim()) {
      fetchRealMeetLink();
    }
    setErrors((prev) => ({ ...prev, location: undefined, meetLink: undefined }));
  };

  const handleCopyLink = async () => {
    if (!meetLink) return;
    try {
      await navigator.clipboard.writeText(meetLink);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch { }
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

    if (format === 'Online' && !meetLink.trim()) {
      nextErrors.meetLink = 'Đang tạo hoặc chưa có link Google Meet';
    }

    const filledMembers = members.filter((m) => m.name.trim());
    if (filledMembers.length === 0) {
      nextErrors.members = 'Cần ít nhất 1 thành viên trạm tham gia';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || isSubmitting) return;

    const filledMembers = members.filter((m) => m.name.trim());
    const dateLabel = new Date(dateSlot).toLocaleString('vi-VN', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
    const placeInfo =
      format === 'Offline'
        ? `Địa điểm: ${location}`
        : `Google Meet: ${meetLink}`;
    const reviewNote = `Lịch phỏng vấn (${format}): ${title}. Ngày giờ: ${dateLabel}. ${placeInfo}. Thành viên: ${filledMembers
      .map((m) => m.name)
      .join(', ')}`;

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        title,
        format,
        location: format === 'Offline' ? location : null,
        meetingLink: format === 'Online' ? meetLink.trim() : null,
        durationMinutes: duration,
        scheduledAt: dateSlot,
        members: filledMembers.map((m) => ({
          id: m.id,
          name: m.name.trim(),
          email: m.email?.trim() || undefined,
          note: m.note?.trim() || undefined,
        })),
        reminderMinutesBefore: REMINDER_MINUTES_BEFORE,
        reviewNote,
      });
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setSubmitError(
        err?.response?.data?.message ||
        err?.message ||
        'Có lỗi xảy ra khi lên lịch phỏng vấn.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="m-overlay fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="m-sheet bg-white w-full max-w-[560px] max-h-[90vh] rounded-[22px] shadow-2xl flex flex-col overflow-hidden relative animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-7 pt-8 sm:pt-6 pb-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-[20px] font-bold text-gray-900 leading-tight">
              {existingAppointment ? 'Cập nhật lịch phỏng vấn' : 'Lên lịch phỏng vấn'}
            </h2>
            <p className="text-[12px] text-gray-500 mt-0.5">
              Lịch hẹn và đường dẫn phòng họp sẽ được gửi thông báo trực tiếp đến ứng viên.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-7 py-5 sm:py-6 space-y-5 sm:space-y-6">
          {/* Adopter & Pet summary */}
          <div className="border border-gray-200 rounded-[16px] p-4 shadow-sm bg-[#FAFAFA] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src={application.user?.avatarUrl || '/default-avatar.png'}
                className="w-11 h-11 rounded-full object-cover border border-gray-200"
                alt="Adopter"
              />
              <div>
                <div className="flex flex-col">
                  <span className="font-bold text-[14px] text-gray-900 flex items-center gap-1.5">
                    {application.fullName || application.user?.name}
                    <RelatedApplicationsWarnIcon application={application} size={14} />
                  </span>
                  <span className="text-[11px] text-gray-500">
                    {application.phone || 'Chưa có SĐT'}
                  </span>
                </div>

              </div>

            </div>

            <ArrowRight size={16} className="text-gray-300 shrink-0 rotate-90 self-center sm:rotate-0" />

            <div className="flex items-center gap-3">
              <PetCardActions
                application={application}
                open={isOtherPetsOpen}
                onToggle={() => setIsOtherPetsOpen((v) => !v)}
                onReplacePet={onReplacePet}
              />
              <div className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <span className="font-bold text-[14px] text-gray-900">{application.pet?.name}</span>
                  {isMale ? (
                    <Mars size={13} strokeWidth={2.5} className="text-[#3DB2FF]" />
                  ) : (
                    <Venus size={13} strokeWidth={2.5} className="text-[#FF6B93]" />
                  )}
                </div>
                <PetIdInline
                  pet={application.pet}
                  fallback={``}
                  className="text-[11.5px] text-gray-400 mt-0.5 leading-snug"
                />
              </div>
              <img
                src={
                  application.pet?.avatarUrl ||
                  application.pet?.images?.[0]?.url ||
                  '/default-pet.png'
                }
                className="w-11 h-11 rounded-xl object-cover border border-gray-200"
                alt="Pet"
              />
            </div>
          </div>
          <OtherPetsDropdown application={application} open={isOtherPetsOpen} className="-mt-3" />
          {/* Form Content */}
          <div className="border border-gray-200 rounded-[16px] p-5 shadow-sm bg-white space-y-4">
            <div>
              <label className="text-[12px] font-medium text-gray-600 mb-1.5 block">
                Tiêu đề buổi hẹn
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Phỏng vấn nhận nuôi Cún Vàng"
                className="w-full border border-gray-200 rounded-[10px] px-3.5 py-2.5 text-[13px] text-gray-900 outline-none focus:border-[#E89B5A]"
              />
            </div>

            <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-4">
              <div>
                <label className="text-[12px] font-medium text-gray-600 mb-1.5 block">Hình thức</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleFormatChange('Online')}
                    className={`flex-1 py-2 rounded-[10px] text-[13px] font-medium transition-colors ${format === 'Online'
                      ? 'bg-[#5982E6] text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    Online
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormatChange('Offline')}
                    className={`flex-1 py-2 rounded-[10px] text-[13px] font-medium transition-colors ${format === 'Offline'
                      ? 'bg-[#5982E6] text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    Offline
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[12px] font-medium text-gray-600 mb-1.5 block">Thời lượng</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-[10px] px-3 py-2 text-[13px] text-gray-900 bg-white outline-none focus:border-[#E89B5A]"
                >
                  {DURATION_OPTIONS.map((m) => (
                    <option key={m} value={m}>{m} phút</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Offline vs Online (Input link Meet thật từ API) */}
            <div>
              {format === 'Offline' ? (
                <>
                  <label className="text-[12px] font-medium text-gray-600 mb-1.5 flex items-center gap-1">
                    <MapPin size={13} className="text-[#E89B5A]" /> Địa điểm phỏng vấn
                  </label>
                  <textarea
                    rows={2}
                    value={location}
                    onChange={(e) => {
                      setLocation(e.target.value);
                      if (errors.location) setErrors((prev) => ({ ...prev, location: undefined }));
                    }}
                    placeholder="Nhập địa chỉ trạm hoặc địa điểm gặp mặt..."
                    className={`w-full border rounded-[10px] p-3 text-[13px] outline-none resize-none ${errors.location ? 'border-red-400' : 'border-gray-200 focus:border-[#E89B5A]'
                      }`}
                  />
                  {errors.location && <p className="text-[11px] text-red-500 mt-1">{errors.location}</p>}
                </>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[12px] font-medium text-gray-600 flex items-center gap-1.5">
                      <Video size={14} className="text-[#5982E6]" />
                      Đường dẫn phòng họp Google Meet (Đã tạo thật)
                    </label>
                    <button
                      type="button"
                      disabled={isLoadingMeetLink}
                      onClick={fetchRealMeetLink}
                      className="text-[11px] font-medium text-[#5982E6] hover:text-blue-700 flex items-center gap-1 transition-colors disabled:opacity-50"
                      title="Gọi API tạo mã Google Meet mới"
                    >
                      {isLoadingMeetLink ? (
                        <>
                          <Loader2 size={11} className="animate-spin" /> Đang tạo...
                        </>
                      ) : (
                        <>
                          <RotateCw size={11} /> Tạo mã mới
                        </>
                      )}
                    </button>
                  </div>

                  <div className="relative flex items-center">
                    <input
                      type="text"
                      readOnly={isLoadingMeetLink}
                      value={isLoadingMeetLink ? 'Đang tạo phòng Google Meet thật...' : meetLink}
                      onChange={(e) => {
                        setMeetLink(e.target.value);
                        if (errors.meetLink) setErrors((prev) => ({ ...prev, meetLink: undefined }));
                      }}
                      placeholder="https://meet.google.com/xxx-yyyy-zzz"
                      className={`w-full border rounded-[10px] pl-3.5 pr-20 py-2.5 text-[13px] font-mono text-gray-900 bg-white outline-none transition-colors ${errors.meetLink ? 'border-red-400' : 'border-gray-200 focus:border-[#5982E6]'
                        }`}
                    />

                    <div className="absolute right-2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        disabled={isLoadingMeetLink || !meetLink}
                        title="Sao chép link"
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-30"
                      >
                        {isCopied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                      </button>
                      {meetLink && !isLoadingMeetLink && (
                        <a
                          href={meetLink.startsWith('http') ? meetLink : `https://${meetLink}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Vào phòng họp thử nghiệm"
                          className="p-1.5 text-gray-400 hover:text-[#5982E6] hover:bg-blue-50 rounded-md transition-colors"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>

                  {errors.meetLink && <p className="text-[11px] text-red-500 mt-1">{errors.meetLink}</p>}
                </div>
              )}
            </div>

            {/* Ngày giờ hẹn */}
            <div>
              <label className="text-[12px] font-medium text-gray-600 mb-1.5 block">
                Ngày &amp; giờ hẹn
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  min={toDatetimeLocalValue(new Date().toISOString())}
                  value={toDatetimeLocalValue(dateSlot)}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className={`w-full border rounded-[10px] pl-3.5 pr-10 py-2.5 text-[13px] text-gray-900 outline-none ${errors.dateSlot ? 'border-red-400' : 'border-gray-200 focus:border-[#E89B5A]'
                    }`}
                />
                <Calendar
                  size={16}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
              {errors.dateSlot && <p className="text-[11px] text-red-500 mt-1">{errors.dateSlot}</p>}
            </div>
          </div>

          {/* Thành viên tham gia */}
          <div className="border border-gray-200 rounded-[16px] p-5 shadow-sm bg-white space-y-3">
            <h3 className="font-bold text-[14px] text-gray-900">
              Nhân sự đại diện trạm tham gia phỏng vấn
            </h3>

            {members.map((member) => (
              <div key={member.id} className="border border-gray-100 rounded-[10px] p-3 space-y-2.5">
                <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
                  <div>
                    <label className="text-[11px] font-medium text-gray-500 mb-1 block">Tên nhân viên</label>
                    <input
                      type="text"
                      placeholder="VD: Nguyễn Văn A"
                      value={member.name}
                      onChange={(e) => handleMemberChange(member.id, 'name', e.target.value)}
                      className="w-full border border-gray-200 rounded-[8px] px-3 py-2 text-[12px] text-gray-900 outline-none focus:border-[#E89B5A]"
                    />
                  </div>
                  <div>
                    <div className="col-span-2 sm:col-span-1 order-last sm:order-none">
                      <label className="text-[11px] font-medium text-gray-500 mb-1 block">Vai trò / Ghi chú</label>
                    </div>
                    <input
                      type="text"
                      placeholder="VD: Phỏng vấn chính"
                      value={member.note}
                      onChange={(e) => handleMemberChange(member.id, 'note', e.target.value)}
                      className="w-full border border-gray-200 rounded-[8px] px-3 py-2 text-[12px] text-gray-900 outline-none focus:border-[#E89B5A]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(member.id)}
                    disabled={members.length === 1}
                    className="h-[38px] w-[38px] flex items-center justify-center rounded-[8px] border border-gray-200 text-gray-400 hover:text-red-500 disabled:opacity-40"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-gray-500 mb-1 block">
                    Email (để cấp quyền đồng tổ chức Google Meet)
                  </label>
                  <input
                    type="email"
                    placeholder="ten@gmail.com"
                    value={member.email}
                    onChange={(e) => handleMemberChange(member.id, 'email', e.target.value)}
                    className="w-full border border-gray-200 rounded-[8px] px-3 py-2 text-[12px] text-gray-900 outline-none focus:border-[#E89B5A]"
                  />
                </div>
              </div>
            ))}

            {errors.members && <p className="text-[11px] text-red-500">{errors.members}</p>}

            <button
              type="button"
              onClick={handleAddMember}
              className="text-[#E89B5A] hover:text-[#D68B4E] text-[12px] font-bold transition-colors pt-1"
            >
              + Thêm nhân viên
            </button>
          </div>

          {submitError && (
            <p className="text-[12px] text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
              {submitError}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3 sm:py-4 border-t border-gray-100 bg-white/90 backdrop-blur-xl sm:bg-[#FAFAFA] flex items-center justify-end gap-3 shrink-0 [&>button]:flex-1 sm:[&>button]:flex-none [&>button]:h-12 sm:[&>button]:h-auto">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-semibold text-[13px] rounded-[12px] shadow-sm disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isLoadingMeetLink}
            className="px-6 py-2.5 bg-[#E89B5A] hover:bg-[#D68B4E] text-white font-bold text-[13px] rounded-[12px] shadow-sm shadow-orange-100 transition-colors disabled:opacity-60"
          >
            {isSubmitting
              ? 'Đang xử lý...'
              : existingAppointment
                ? 'Cập nhật lịch hẹn'
                : 'Xác nhận lên lịch'}
          </button>
        </div>
      </div>
    </div>
  );
};