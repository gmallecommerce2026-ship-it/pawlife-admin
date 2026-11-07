'use client';
import React from 'react';
import { Mars, Venus } from 'lucide-react';
import { AdoptionApplicantPetSummary, localizedText, getPetAgeLabel } from '@/types/application';
import { Avatar } from './Avatar';

export const PetMiniCard: React.FC<{ pet?: AdoptionApplicantPetSummary }> = ({ pet }) => {
  const isMale = pet?.gender !== 'FEMALE';
  const breed = localizedText(pet?.breed) || 'Chưa rõ giống';
  const age = getPetAgeLabel(pet?.dob);

  return (
    <div className="mt-4 border border-gray-200 rounded-[12px] p-2 flex items-center gap-3 w-full bg-white shadow-sm">
      <Avatar avatarUrl={pet?.images?.[0]?.url} name={pet?.name} size={44} roundedClassName="rounded-lg" />
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="font-bold text-[14px] text-gray-900">{pet?.name || 'Chưa rõ'}</span>
          {isMale ? <Mars size={14} strokeWidth={2.5} className="text-[#3DB2FF]" /> : <Venus size={14} strokeWidth={2.5} className="text-[#FF6B93]" />}
        </div>
        <span className="text-[11px] text-gray-500">{age} • {breed}</span>
      </div>
    </div>
  );
};