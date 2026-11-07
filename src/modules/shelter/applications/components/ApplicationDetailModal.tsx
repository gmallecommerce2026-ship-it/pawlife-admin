// src/modules/shelter/applications/components/ApplicationDetailModal.tsx

'use client';

import React from 'react';
import { X, Download, Calendar, Clock, Check } from 'lucide-react';
import { AdoptionApplication, COMMITMENTS_CONFIG } from '@/types/application';
import { downloadApplicationPdf } from '@/utils/exportApplicationPdf';
import {
  translateAdoptFor,
  translateHousing,
  translateChildren,
  translateCage,
  translatePetExperience,
  translateEmploymentStatus,
  translatePetHistory,
  translateAdoptionReason,
} from '@/utils/translateApplication';

// ============================================================================
// 1. HELPER: định dạng ngày & kiểm tra trạng thái cam kết
// ============================================================================
const formatAppDate = (iso?: string) => {
  if (!iso) return 'Chưa cập nhật';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Chưa cập nhật';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const isCommitmentAgreed = (val: unknown): boolean => {
  if (val === true || val === 1) return true;
  if (typeof val === 'string') {
    const clean = val.trim().toLowerCase();
    return ['có', 'co', 'yes', 'true', 'đồng ý', 'dong y', '1'].includes(clean);
  }
  return false;
};

// ============================================================================
// 2. SUB-COMPONENTS
// ============================================================================
const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-3 bg-white border border-gray-200 rounded-[12px] overflow-hidden">
    <div className="px-4 py-2.5 border-b border-gray-100 bg-[#FAFAFA]">
      <h3 className="font-bold text-[13px] text-gray-900">{title}</h3>
    </div>
    <div className="px-4 py-3.5">
      {children}
    </div>
  </div>
);

const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="flex flex-col">
    <span className="font-['Be_Vietnam_Pro',_sans-serif] text-[11px] text-gray-400 mb-0.5 leading-none">
      {label}
    </span>
    <span className="font-['Be_Vietnam_Pro',_sans-serif] text-[13px] text-gray-900 font-medium leading-snug">
      {value || '-'}
    </span>
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

// ============================================================================
// 3. MAIN MODAL COMPONENT
// ============================================================================
interface ApplicationDetailModalProps {
  application: AdoptionApplication;
  onClose: () => void;
}

export const ApplicationDetailModal: React.FC<ApplicationDetailModalProps> = ({
  application,
  onClose,
}) => {
  const submitDate = formatAppDate(application.createdAt);
  const updateDate = formatAppDate(application.updatedAt || application.createdAt);

  const handleDownload = () => {
    console.log('=== RAW DATA KHI BẤM DOWNLOAD PDF (DetailModal) ===', {
      housing: application.housing,
      children: application.children,
      cage: application.cage,
      petExperience: application.petExperience,
      employmentStatus: application.employmentStatus,
      prevPetHistory: application.prevPetHistory,
      adoptionReason: application.adoptionReason,
      adoptFor: application.adoptFor,
    });
    downloadApplicationPdf(application);
  };

  return (
    <div className="m-overlay fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="m-sheet bg-white w-full max-w-[680px] max-h-[88vh] rounded-[16px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-white flex justify-between items-start px-5 sm:px-6 pt-7 sm:pt-5 pb-3 border-b border-gray-100 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-['Be_Vietnam_Pro',_sans-serif] text-[20px] font-bold text-gray-900 leading-none">
                Chi tiết đơn nhận nuôi
              </h2>
              <button
                type="button"
                onClick={handleDownload}
                title="Tải đơn nhận nuôi (PDF)"
                className="text-gray-400 hover:text-[#E89B5A] transition-colors p-1 cursor-pointer"
              >
                <Download size={16} strokeWidth={2.5} />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-gray-500 font-medium mt-1.5">
              <span className="flex items-center gap-1.5">
                <Calendar size={13} /> Ngày nộp: {submitDate}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={13} /> Cập nhật: {updateDate}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors p-1.5 bg-gray-50 hover:bg-gray-100 rounded-full cursor-pointer"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5 bg-white space-y-3">
          {/* Section A */}
          <SectionCard title="A - Thông tin liên hệ">
            <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-y-3 gap-x-4">
              <Field label="Họ và tên" value={application.fullName || application.user?.name || 'Người nhận nuôi'} />
              <Field label="Số điện thoại" value={application.phone} />
              <Field label="Email / Zalo" value={application.user?.email || application.zalo || 'Chưa cập nhật'} />
              <Field label="Đối tượng nhận nuôi" value={translateAdoptFor(application.adoptFor)} />
            </div>
          </SectionCard>

          {/* Section B */}
          <SectionCard title="B - Điều kiện sinh sống">
            <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-y-3 gap-x-4">
              <Field label="Khu vực sinh sống" value={application.location || 'Chưa cập nhật'} />
              <Field label="Loại nhà ở" value={translateHousing(application.housing)} />
              <Field label="Trẻ em trong nhà" value={translateChildren(application.children)} />
              <Field label="Kế hoạch chuồng / xích" value={translateCage(application.cage)} />
            </div>
          </SectionCard>

          {/* Section C */}
          <SectionCard title="C - Kinh nghiệm nuôi thú cưng">
            <div className="flex flex-col gap-3">
              <Field label="Đã từng nuôi thú cưng" value={translatePetExperience(application.petExperience)} />
              <Field label="Lịch sử chăm sóc trước đây" value={translatePetHistory(application.prevPetHistory)} />
            </div>
          </SectionCard>

          {/* Section D */}
          <SectionCard title="D - Công việc & Cá nhân">
            <Field label="Tình trạng việc làm" value={translateEmploymentStatus(application.employmentStatus)} />
          </SectionCard>

          {/* Section E - Cam kết nhận nuôi */}
          <SectionCard title="E - Cam kết nhận nuôi">
            <div className="mb-2.5">
              <Field label="Lý do nhận nuôi" value={translateAdoptionReason(application.adoptionReason)} />
            </div>

            <div className="w-full h-px bg-gray-200 mb-3.5" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3.5 items-start">
              {COMMITMENTS_CONFIG.map((item) => {
                const rawVal = application.commitments?.[item.key] ?? (application.commitments as any)?.[item.label];
                return (
                  <CommitmentItem
                    key={item.key}
                    label={item.label}
                    isCommitted={isCommitmentAgreed(rawVal)}
                  />
                );
              })}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};