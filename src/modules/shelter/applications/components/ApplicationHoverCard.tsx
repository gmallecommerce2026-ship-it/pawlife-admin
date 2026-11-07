'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { AdoptionApplication } from '@/types/application';
import { getPetCode } from './PetIdBadge';

const W = 300;
const GAP = 8;

const fmt = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(d);
};

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex gap-2 py-1 text-[12px]">
    <span className="w-[84px] shrink-0 text-gray-400">{label}</span>
    <span className="min-w-0 flex-1 font-medium text-gray-800 break-words">{children}</span>
  </div>
);

export const isHoverInfoStatus = (status: string) =>
  status === 'CLOSED' || status === 'APPROVED' || status === 'ADOPTION_COMPLETED';

export const ApplicationHoverCard: React.FC<{ application: AdoptionApplication; rect: DOMRect }> = ({
  application,
  rect,
}) => {
  const isClosed = application.status === 'CLOSED';
  const fitsRight = rect.right + GAP + W <= window.innerWidth - 8;
  const left = fitsRight ? rect.right + GAP : Math.max(8, rect.left - GAP - W);
  const top = Math.max(8, Math.min(rect.top, window.innerHeight - 300));

  const appt = application.appointment;
  const staff = (Array.isArray(appt?.members) ? (appt!.members as any[]) : [])
    .map((m) => m?.name ?? m?.email)
    .filter(Boolean)
    .join(', ');
  const petCode = getPetCode(application.pet);

  return createPortal(
    <div
      style={{ position: 'fixed', top, left, width: W, zIndex: 99999 }}
      className="pointer-events-none rounded-[14px] border border-gray-100 bg-white p-3.5 shadow-xl animate-in fade-in duration-150"
    >
      {isClosed ? (
        <>
          <div className="mb-2 flex items-center gap-1.5 text-[12px] font-bold text-[#DC2626]">
            <AlertTriangle size={14} strokeWidth={2} />
            Lý do từ chối
          </div>
          <p className="whitespace-pre-wrap break-words rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-[12.5px] leading-relaxed text-gray-800">
            {application.reviewNote?.trim() || 'Chưa ghi lý do'}
          </p>
          {fmt(application.updatedAt) && (
            <p className="mt-2 text-[11px] text-gray-400">Cập nhật lúc {fmt(application.updatedAt)}</p>
          )}
        </>
      ) : (
        <>
          <div className="mb-1.5 flex items-center gap-1.5 text-[12px] font-bold text-[#236745]">
            <CheckCircle2 size={14} strokeWidth={2} />
            {application.status === 'ADOPTION_COMPLETED' ? 'Đã bàn giao' : 'Thông tin nhận nuôi'}
          </div>
          <div className="divide-y divide-gray-100">
            <Row label="Người nhận nuôi">{application.fullName || application.user?.name || '-'}</Row>
            <Row label="Số điện thoại">{application.phone || '-'}</Row>
            {application.location && <Row label="Khu vực">{application.location}</Row>}
            <Row label="Bé nhận nuôi">
              {application.pet?.name || '-'}
              {petCode && <span className="ml-1 font-mono text-[11px] text-[#B45F1A]">({petCode})</span>}
            </Row>
            {appt?.appointmentDate && (
              <Row label="Phỏng vấn">
                {fmt(appt.appointmentDate)} · {appt.type === 'ONLINE' ? 'Online' : 'Trực tiếp'}
              </Row>
            )}
            {staff && <Row label="Nhân sự">{staff}</Row>}
            {fmt(application.updatedAt) && <Row label="Cập nhật">{fmt(application.updatedAt)}</Row>}
          </div>
        </>
      )}
    </div>,
    document.body,
  );
};