// src/types/application.ts

import { ApplicantFlag } from "@/constants/applicantFlag";
import { ShelterStaffRole, STAFF_ROLE_LABEL } from "./shelterTeam";
export const resolveNoteRole = (note: any): ShelterStaffRole | undefined => {
  const raw =
    note?.authorRole ??
    note?.author?.role ??
    note?.author?.shelterRole ??
    note?.author?.staffRole ??
    note?.author?.membership?.role ??
    note?.authorMember?.role;

  if (!raw) return undefined;

  const normalized = String(raw).toUpperCase();

  // Chỉ chấp nhận giá trị nằm trong enum/union thật
  return normalized in STAFF_ROLE_LABEL ? (normalized as ShelterStaffRole) : undefined;
};
export interface PawHistoryItem {
  id: string;
  type: string;
  title: string;
  description: string;
  date: string;
}
export type ApplicationStatus =
  | 'SUBMITTED' | 'PENDING' | 'NEED_MORE_INFO'
  | 'INTERVIEW_SCHEDULED' | 'APPROVED' | 'ADOPTION_COMPLETED' | 'CLOSED';
export type DocumentCategory = 'SHELTER' | 'VETERINARY' | 'APPLICANT' | 'STAFF';
export type DocumentStatus = 'PENDING_SUBMISSION' | 'PENDING_REVIEW' | 'ACCEPTED' | 'REJECTED';

export interface ApplicationDocument {
  id: string;
  applicationId: string;
  key: string;
  label: string;
  description: string;
  category: DocumentCategory;
  status: DocumentStatus;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSizeLabel?: string | null;
  submittedAt?: string | null;
  rejectionReason?: string | null;
  requestedAt: string;
}
export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  SUBMITTED: 'Mới nộp',
  PENDING: 'Đang xem xét',
  NEED_MORE_INFO: 'Cần bổ sung hồ sơ',
  INTERVIEW_SCHEDULED: 'Hẹn phỏng vấn',
  APPROVED: 'Đã duyệt',
  ADOPTION_COMPLETED: 'Đã bàn giao',
  CLOSED: 'Từ chối / Đóng',
};

export const KANBAN_COLUMNS: { status: ApplicationStatus; label: string }[] = [
  { status: 'SUBMITTED', label: 'Mới' },
  { status: 'PENDING', label: 'Đang xem xét' },
  { status: 'NEED_MORE_INFO', label: 'Cần bổ sung' },
  { status: 'INTERVIEW_SCHEDULED', label: 'Hẹn phỏng vấn' },
  { status: 'APPROVED', label: 'Đã duyệt' },
  { status: 'CLOSED', label: 'Từ chối' },
];

export type YesNo = 'Yes' | 'No';
export type YesNoSometimes = 'Yes' | 'No' | 'Sometimes';
export type ApplicationNoteType =
  | 'HOME_VISIT'
  | 'VET_RECORDS'
  | 'FOLLOW_UP'
  | 'CONCERN'
  | 'REJECTION'
  | 'REFERENCE_CHECK'
  | 'BACKGROUND_CHECK'
  | 'ADOPTER_QUESTION'; 

export const NOTE_TYPE_OPTIONS: { value: ApplicationNoteType; label: string; color: string }[] = [
  { value: 'HOME_VISIT', label: 'Thăm nhà', color: '#1B8A44' },
  { value: 'VET_RECORDS', label: 'Hồ sơ thú y', color: '#3B6BE3' },
  { value: 'FOLLOW_UP', label: 'Theo dõi sau', color: '#0EA5A5' },
  { value: 'CONCERN', label: 'Lưu ý / Quan ngại', color: '#D97706' },
  { value: 'REJECTION', label: 'Từ chối', color: '#DC2626' },
  { value: 'REFERENCE_CHECK', label: 'Kiểm tra người tham chiếu', color: '#7C3AED' },
  { value: 'BACKGROUND_CHECK', label: 'Xác minh lý lịch', color: '#8A38D4' },
];

// Thêm khoảng ngày thật vào filter
export type DateRangePreset = 'TODAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'ALL';



