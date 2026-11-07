import { PetGender } from '@/types/pet';

// ⚠️ Model GIẢ ĐỊNH — codebase hiện chưa có API/bảng dữ liệu theo dõi sau nhận
// nuôi (post-adoption). Field đặt tên theo đúng cột trong design mẫu. Đổi lại
// khi có API thật (có thể là 1 bảng riêng `AdoptionRecord`, hoặc field lồng
// trong Pet khi status = ADOPTED).
export interface PostAdoptionRecord {
  id: string;
  petId: string;
  petName: string;
  petGender: PetGender;
  petImage?: string | null;
  breed: string;
  adopterName: string;
  adoptionDate: string; // ISO date
  nextFollowUpDate?: string | null; // ISO date
}

// Số ngày từ adoptionDate tới hiện tại — hiển thị cột "Days Since".
export const getDaysSince = (isoDate: string): number => {
  const start = new Date(isoDate).getTime();
  if (Number.isNaN(start)) return 0;
  const diffMs = Date.now() - start;
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
};

export const fmtDate = (d?: string | null): string => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');

// ⚠️ SEED DATA TẠM để test UI — XOÁ khi đã nối API thật.
export const MOCK_POST_ADOPTION_RECORDS: PostAdoptionRecord[] = Array.from({ length: 9 }).map((_, i) => ({
  id: `mock-adopt-${i + 1}`,
  petId: `mock-pet-${i + 1}`,
  petName: 'Max',
  petGender: i % 2 === 0 ? 'MALE' : 'FEMALE',
  petImage: null,
  breed: 'Labrador Retriever',
  adopterName: 'Julia Nguyen',
  adoptionDate: '2026-01-01T00:00:00.000Z',
  nextFollowUpDate: '2026-01-01T00:00:00.000Z',
}));