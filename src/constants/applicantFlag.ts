export const APPLICANT_FLAG_REASONS = [
  { value: 'NO_SHOW', label: 'Hẹn phỏng vấn nhưng không đến' },
  { value: 'ABUSIVE', label: 'Thái độ thiếu tôn trọng nhân viên' },
  { value: 'FAKE_INFO', label: 'Khai báo thông tin sai sự thật' },
  { value: 'PET_ABANDONED', label: 'Từng bỏ rơi / trả lại thú cưng' },
  { value: 'OTHER', label: 'Lý do khác' },
] as const;

export interface ApplicantFlag {
  reason: string;
  note?: string | null;
  createdAt: string;
}

export const getApplicantFlagLabel = (reason: string) =>
  APPLICANT_FLAG_REASONS.find((r) => r.value === reason)?.label ?? reason;