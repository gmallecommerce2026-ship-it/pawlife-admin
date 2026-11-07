'use client';

import React from 'react';
import Link from 'next/link';
import { FiPlus, FiSearch, FiFilter, FiChevronDown } from 'react-icons/fi';
import { PawPrint, Bell } from 'lucide-react'; // <-- Thêm Bell vào đây
import { PetFilter, PetSpecies, PetStatus, PET_STATUS_LABEL, PET_SPECIES_LABEL } from '@/types/pet';
import PetSheetSyncMenu from '@/components/PetSheetSyncMenu';
interface PetPageHeaderProps {
  filter: PetFilter;
  onFilterChange: (patch: Partial<PetFilter>) => void;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  title?: string;
  showNewPetButton?: boolean;
}

export const PetPageHeader: React.FC<PetPageHeaderProps> = ({
  filter,
  onFilterChange,
  searchInput,
  onSearchInputChange,
  title = 'Quản lý Pet',
  showNewPetButton = true,
}) => {
  return (
    <div className="mb-5 sm:mb-[37px] flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-3">
      {/* Hàng 1: tiêu đề + hành động */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <h2 className="font-['Be_Vietnam_Pro',_sans-serif] text-[28px] sm:text-[40px] leading-tight text-[#0D062D] font-semibold tracking-tight truncate">
          {title}
        </h2>
        <div className="flex-1 lg:hidden" />
        <button
          type="button"
          aria-label="Thông báo"
          className="relative p-2 text-gray-400 hover:text-gray-700 transition-colors shrink-0 lg:hidden"
        >
          <Bell size={22} strokeWidth={1.8} />
          <span className="absolute top-[7px] right-[7px] w-2 h-2 bg-[#F46767] border-[1.5px] border-white rounded-full" />
        </button>
      </div>

      {/* Hàng 2: nút thêm + sync */}
      <div className="flex items-center gap-2 flex-wrap">
        {showNewPetButton && (
          <Link
            href="/shelter/pets/create"
            className="flex items-center gap-1.5 bg-[#FFF4EA] hover:bg-[#FFEBD6] text-[#F0A265] text-sm font-semibold px-4 h-10 rounded-full transition-colors shrink-0 whitespace-nowrap"
          >
            <FiPlus size={14} /> Thêm thú cưng
          </Link>
        )}
        <PetSheetSyncMenu />
      </div>

      <div className="hidden lg:block flex-1" />

      <button
        type="button"
        aria-label="Thông báo"
        className="relative p-2 text-gray-400 hover:text-gray-700 transition-colors shrink-0 hidden lg:block"
      >
        <Bell size={20} strokeWidth={1.8} />
        <span className="absolute top-[7px] right-[7px] w-2 h-2 bg-[#F46767] border-[1.5px] border-white rounded-full" />
      </button>

      {/* Tìm kiếm */}
      <div className="relative w-full lg:flex-1 lg:min-w-[220px]">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          value={searchInput}
          onChange={(e) => onSearchInputChange(e.target.value)}
          placeholder="Tìm bằng tên, giống hoặc ID..."
          className="w-full h-11 bg-[#F5F5F7] lg:bg-white border border-transparent lg:border-[#858585] rounded-full pl-10 pr-4 text-[16px] lg:text-sm text-gray-800 placeholder:text-gray-400 focus:bg-white focus:border-[#E89B5A] focus:ring-2 focus:ring-[#E89B5A]/20 focus:outline-none transition-all"
        />
      </div>

      {/* Bộ lọc: cuộn ngang trên mobile */}
      <div className="flex gap-2 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto no-scrollbar snap-x">
        {[
          { value: filter.status, onChange: (v: string) => onFilterChange({ status: v as PetStatus | 'ALL' }), all: 'Toàn bộ trạng thái', map: PET_STATUS_LABEL },
          { value: filter.species, onChange: (v: string) => onFilterChange({ species: v as PetSpecies | 'ALL' }), all: 'Toàn bộ loài', map: PET_SPECIES_LABEL },
        ].map((s, i) => (
          <div key={i} className="relative shrink-0 snap-start">
            <select
              value={s.value}
              onChange={(e) => s.onChange(e.target.value)}
              className="appearance-none bg-[#F5F5F7] lg:bg-white border border-transparent lg:border-[#858585] rounded-full h-11 pl-4 pr-9 text-[16px] lg:text-sm text-gray-700 font-medium focus:border-[#E89B5A] focus:outline-none cursor-pointer"
            >
              <option value="ALL">{s.all}</option>
              {Object.keys(s.map).map((k) => (
                <option key={k} value={k}>{(s.map as Record<string, string>)[k]}</option>
              ))}
            </select>
            <FiChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PetPageHeader;