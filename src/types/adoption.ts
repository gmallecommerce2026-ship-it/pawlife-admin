// types/adoption.ts (hoặc constants/commitments.ts)
export interface AdoptionCommitments {
  annualVaccination?: boolean;      // Tiêm phòng hằng năm
  medicalFeeCoverage?: boolean;     // Chi trả phí y tế/điều trị khi cần thiết
  preAdoptionFee?: boolean;         // Chi trả các khoản trước khi nhận nuôi
  postAdoptionUpdate?: boolean;     // Cập nhật tình trạng sau nhận nuôi
  allowHomeVisit?: boolean;         // Cho thành viên đến thăm nhà
  providePersonalInfo?: boolean;    // Cung cấp thông tin cá nhân
}

export const COMMITMENT_CONFIG = [
  { key: 'annualVaccination', label: 'Tiêm phòng hằng năm' },
  { key: 'medicalFeeCoverage', label: 'Chi trả phí y tế/điều trị khi cần thiết' },
  { key: 'preAdoptionFee', label: 'Chi trả các khoản trước khi nhận nuôi' },
  { key: 'postAdoptionUpdate', label: 'Cập nhật tình trạng sau nhận nuôi' },
  { key: 'allowHomeVisit', label: 'Cho thành viên đến thăm nhà' },
  { key: 'providePersonalInfo', label: 'Cung cấp thông tin cá nhân' },
] as const;