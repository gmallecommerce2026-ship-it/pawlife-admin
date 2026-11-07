'use client';

import React, { useState, useEffect } from 'react';
import { FiSearch, FiChevronDown, FiGrid, FiList } from 'react-icons/fi';
import { PetFilter, PetViewMode, PetSpecies, PetStatus, PET_STATUS_LABEL, PET_SPECIES_LABEL } from '@/types/pet';

interface PetFilterBarProps {
  filter: PetFilter;
  onFilterChange: (patch: Partial<PetFilter>) => void;
  viewMode: PetViewMode;
  onViewModeChange: (mode: PetViewMode) => void;
}

export const PetFilterBar: React.FC<PetFilterBarProps> = ({ filter, onFilterChange, viewMode, onViewModeChange }) => {
  const [searchInput, setSearchInput] = useState(filter.search);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchInput !== filter.search) onFilterChange({ search: searchInput });
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
      {/* Search - dạng pill giống ảnh mẫu */}
      <div className="relative flex-1 min-w-[220px]">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Tìm kiếm bằng tên, giống hoặc ID..."
          className="w-full bg-gray-50 border border-[#858585] rounded-full pl-10 pr-4 py-2.5 text-sm text-[#858585] focus:border-[#858585] focus:ring-2 focus:ring-[#E89B5A]/20 focus:outline-none transition-colors"
        />
      </div>

      {/* All Statuses */}
      <div className="relative shrink-0">
        <select
          value={filter.status}
          onChange={(e) => onFilterChange({ status: e.target.value as PetStatus | 'ALL' })}
          className="appearance-none bg-white border border-[#858585] rounded-full pl-4 pr-9 py-2.5 text-sm text-[#858585] font-medium focus:border-[#E89B5A] focus:outline-none cursor-pointer"
        >
          <option value="ALL">Toàn bộ trạng thái</option>
          {(Object.keys(PET_STATUS_LABEL) as PetStatus[]).map((s) => (
            <option key={s} value={s}>{PET_STATUS_LABEL[s]}</option>
          ))}
        </select>
        <FiChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
      </div>

      {/* All Species */}
      <div className="relative shrink-0">
        <select
          value={filter.species}
          onChange={(e) => onFilterChange({ species: e.target.value as PetSpecies | 'ALL' })}
          className="appearance-none bg-white border border-[#858585] rounded-full pl-4 pr-9 py-2.5 text-sm text-[#858585] font-medium focus:border-[#E89B5A] focus:outline-none cursor-pointer"
        >
          <option value="ALL">Toàn bộ loài</option>
          {(Object.keys(PET_SPECIES_LABEL) as PetSpecies[]).map((s) => (
            <option key={s} value={s}>{PET_SPECIES_LABEL[s]}</option>
          ))}
        </select>
        <FiChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
      </div>

      {/* Toggle grid/list - không có trong ảnh mẫu nhưng giữ lại vì bạn đang có 2 chế độ hiển thị */}
      <div className="flex items-center bg-gray-100 rounded-lg p-1 shrink-0">
        <button
          onClick={() => onViewModeChange('grid')}
          className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white text-[#E89B5A] shadow-sm' : 'text-gray-500'}`}
          aria-label="Xem dạng lưới"
        >
          <FiGrid size={16} />
        </button>
        <button
          onClick={() => onViewModeChange('list')}
          className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white text-[#E89B5A] shadow-sm' : 'text-gray-500'}`}
          aria-label="Xem dạng bảng"
        >
          <FiList size={16} />
        </button>
      </div>
    </div>
  );
};

export default PetFilterBar;