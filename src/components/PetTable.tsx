'use client';

import React from 'react';
import Image from 'next/image';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { Mars, Venus, PawPrint } from 'lucide-react';
import { Pet } from '@/types/pet';
import { PetStatusBadge } from '@/components/PetStatusBadge';
import { formatBreed, MaybeBilingual } from '@/utils/bilingualField';

interface PetTableProps {
  pets: Pet[];
  onView?: (pet: Pet) => void;
  onEdit?: (pet: Pet) => void;
  onDelete?: (pet: Pet) => void;
}

const getAgeLabel = (dob?: string | null): string => {
  if (!dob) return 'Chưa rõ tuổi';
  const dobDate = new Date(dob);
  if (Number.isNaN(dobDate.getTime())) return 'Chưa rõ tuổi';
  const ageDate = new Date(Date.now() - dobDate.getTime());
  const years = Math.abs(ageDate.getUTCFullYear() - 1970);
  const months = ageDate.getUTCMonth();
  if (years > 0) return `${years} tuổi`;
  if (months > 0) return `${months} tháng tuổi`;
  return 'Sơ sinh';
};

const SPECIES_VI_LABEL: Record<string, string> = { DOG: 'Chó', CAT: 'Mèo' };

const formatSpecies = (species: unknown): string => {
  if (!species) return 'Chưa rõ';
  if (typeof species === 'object') {
    const obj = species as { vi?: string; en?: string };
    return obj.vi || (obj.en ? SPECIES_VI_LABEL[obj.en.toUpperCase()] : undefined) || obj.en || 'Chưa rõ';
  }
  const key = String(species).toUpperCase();
  return SPECIES_VI_LABEL[key] || String(species);
};

const formatShelterId = (pet: Pet): string => {
  const id = (pet as any).shelterInternalId;
  return id ? String(id).toUpperCase() : 'N/A';
};

const getImageUrl = (img: unknown): string | null => {
  if (typeof img === 'string') return img;
  if (img && typeof img === 'object' && 'url' in img) return (img as any).url || null;
  return null;
};

const COLUMNS_CLASS =
  'grid grid-cols-[minmax(220px,2fr)_minmax(120px,1fr)_minmax(200px,2fr)_minmax(120px,1fr)_minmax(120px,1fr)_minmax(140px,1fr)_72px] items-center gap-4';

export const PetTable: React.FC<PetTableProps> = ({ pets, onView, onEdit, onDelete }) => {
  const stop = (fn?: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn?.();
  };

  return (
    <>
      {/* ===== DESKTOP / TABLET ===== */}
      <div className="hidden md:block w-full bg-white border border-gray-200 rounded-[16px] overflow-hidden">
        <div className={`${COLUMNS_CLASS} px-6 py-4 bg-[#F9FAFB] border-b border-gray-200`}>
          <span className="text-[14px] font-medium text-gray-500">Tên Pet</span>
          <span className="text-[14px] font-medium text-gray-500">Loại</span>
          <span className="text-[14px] font-medium text-gray-500">Giống</span>
          <span className="text-[14px] font-medium text-gray-500">Tuổi</span>
          <span className="text-[14px] font-medium text-gray-500">Shelter ID</span>
          <span className="text-[14px] font-medium text-gray-500">Trạng thái</span>
          <span />
        </div>

        {pets.map((pet) => {
          const isFemale = String(pet.gender || '').toLowerCase() === 'female';
          const imageUrl = getImageUrl(pet.images?.[0]) || (pet as any).avatarUrl || null;
          return (
            <div
              key={pet.id}
              onClick={() => onView?.(pet)}
              className={`group ${COLUMNS_CLASS} px-6 py-4 border-b border-gray-100/80 last:border-0 cursor-pointer hover:bg-gray-50/50 transition-colors`}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-100 shrink-0 border border-gray-50">
                  {imageUrl ? (
                    <Image src={imageUrl} alt={pet.name} fill sizes="48px" className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300"><PawPrint size={20} /></div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-bold text-gray-900 text-[16px] truncate">{pet.name}</span>
                  {isFemale
                    ? <Venus size={16} strokeWidth={2.5} className="text-[#FF6B93] shrink-0" />
                    : <Mars size={16} strokeWidth={2.5} className="text-[#3DB2FF] shrink-0" />}
                </div>
              </div>

              <span className="text-[15px] text-gray-500 truncate">{formatSpecies(pet.species)}</span>
              <span className="text-[15px] text-gray-500 truncate">{formatBreed(pet.breed as MaybeBilingual) || 'Chưa rõ giống'}</span>
              <span className="text-[15px] text-gray-500 truncate">{getAgeLabel((pet as any).dob)}</span>
              <span className="text-[15px] text-gray-500 truncate">{formatShelterId(pet)}</span>
              <div><PetStatusBadge status={pet.status} size="sm" /></div>

              <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button type="button" onClick={stop(() => onEdit?.(pet))} title="Sửa pet"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#E89B5A] hover:bg-[#E89B5A]/10 transition-colors">
                  <FiEdit2 size={16} />
                </button>
                <button type="button" onClick={stop(() => onDelete?.(pet))} title="Xoá pet"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors">
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ===== MOBILE: danh sách thẻ ===== */}
      <div className="md:hidden flex flex-col gap-3">
        {pets.map((pet) => {
          const isFemale = String(pet.gender || '').toLowerCase() === 'female';
          const imageUrl = getImageUrl(pet.images?.[0]) || (pet as any).avatarUrl || null;
          return (
            <div
              key={pet.id}
              onClick={() => onView?.(pet)}
              className="bg-white rounded-[20px] border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-3.5 active:scale-[0.985] active:bg-gray-50 transition-all"
            >
              <div className="flex items-center gap-3.5">
                <div className="relative w-[60px] h-[60px] rounded-[16px] overflow-hidden bg-gray-100 shrink-0">
                  {imageUrl ? (
                    <Image src={imageUrl} alt={pet.name} fill sizes="60px" className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300"><PawPrint size={22} /></div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-gray-900 text-[16px] truncate">{pet.name}</span>
                    {isFemale
                      ? <Venus size={15} strokeWidth={2.5} className="text-[#FF6B93] shrink-0" />
                      : <Mars size={15} strokeWidth={2.5} className="text-[#3DB2FF] shrink-0" />}
                  </div>
                  <p className="text-[13px] text-gray-500 truncate mt-0.5">
                    {formatSpecies(pet.species)} · {formatBreed(pet.breed as MaybeBilingual) || 'Chưa rõ giống'}
                  </p>
                  <p className="text-[12px] text-gray-400 truncate">
                    {getAgeLabel((pet as any).dob)} · {formatShelterId(pet)}
                  </p>
                </div>
                <div className="shrink-0 self-start"><PetStatusBadge status={pet.status} size="sm" /></div>
              </div>

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                <button type="button" onClick={stop(() => onEdit?.(pet))}
                  className="flex-1 h-10 rounded-full bg-[#FFF4EA] text-[#E89B5A] text-[13px] font-semibold flex items-center justify-center gap-1.5">
                  <FiEdit2 size={14} /> Sửa
                </button>
                <button type="button" onClick={stop(() => onDelete?.(pet))}
                  className="flex-1 h-10 rounded-full bg-red-50 text-red-500 text-[13px] font-semibold flex items-center justify-center gap-1.5">
                  <FiTrash2 size={14} /> Xoá
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default PetTable;