'use client';
import React from 'react';
import { Phone, Mail } from 'lucide-react';
import { AdoptionApplication } from '@/types/application';
import { Avatar } from './Avatar';
import { PetMiniCard } from './PetMiniCard';

export const ApplicantHeader: React.FC<{ application: AdoptionApplication }> = ({ application }) => (
  <div className="flex gap-5 mb-6 mt-2">
    <Avatar avatarUrl={application.user?.avatarUrl} name={application.fullName || application.user?.name || "Maria Garcia"} size={100} />
    <div className="flex flex-col justify-center">
      <h2 className="text-[18px] font-bold text-gray-900 leading-tight mb-2.5">{application.fullName || application.user?.name || "Maria Garcia" || 'Chưa rõ tên'}</h2>
      <div className="flex items-center gap-2.5 text-gray-500 mb-1.5">
        <Phone size={14} />
        <span className="text-[13px]">{application.phone || 'Chưa cập nhật'}</span>
      </div>
      <div className="flex items-center gap-2.5 text-gray-500 mb-2.5">
        <Mail size={14} />
        <span className="text-[13px]">{application.user?.email || application.zalo || 'Chưa cập nhật'}</span>
      </div>
      <PetMiniCard pet={application.pet} />
    </div>
  </div>
);