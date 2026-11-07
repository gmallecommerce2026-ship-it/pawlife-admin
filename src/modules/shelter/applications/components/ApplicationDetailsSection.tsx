// src/modules/shelter/applications/components/ApplicationDetailsSection.tsx

'use client';

import React from 'react';
import { AdoptionApplication } from '@/types/application';
import { Check, X } from 'lucide-react';

const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-3 bg-white border border-gray-200 rounded-[10px] overflow-hidden">
    <div className="px-4 py-2.5 border-b border-gray-100 bg-[#FAFAFA]">
      <h3 className="font-bold text-[12px] text-gray-900">{title}</h3>
    </div>
    <div className="px-4 py-3">{children}</div>
  </div>
);

const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="flex flex-col">
    <span className="font-sans text-[11px] text-gray-400 mb-0.5 leading-none">{label}</span>
    <span className="font-sans text-[12px] text-gray-900 font-medium leading-snug">{value || 'Chưa cập nhật'}</span>
  </div>
);
interface CommitmentItemProps {
  label: string;
  isCommitted?: boolean;
}
export const CommitmentItem: React.FC<CommitmentItemProps> = ({
  label,
  isCommitted = false,
}) => {
  return (
    <div className="flex items-center gap-2.5 text-sm">
      {isCommitted ? (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center text-emerald-600">
          <Check className="h-3.5 w-3.5 stroke-[2.5]" />
        </span>
      ) : (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center text-rose-600">
          <X className="h-3.5 w-3.5 stroke-[2.5]" />
        </span>
      )}
      <span className={isCommitted ? 'text-gray-800 font-medium' : 'text-gray-500'}>
        {label}
      </span>
    </div>
  );
};

export const ApplicationDetailsSection: React.FC<{ application: AdoptionApplication }> = ({ application }) => {
  return (
    <div className="flex flex-col">
      <SectionCard title="B - Điều kiện sinh sống">
        <div className="grid grid-cols-2 gap-y-4 gap-x-4">
          <Field label="Địa chỉ" value={application.location} />
          <Field label="Loại nhà" value={application.housing} />
          <Field label="Trẻ em trong nhà" value={application.children} />
          <Field label="Kế hoạch chuồng/cũi" value={application.cage} />
        </div>
      </SectionCard>

      <SectionCard title="C - Kinh nghiệm nuôi thú cưng">
        <div className="flex flex-col gap-4">
          <Field label="Từng nuôi thú cưng" value={application.petExperience} />
          <Field label="Lịch sử nuôi trước đây" value={application.prevPetHistory} />
        </div>
      </SectionCard>

      <SectionCard title="D - Công việc & cá nhân">
        <Field label="Tình trạng việc làm" value={application.employmentStatus} />
      </SectionCard>

      {/* Section E: 2 cột độc lập */}
      <SectionCard title="E - Cam kết nhận nuôi">
        <div className="mb-3.5">
          <Field label="Lý do nhận nuôi" value={application.adoptionReason || 'Because I want to give them a forever home'} />
        </div>
        <div className="w-full h-px bg-gray-200 mb-3.5" />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3.5">
          <div className="flex flex-col gap-3.5">
            <CommitmentItem label="Tiêm phòng hằng năm" />
            <CommitmentItem label="Chi trả phí y tế/điều trị khi cần thiết" />
            <CommitmentItem label="Chi trả các khoản trước khi nhận nuôi" />
          </div>
          <div className="flex flex-col gap-3.5">
            <CommitmentItem label="Cập nhật tình trạng sau nhận nuôi" />
            <CommitmentItem label="Cho thành viên đến thăm nhà" />
            <CommitmentItem label="Cung cấp thông tin cá nhân" />
          </div>
        </div>
      </SectionCard>
    </div>
  );
};