export interface ApplicationNote {
  id: string;
  authorId: string;
  authorName?: string;
  authorAvatar?: string;
  authorRole?: ShelterStaffRole | null;
  content: string;
  type: ApplicationNoteType; // 🆕 bắt buộc — khớp với schema mới
  createdAt: string;
}
export const ROLE_BADGE_STYLE: Record<ShelterStaffRole, string> = {
  ADMIN: 'bg-[#F4E8FF] text-[#A855F7]',      // Tím
  MEMBER: 'bg-[#E0F2FE] text-[#3B82F6]',     // Xanh dương
  VOLUNTEER: 'bg-[#DCFCE7] text-[#22C55E]',  // Xanh lá
  VETERINARIAN: 'bg-[#FCE7F3] text-[#EC4899]',// Hồng
};
export interface ApplicantProfileResponse {
  applicant: {
    id: string;
    fullName: string;
    phone: string;
    email: string | null;
    avatarUrl: string | null;
  };
  stats: {
    activeApplications: number;
    successfulAdoptions: number;
    totalApplications: number;
  };
  activeApplications: ApplicantAppSummary[];
  adoptionHistory: ApplicantAppSummary[];
  currentPets: {
    id: string;
    name: string;
    status: string;
    avatarUrl: string | null;
    qrVerificationStatus: string;
    pawHistory: PawHistoryItem[];
  }[];
  notes: {
    id: string;
    content: string;
    type: ApplicationNoteType; 
    createdAt: string;
    author: { id: string; name: string | null; avatarUrl: string | null };
  }[];
}

export interface ApplicantAppSummary {
  id: string;
  status: string;
  createdAt: string;
  pet: { id: string; name: string; avatarUrl: string | null };
  shelterName: string | null;
}
export interface AdoptionCommitments {
  vaccine?: YesNoSometimes;      // Tiêm phòng hằng năm
  medical?: YesNoSometimes;      // Chi trả phí y tế/điều trị khi cần thiết
  expenses?: YesNoSometimes;     // Chi trả các khoản trước khi nhận nuôi
  updateStatus?: YesNoSometimes; // Cập nhật tình trạng sau nhận nuôi
  homeVisit?: YesNoSometimes;    // Cho thành viên đến thăm nhà
  provideID?: YesNoSometimes;    // Cung cấp thông tin cá nhân
  [key: string]: YesNoSometimes | undefined;
}

export const ADOPTION_COMMITMENTS_LIST = [
  { key: 'vaccine', labelVi: 'Tiêm phòng hàng năm', labelEn: 'Yearly vaccinations' },
  { key: 'updateStatus', labelVi: 'Cập nhật tình trạng nuôi', labelEn: 'Provide status updates' },
  { key: 'medical', labelVi: 'Khám chữa bệnh khi cần', labelEn: 'Hospital treatment when needed' },
  { key: 'homeVisit', labelVi: 'Cho phép thăm nhà', labelEn: 'Allow home visits' },
  { key: 'expenses', labelVi: 'Chi trả chi phí bàn giao', labelEn: 'Cover pre-adoption expenses' },
  { key: 'provideID', labelVi: 'Cung cấp CCCD & thông tin chính xác', labelEn: 'Willing to provide needed personal info' },
  { key: 'spayNeuter', labelVi: 'Cam kết triệt sản đúng độ tuổi', labelEn: 'Spay/Neuter when of age' },
  { key: 'noAbandonment', labelVi: 'Nuôi trọn đời, không bỏ rơi/bán lại', labelEn: 'Lifetime commitment, no abandonment' },
  { key: 'safeEnvironment', labelVi: 'Môi trường an toàn, không thả rông', labelEn: 'Safe living environment, no free-roaming' },
] as const;
export const COMMITMENTS_CONFIG = [
  // Hàng 1
  { key: 'vaccine', label: 'Tiêm phòng hằng năm' },
  { key: 'updateStatus', label: 'Cập nhật tình trạng sau nhận nuôi' },
  // Hàng 2
  { key: 'medical', label: 'Chi trả phí y tế/điều trị khi cần thiết' },
  { key: 'homeVisit', label: 'Cho thành viên đến thăm nhà' },
  // Hàng 3
  { key: 'expenses', label: 'Chi trả các khoản trước khi nhận nuôi' },
  { key: 'provideID', label: 'Cung cấp thông tin cá nhân' },
] as const;
export type LocalizedText = { vi?: string; en?: string } | string | null | undefined;

