export type PetSpecies = 'DOG' | 'CAT';
export type PetGender = 'MALE' | 'FEMALE';
import { PET_STATUS_CONFIG } from '@/constants/petStatus';
export type PetStatus = 'AVAILABLE' | 'FOSTERING' | 'PENDING' | 'REJECTED' | 'HEALTH_ISSUE' | 'ADOPTED';

export interface Pet {
  id: string;
  name: string;
  species: PetSpecies;
  breed: string | { vi?: string; en?: string };
  age: number; // tính theo tháng tuổi
  gender: PetGender;
  status: PetStatus;
  images: string[]; // danh sách URL ảnh, ảnh đầu tiên là ảnh đại diện
  description: string | { vi?: string; en?: string };
  healthStatus: string[]; // vd: ["Đã tiêm phòng", "Đã triệt sản"]
  weightKg?: number;
  isSterilized?: boolean;
  isVaccinated?: boolean;
  createdAt?: string;
  updatedAt?: string;
  shelterInternalId?: string;
}

// Payload gửi lên khi tạo/sửa pet (chưa có id, ảnh xử lý riêng qua FormData)
export interface PetFormValues {
  name: string;
  species: PetSpecies;
  breed: string;
  age: number;
  gender: PetGender;
  status: PetStatus;
  description: string;
  healthStatus: string[];
  weightKg?: number;
  isSterilized: boolean;
  isVaccinated: boolean;
}

export const emptyPetFormValues: PetFormValues = {
  name: '',
  species: 'DOG',
  breed: '',
  age: 0,
  gender: 'MALE',
  status: 'AVAILABLE',
  description: '',
  healthStatus: [],
  weightKg: undefined,
  isSterilized: false,
  isVaccinated: false,
};

export type PetViewMode = 'grid' | 'list';

export interface PetFilter {
  search: string;
  species: PetSpecies | 'ALL';
  status: PetStatus | 'ALL';
  page: number;
  pageSize: number;
}

export const defaultPetFilter: PetFilter = {
  search: '',
  species: 'ALL',
  status: 'ALL',
  page: 1,
  pageSize: 12,
};

export interface PetListResponse {
  items: Pet[];
  total: number;
  page: number;
  pageSize: number;
}

export const PET_STATUS_LABEL: Record<PetStatus, string> = Object.fromEntries(
  Object.entries(PET_STATUS_CONFIG).map(([key, meta]) => [key, meta.label])
) as Record<PetStatus, string>;

export const PET_SPECIES_LABEL: Record<PetSpecies, string> = {
  DOG: 'Chó',
  CAT: 'Mèo',
};
