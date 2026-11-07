'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Search, Filter, Calendar, ChevronDown, Bell, Check } from 'lucide-react';
import { useApplicationFilter, useApplicationActions } from '@/stores/useApplicationStore';
import {
  NOTE_TYPE_OPTIONS,
  ApplicationNoteType,
  DateRangePreset,
  DATE_PRESET_LABEL,
} from '@/types/application';

const DATE_PRESETS: DateRangePreset[] = ['TODAY', 'LAST_7_DAYS', 'LAST_30_DAYS', 'ALL'];

export const ApplicationFilterBar: React.FC = () => {
  const { filter, setFilter } = useApplicationFilter();
  const { fetchApplications } = useApplicationActions();
  const [localSearch, setLocalSearch] = useState(filter.search);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isDateOpen, setIsDateOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);

  // đóng dropdown khi click ra ngoài
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
      if (dateRef.current && !dateRef.current.contains(e.target as Node)) {
        setIsDateOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  // 🆕 lọc "live" khi gõ, debounce 300ms — thay vì chỉ lọc khi submit
  useEffect(() => {
    const t = setTimeout(() => {
      if (localSearch !== filter.search) {
        setFilter({ search: localSearch });
      }
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilter({ search: localSearch });
  };

  const toggleNoteType = (value: ApplicationNoteType) => {
    const current = filter.noteTypes;
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setFilter({ noteTypes: next });
  };

  const selectDatePreset = (preset: DateRangePreset) => {
    setFilter({ datePreset: preset });
    setIsDateOpen(false);
  };

  const activeNoteTypeCount = filter.noteTypes.length;
  const isDateActive = filter.datePreset !== 'ALL';

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">

      {/* Ô tìm kiếm — lọc live, vẫn hỗ trợ Enter */}
      <form
        onSubmit={handleSubmit}
        className="relative flex items-center order-1 sm:order-2 w-full sm:w-[260px]"
      >
        <Search className="absolute left-3.5 text-gray-400 pointer-events-none" size={15} strokeWidth={2} />
        <input
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Tìm theo tên, SĐT, email hoặc tên thú cưng"
          className="w-full h-[38px] bg-white border border-[#858585] rounded-full pl-9 pr-4 text-[13px] text-gray-800 focus:outline-none focus:border-[#C4C4C4] placeholder-gray-400 transition-colors font-['Be Vietnam Pro',_sans-serif]"
        />
      </form>

      <div className="flex items-center gap-2 order-2 sm:order-none sm:contents">
        <button className="relative p-2 text-gray-400 hover:text-gray-700 transition-colors shrink-0 sm:order-1">
          <Bell size={20} strokeWidth={1.8} />
          <span className="absolute top-[7px] right-[7px] w-2 h-2 bg-[#F46767] border-[1.5px] border-white rounded-full"></span>
        </button>

        {/* Bộ lọc theo loại ghi chú */}
        <div className="relative shrink-0 sm:order-3" ref={filterRef}>
          <button
            type="button"
            onClick={() => setIsFilterOpen((v) => !v)}
            className={`flex items-center gap-1.5 sm:gap-2 h-[38px] px-3 sm:px-4 border rounded-full transition-colors ${
              activeNoteTypeCount > 0
                ? 'bg-[#FFF8F0] border-[#E89B5A]'
                : 'bg-white border-[#858585] hover:bg-gray-50'
            }`}
          >
            <Filter size={14} className={activeNoteTypeCount > 0 ? 'text-[#E89B5A]' : 'text-gray-400'} strokeWidth={2} />
            <span className={`hidden sm:inline text-[13.5px] font-medium font-['Be_Vietnam_Pro',_sans-serif] ${
              activeNoteTypeCount > 0 ? 'text-[#E89B5A]' : 'text-gray-500'
            }`}>
              Bộ lọc{activeNoteTypeCount > 0 ? ` (${activeNoteTypeCount})` : ''}
            </span>
            <ChevronDown size={14} className={`sm:ml-2 transition-transform ${isFilterOpen ? 'rotate-180' : ''} ${
              activeNoteTypeCount > 0 ? 'text-[#E89B5A]' : 'text-gray-400'
            }`} strokeWidth={2} />
          </button>

          {isFilterOpen && (
            <div className="absolute z-20 mt-2 w-[230px] bg-white border border-gray-200 rounded-[14px] shadow-lg p-3 right-0">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2 px-1">
                Loại ghi chú
              </p>
              {NOTE_TYPE_OPTIONS.map((opt) => {
                const checked = filter.noteTypes.includes(opt.value);
                return (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleNoteType(opt.value)}
                      className="w-4 h-4 rounded accent-[#E89B5A]"
                    />
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: opt.color }} />
                    <span className="text-[13px] text-gray-700">{opt.label}</span>
                  </label>
                );
              })}
              {activeNoteTypeCount > 0 && (
                <button
                  type="button"
                  onClick={() => setFilter({ noteTypes: [] })}
                  className="w-full text-center text-[12px] text-gray-500 hover:text-gray-700 mt-1 pt-2 border-t border-gray-100"
                >
                  Xoá bộ lọc
                </button>
              )}
            </div>
          )}
        </div>

        {/* 🆕 Nút ngày — giờ có dropdown thật, không còn hardcode */}
        <div className="relative shrink-0 sm:order-4" ref={dateRef}>
          <button
            type="button"
            onClick={() => setIsDateOpen((v) => !v)}
            className={`flex items-center gap-1.5 sm:gap-2 h-[38px] px-3 sm:px-4 border rounded-full transition-colors ${
              isDateActive
                ? 'bg-[#FFF8F0] border-[#E89B5A]'
                : 'bg-white border-[#858585] hover:bg-gray-50'
            }`}
          >
            <Calendar size={14} className={isDateActive ? 'text-[#E89B5A]' : 'text-gray-400'} strokeWidth={2} />
            <span className={`hidden sm:inline text-[13.5px] font-medium font-['Be_Vietnam_Pro',_sans-serif] ${
              isDateActive ? 'text-[#E89B5A]' : 'text-gray-500'
            }`}>
              {DATE_PRESET_LABEL[filter.datePreset]}
            </span>
            <ChevronDown size={14} className={`sm:ml-2 transition-transform ${isDateOpen ? 'rotate-180' : ''} ${
              isDateActive ? 'text-[#E89B5A]' : 'text-gray-400'
            }`} strokeWidth={2} />
          </button>

          {isDateOpen && (
            <div className="absolute z-20 mt-2 w-[200px] bg-white border border-gray-200 rounded-[14px] shadow-lg p-1.5 right-0">
              {DATE_PRESETS.map((preset) => {
                const active = filter.datePreset === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => selectDatePreset(preset)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] text-left transition-colors ${
                      active ? 'bg-[#FFF8F0] text-[#E89B5A] font-medium' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {DATE_PRESET_LABEL[preset]}
                    {active && <Check size={14} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};