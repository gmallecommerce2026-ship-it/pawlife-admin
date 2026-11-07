'use client';

import React, { useState } from 'react';
import { ChevronDown, HeartHandshake } from 'lucide-react';
import type { PetStatus } from '@/types/pet';
import { PET_STATUS_CONFIG, PET_STATUS_ORDER, getPetStatusMeta } from '@/constants/petStatus';

type Size = 'sm' | 'md';

const SIZE_CLASS: Record<Size, string> = {
  sm: 'text-[11px] px-2.5 py-1 gap-1',
  md: 'text-sm px-3.5 py-1.5 gap-1.5',
};

const ICON_SIZE: Record<Size, number> = { sm: 12, md: 14 };

interface PetStatusBadgeProps {
  status?: PetStatus | string | null;
  size?: Size;
  className?: string;
}

export const PetStatusBadge: React.FC<PetStatusBadgeProps> = ({ status, size = 'md', className = '' }) => {
  const meta = getPetStatusMeta(status);
  const isFostering = String(status ?? '').toUpperCase() === 'FOSTERING';

  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold whitespace-nowrap ${SIZE_CLASS[size]} ${className}`}
      style={{ backgroundColor: meta.bg, borderColor: meta.border, color: meta.color }}
    >
      {isFostering && <HeartHandshake size={ICON_SIZE[size]} className="shrink-0" />}
      {meta.label}
    </span>
  );
};

interface PetStatusDropdownProps {
  status: PetStatus;
  onChange: (status: PetStatus) => void;
  disabled?: boolean;
  loading?: boolean;
}

export const PetStatusDropdown: React.FC<PetStatusDropdownProps> = ({
  status,
  onChange,
  disabled,
  loading,
}) => {
  const [open, setOpen] = useState(false);
  const meta = getPetStatusMeta(status);
  const isFostering = status === 'FOSTERING';

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold border shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
        style={{ backgroundColor: meta.bg, borderColor: meta.border, color: meta.color }}
      >
        {loading ? (
          'Đang lưu...'
        ) : (
          <>
            {meta.label}
          </>
        )}
        <ChevronDown size={14} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-20 flex flex-col gap-0.5">
            {PET_STATUS_ORDER.map((key) => {
              const cfg = PET_STATUS_CONFIG[key];
              const selected = key === status;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen(false);
                    if (!selected) onChange(key);
                  }}
                  className={`w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selected ? 'font-bold text-gray-900 bg-gray-50' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cfg.border }} />
                  {key === 'FOSTERING' && <HeartHandshake size={13} className="text-[#E89B5A] shrink-0" />}
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default PetStatusBadge;