export interface AdoptionApplicantUser {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
}
export interface AdoptionApplicantPetSummary {
  id: string;
  name: string;
  breed?: LocalizedText;
  species?: LocalizedText;
  gender?: string | null;
  dob?: string | null;
  images?: { url: string }[];
  avatarUrl?: string | null;
  status?: string | null;
  // 🆕 dùng cho PDF
  color?: LocalizedText;
  weight?: number | null;
  size?: 'SMALL' | 'MEDIUM' | 'LARGE' | null;
  idSetByShelter?: string | null;
  shelterInternalId?: string | null;
  microchipNumber?: string | null;
}
export interface AdoptionApplicantPetSummary {
  id: string;
  name: string;
  breed?: LocalizedText;
  species?: LocalizedText;
  gender?: string | null;
  dob?: string | null;
  images?: { url: string }[];
  avatarUrl?: string | null;
  status?: string | null; 
}

export interface ApplicationTag {
  id: string;
  name: string;
  color?: string | null;
}

export interface ApplicationNote {
  id: string;
  authorId: string;
  authorName?: string;
  authorAvatar?: string;
  authorRole?: ShelterStaffRole | null;
  content: string;
  createdAt: string | Date;
}

export interface ApplicationDocumentSummary {
  id: string;
  key: string;
  status: 'PENDING_SUBMISSION' | 'PENDING_REVIEW' | 'ACCEPTED' | 'REJECTED';
}
export type AppointmentStatusType =
  | 'PENDING'
  | 'CONFIRMED'
  | 'RESCHEDULED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'REJECTED';

export type AppointmentFormatType = 'IN_PERSON' | 'ONLINE';

// 🆕
export interface AppointmentSummary {
  id?: string;
  title?: string | null;
  appointmentDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  type?: AppointmentFormatType;
  status?: AppointmentStatusType;
  location?: string | null;
  meetLink?: string | null;
  members?: unknown;
}
export interface RelatedPetSummary {
  id: string;
  name: string;
  gender?: string | null;
  dob?: string | null;
  breed?: LocalizedText;
  shelterInternalId?: string | null;
  microchipNumber?: string | null;
  images?: { url: string }[];
}

export interface RelatedApplication {
  id: string;
  status: ApplicationStatus;
  petId: string;
  petName: string;
  pet?: RelatedPetSummary | null;   // 👈 mới
  interview: { at: string; status: string; staff: string[] } | null;
}

export interface AdoptionApplication {
  id: string;
  status: ApplicationStatus;
  reviewNote?: string | null;
  fullName: string;
  phone: string;
  zalo?: string;
  adoptFor?: string;
  location?: string;
  housing?: string;
  children?: string;
  cage?: string;
  petExperience?: string;
  prevPetHistory?: string;
  employmentStatus?: string;
  applicantFlag?: ApplicantFlag | null;
  adoptionReason?: string;
  commitments?: AdoptionCommitments;
  tags?: ApplicationTag[];
  notes?: ApplicationNote[];
  pet?: AdoptionApplicantPetSummary;
  user?: AdoptionApplicantUser;
  relatedApplications?: RelatedApplication[];
  documents?: ApplicationDocumentSummary[];
  appointment?: AppointmentSummary | null; 
  createdAt: string;
  updatedAt?: string;
}

export interface ApplicationFilter {
  search: string;
  noteTypes: ApplicationNoteType[];
  datePreset: DateRangePreset;
}
export const DATE_PRESET_LABEL: Record<DateRangePreset, string> = {
  TODAY: 'Hôm nay',
  LAST_7_DAYS: '7 ngày qua',
  LAST_30_DAYS: '30 ngày qua',
  ALL: 'Toàn bộ thời gian',
};

export const defaultApplicationFilter: ApplicationFilter = { search: '', noteTypes: [], datePreset: "ALL" };

export function localizedText(value: LocalizedText, locale: 'vi' | 'en' = 'vi'): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return (locale === 'vi' ? value.vi : value.en) || value.vi || value.en || '';
}

export function getPetAgeLabel(dob?: string | null): string {
  if (!dob) return 'Chưa rõ tuổi';
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return 'Chưa rõ tuổi';
  const now = new Date();
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months -= 1;
  if (months < 1) return 'Dưới 1 tháng tuổi';
  if (months < 12) return `${months} tháng tuổi`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return rest > 0 ? `${years} tuổi ${rest} tháng` : `${years} tuổi`;
}

export function getInitials(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase() || '?';
}