'use client';

import React from 'react';
import Image from 'next/image';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { Mars, Venus, PawPrint } from 'lucide-react';
import { Pet, PetViewMode, PET_STATUS_LABEL } from '@/types/pet';
import { formatBreed, MaybeBilingual } from '@/utils/bilingualField';
import { PetStatusBadge } from '@/components/PetStatusBadge';
// =============================================================================
// SONG NGỮ (VI/EN) — breed/description/color hiện được lưu dạng { vi, en } sau
// khi PetForm submit (xem buildBilingualOnSubmit trong PetForm.tsx). Dữ liệu cũ
// hơn có thể vẫn là string thuần. Parse phòng thủ cả 2 trường hợp, ưu tiên hiển
// thị tiếng Việt vì trang quản lý shelter hiện tại 100% tiếng Việt.
// NẾU project đã có sẵn @/utils/bilingualField (displayBilingual), NÊN import
// trực tiếp từ đó thay vì dùng bản rút gọn dưới đây để tránh lệch logic.
// =============================================================================

// Tính tuổi từ ngày sinh — mirror getAge() bên mobile search.tsx, chỉ giữ bản
// tiếng Việt vì trang quản lý shelter hiện tại chưa có toggle ngôn ngữ.
const getAgeLabel = (dob?: string | null): string => {
  if (!dob) return 'Chưa rõ tuổi';
  const dobDate = new Date(dob);
  if (Number.isNaN(dobDate.getTime())) return 'Chưa rõ tuổi';

  const diffMs = Date.now() - dobDate.getTime();
  const ageDate = new Date(diffMs);
  const years = Math.abs(ageDate.getUTCFullYear() - 1970);
  const months = ageDate.getUTCMonth();

  if (years > 0) return `${years} tuổi`;
  if (months > 0) return `${months} tháng tuổi`;
  return 'Sơ sinh';
};

// ⚠️ Màu badge trạng thái dưới đây là suy đoán hợp lý theo tên field PetStatus
// (AVAILABLE/ADOPTED/PENDING/LOST...) — nếu enum thật của bạn khác, chỉ cần sửa
// object này, phần còn lại của component không cần đổi.
const STATUS_BADGE_STYLE: Record<string, string> = {
  AVAILABLE: 'bg-[#E89B5A]/10 text-[#E89B5A]',
  ADOPTED: 'bg-gray-100 text-gray-500',
  PENDING: 'bg-[#E89B5A]/10 text-[#E89B5A]',
  LOST: 'bg-red-50 text-red-500',
};

