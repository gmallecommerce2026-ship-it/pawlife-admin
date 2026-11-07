import type { PetStatus } from '@/types/pet';

export interface PetStatusMeta {
  label: string;
  bg: string;
  border: string;
  color: string;
}

export const PET_STATUS_CONFIG: Record<PetStatus, PetStatusMeta> = {
  AVAILABLE:    { label: 'Chờ nhận nuôi',      bg: '#DEFFDF', border: '#00AC47', color: '#00AC47' },
  FOSTERING:    { label: 'Foster',             bg: '#FFF1E6', border: '#E89B5A', color: '#E89B5A' },
  PENDING:      { label: 'Đang xét duyệt',     bg: '#FFF8E5', border: '#FFBA00', color: '#B88A00' },
  REJECTED:     { label: 'Không đủ điều kiện', bg: '#FFE2E2', border: '#9F0712', color: '#9F0712' },
  HEALTH_ISSUE: { label: 'Vấn đề sức khoẻ',    bg: '#FFEDD4', border: '#A13A17', color: '#A13A17' },
  ADOPTED:      { label: 'Đã nhận nuôi',       bg: '#F0F0F0', border: '#BDBDBD', color: '#757575' },
};

export const PET_STATUS_ORDER = Object.keys(PET_STATUS_CONFIG) as PetStatus[];

export const getPetStatusMeta = (status?: string | null): PetStatusMeta =>
  PET_STATUS_CONFIG[String(status ?? '').toUpperCase() as PetStatus] ?? PET_STATUS_CONFIG.AVAILABLE;