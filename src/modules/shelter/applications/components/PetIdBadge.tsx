'use client';

import React from 'react';

export const getPetCode = (pet?: any): string =>
  String(pet?.shelterInternalId || pet?.microchipNumber || '').trim();

export const PetIdBadge: React.FC<{ pet?: any; className?: string }> = ({ pet, className = '' }) => {
  const code = getPetCode(pet);
  if (!code) return null;
  return (
    <div className={`shrink-0 flex flex-col items-end max-w-[130px] ${className}`} title={`ID: ${code}`}>
      <span className="text-[9.5px] font-semibold uppercase tracking-wider text-gray-400 leading-none">ID</span>
      <span className="mt-1 max-w-full truncate rounded-md bg-[#FFF4EA] px-1.5 py-0.5 font-mono text-[11px] font-semibold text-[#B45F1A] select-all">
        {code}
      </span>
    </div>
  );
};

export default PetIdBadge;