interface PetCardProps {
  pet: Pet;
  viewMode: PetViewMode;
  /** Bấm vào item (ngoài vùng nút Sửa/Xoá) — dùng để mở phone-preview chi tiết pet */
  onView?: (pet: Pet) => void;
  onEdit?: (pet: Pet) => void;
  onDelete?: (pet: Pet) => void;
}
const getImageUrl = (img: unknown): string | null => {
  if (typeof img === 'string') return img;
  if (img && typeof img === 'object' && 'url' in img) return (img as any).url || null;
  return null;
};
export const PetCard: React.FC<PetCardProps> = ({ pet, viewMode, onView, onEdit, onDelete }) => {
  const imageUrl = getImageUrl(pet.images?.[0]) || (pet as any).avatarUrl || null;
  const genderLower = String(pet.gender || '').toLowerCase();
  const isFemale = genderLower === 'female' || genderLower === 'cái' || genderLower === 'cai';
  const ageLabel = getAgeLabel((pet as any).dob);
  const breedLabel = formatBreed(pet.breed as MaybeBilingual) || 'Chưa rõ giống';

  const stop = (fn?: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn?.();
  };

  const HoverActions = (
    <div className="absolute top-2 right-2 flex gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-150 z-10">
      <button
        type="button"
        onClick={stop(() => onEdit?.(pet))}
        title="Sửa pet"
        className="w-9 h-9 md:w-8 md:h-8 rounded-full bg-white/95 shadow-sm flex items-center justify-center text-[#E89B5A] hover:bg-white"
      >
        <FiEdit2 size={14} />
      </button>
      <button
        type="button"
        onClick={stop(() => onDelete?.(pet))}
        title="Xoá pet"
        className="w-9 h-9 md:w-8 md:h-8 rounded-full bg-white/95 shadow-sm flex items-center justify-center text-red-500 hover:bg-white"
      >
        <FiTrash2 size={14} />
      </button>
    </div>
  );

  // ---------------------------------------------------------------------------
  // LIST VIEW — hàng ngang, thumbnail vuông nhỏ bên trái, thông tin ở giữa,
  // hover cũng hiện 2 nút Sửa/Xoá bên phải (đồng nhất hành vi với grid view).
  // ---------------------------------------------------------------------------
  if (viewMode === 'list') {
    return (
      <div
        onClick={() => onView?.(pet)}
        className="group relative flex items-center gap-4 bg-white border border-gray-200 rounded-2xl px-4 py-3 cursor-pointer hover:border-[#E89B5A]/40 hover:shadow-sm transition-all"
      >
        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
          {imageUrl ? (
            <Image src={imageUrl} alt={pet.name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <PawPrint size={22} />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-black font-semibold text-[15px] truncate">{pet.name}</p>
            <PetStatusBadge status={pet.status} size="sm" className="shrink-0" />
          </div>
          <div className="flex items-center gap-1 mt-1">
            {isFemale ? <Venus size={12} className="text-pink-400" /> : <Mars size={12} className="text-blue-400" />}
            <p className="text-[13px] text-gray-500 truncate">
              {ageLabel} · {breedLabel}
            </p>
          </div>
        </div>

        <div className="flex gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-150 shrink-0">
          <button
            type="button"
            onClick={stop(() => onEdit?.(pet))}
            title="Sửa pet"
            className="w-10 h-10 md:w-9 md:h-9 rounded-full bg-gray-50 flex items-center justify-center text-[#E89B5A] hover:bg-[#E89B5A]/10"
          >
            <FiEdit2 size={15} />
          </button>
          <button
            type="button"
            onClick={stop(() => onDelete?.(pet))}
            title="Xoá pet"
            className="w-10 h-10 md:w-9 md:h-9 rounded-full bg-gray-50 flex items-center justify-center text-red-500 hover:bg-red-50"
          >
            <FiTrash2 size={15} />
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // GRID VIEW — mirror PetCard bên mobile search.tsx: ảnh vuông bo góc 24px,
  // tên đậm, icon giới tính + "tuổi · giống" bên dưới. Badge trạng thái đặt góc
  // trên-trái ảnh (tính năng riêng cho trang quản lý, mobile không có vì đó là
  // màn public browsing).
  // ---------------------------------------------------------------------------
  return (
    <div onClick={() => onView?.(pet)} className="group cursor-pointer">
      <div className="relative aspect-square rounded-[20px] md:rounded-[24px] overflow-hidden bg-gray-100 border border-gray-100">
        {imageUrl ? (
          <Image src={imageUrl} alt={pet.name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <PawPrint size={32} />
          </div>
        )}

        <div className="absolute top-2 left-2 backdrop-blur-sm">
          <PetStatusBadge status={pet.status} size="sm" />
        </div>

        {/* Overlay tối nhẹ khi hover để 2 nút trắng nổi bật hơn trên ảnh */}
        <div className="absolute inset-0 bg-black/0 md:group-hover:bg-black/15 transition-colors duration-150" />
        {HoverActions}
      </div>

      <div className="pt-3">
        <p className="text-black font-semibold text-[16px] truncate">{pet.name}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {isFemale ? <Venus size={12} className="text-pink-400" /> : <Mars size={12} className="text-blue-400" />}
          <p className="text-[12px] text-[#8E8E93] truncate">
            {ageLabel} · {breedLabel}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PetCard;