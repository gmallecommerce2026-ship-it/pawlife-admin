import { PetStatus } from '@/types/pet';

// Màu badge trạng thái — Available = xanh lá, Pending = cam, Adopted = xám,
// theo đúng ảnh mẫu (bản cũ trong PetCard.tsx đang gán nhầm Available = cam).
export const PET_STATUS_STYLE: Record<PetStatus, { bg: string; text: string; border: string }> = {
  AVAILABLE: { bg: 'bg-[#DEFFDF]', text: 'text-[#00AC47]', border: 'border-[#00AC47]/30' },
  PENDING: { bg: 'bg-[#FFF4EA]', text: 'text-[#E89B5A]', border: 'border-[#E89B5A]/30' },
  ADOPTED: { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-200' },
};