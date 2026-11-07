'use client';

import React from 'react';
import { Check, X } from 'lucide-react';
import { AdoptionApplication, COMMITMENTS_CONFIG } from '@/types/application';
import { buildPdfTranslated } from '@/utils/adoptionFormI18n';

const isAgreed = (val: unknown): boolean => {
  if (val === true || val === 1) return true;
  if (typeof val === 'string') {
    return ['có', 'co', 'yes', 'true', 'đồng ý', 'dong y', '1'].includes(val.trim().toLowerCase());
  }
  return false;
};

const readCommitment = (raw: any, key: string, label: string): boolean => {
  let c = raw;
  if (typeof c === 'string') {
    try { c = JSON.parse(c); } catch { return false; }
  }
  if (!c) return false;
  if (Array.isArray(c)) return c.includes(key) || c.includes(label);
  return isAgreed(c[key] ?? c[label]);
};

const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-3 bg-white border border-gray-200 rounded-[10px] overflow-hidden">
    <div className="px-3.5 py-2 border-b border-gray-100 bg-[#FAFAFA]">
      <h4 className="font-bold text-[11.5px] text-gray-800 uppercase tracking-wider">{title}</h4>
    </div>
    <div className="px-3.5 py-2.5">{children}</div>
  </div>
);

const Field = ({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value?: string | null;
  multiline?: boolean;
}) => (
  <div className="flex flex-col">
    <span className="text-[11px] text-gray-400 mb-0.5">{label}</span>
    <span
      className={`text-[12.5px] text-gray-800 font-medium leading-snug break-words ${
        multiline ? 'whitespace-pre-line' : ''
      }`}
    >
      {value || '-'}
    </span>
  </div>
);

const CommitmentRow = ({ label, ok }: { label: string; ok: boolean }) => (
  <div className="flex items-center gap-2.5 text-sm">
    <span className={`flex h-5 w-5 shrink-0 items-center justify-center ${ok ? 'text-emerald-600' : 'text-rose-600'}`}>
      {ok ? <Check className="h-3.5 w-3.5 stroke-[2.5]" /> : <X className="h-3.5 w-3.5 stroke-[2.5]" />}
    </span>
    <span className={ok ? 'text-gray-800 font-medium' : 'text-gray-500'}>{label}</span>
  </div>
);

interface ApplicationDetailBodyProps {
  application: AdoptionApplication;
  /** Câu hỏi của người nhận nuôi (đã bỏ tiền tố "Câu hỏi từ người nhận nuôi:") */
  adopterQuestion?: string;
}

export const ApplicationDetailBody: React.FC<ApplicationDetailBodyProps> = ({
  application,
  adopterQuestion,
}) => {
  const tr = buildPdfTranslated(application);
  const location = application.location?.trim() || 'Chưa cập nhật';

  return (
    <div className="flex flex-col gap-2.5 mt-3 animate-in fade-in duration-200">
      <SectionCard title="A - Điều kiện sinh sống">
        <div className="grid grid-cols-2 gap-y-2.5 gap-x-3">
          <Field label="Khu vực / Địa chỉ" value={location} />
          <Field label="Loại nhà ở" value={tr.housing} />
          <Field label="Trẻ em trong nhà" value={tr.children} />
          <Field label="Kế hoạch chuồng / xích" value={tr.cage} />
        </div>
      </SectionCard>

      <SectionCard title="B - Kinh nghiệm & Việc làm">
        <div className="grid grid-cols-2 gap-y-2.5 gap-x-3">
          <Field label="Từng nuôi thú cưng" value={tr.petExperience} />
          <Field label="Tình trạng việc làm" value={tr.employmentStatus} />
          <div className="col-span-2">
            <Field label="Lịch sử chăm sóc" value={tr.prevPetHistory} />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="C - Cam kết nhận nuôi">
        <div className="mb-2.5">
          <Field label="Lý do nhận nuôi" value={tr.adoptionReason} />
        </div>
        <div className="w-full h-px bg-gray-200 mb-3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 items-start">
          {COMMITMENTS_CONFIG.map((item) => (
            <CommitmentRow
              key={item.key}
              label={item.label}
              ok={readCommitment(application.commitments, item.key, item.label)}
            />
          ))}
        </div>

        {adopterQuestion?.trim() && (
          <>
            <div className="w-full h-px bg-gray-200 my-3" />
            <Field label="Câu hỏi từ người nhận nuôi" value={adopterQuestion} multiline />
          </>
        )}
      </SectionCard>
    </div>
  );
};

export default ApplicationDetailBody;