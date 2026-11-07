'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';
import { AdoptionApplication } from '@/types/application';
import { applicationService } from '@/services/applicationService';
import {
  APPLICANT_FLAG_REASONS,
  getApplicantFlagLabel,
  type ApplicantFlag,
} from '@/constants/applicantFlag';

export const ApplicantFlagBanner: React.FC<{ flag?: ApplicantFlag | null }> = ({ flag }) => {
  if (!flag) return null;
  return (
    <div className="mb-4 flex items-start gap-2.5 rounded-[12px] border border-[#FECACA] bg-[#FEF2F2] px-3.5 py-2.5">
      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[#DC2626]" strokeWidth={2} />
      <div className="min-w-0">
        <p className="text-[12.5px] font-bold text-[#B91C1C]">
          Người này từng bị đánh dấu: {getApplicantFlagLabel(flag.reason)}
        </p>
        {flag.note && (
          <p className="mt-0.5 break-words text-[12px] text-[#B91C1C]/80">{flag.note}</p>
        )}
      </div>
    </div>
  );
};

interface ApplicantFlagModalProps {
  application: AdoptionApplication;
  onClose: () => void;
  onDone: () => void;
}

export const ApplicantFlagModal: React.FC<ApplicantFlagModalProps> = ({
  application,
  onClose,
  onDone,
}) => {
  const existing = application.applicantFlag;
  const [reason, setReason] = useState<string>(existing?.reason ?? APPLICANT_FLAG_REASONS[0].value);
  const [note, setNote] = useState(existing?.note ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const name = application.fullName || application.user?.name || 'người này';

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError('');
    try {
      await fn();
      onDone();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không thể thực hiện. Vui lòng thử lại.');
      setBusy(false);
    }
  };

  // Portal + stopPropagation: tránh click/pointer lọt xuống thẻ Kanban (mở modal / kích hoạt kéo thả)
  return createPortal(
    <div
      className="m-overlay fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => { e.stopPropagation(); onClose(); }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div
        className="m-sheet w-full max-w-[420px] rounded-[18px] bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-1 text-[16px] font-bold text-gray-900">Đánh dấu hành vi không tốt</h3>
        <p className="mb-3 text-[13px] leading-relaxed text-gray-600">
          Cờ này gắn với <strong className="text-gray-900">{name}</strong>. Khi người này nộp đơn
          mới, nhân viên trạm sẽ thấy cảnh báo. Người đăng ký không nhìn thấy cờ này.
        </p>

        <div className="mb-3 flex flex-col gap-1.5">
          {APPLICANT_FLAG_REASONS.map((r) => (
            <label key={r.value} className="flex cursor-pointer items-center gap-2 text-[12.5px] text-gray-700">
              <input
                type="radio"
                name="applicant-flag-reason"
                checked={reason === r.value}
                onChange={() => setReason(r.value)}
              />
              {r.label}
            </label>
          ))}
        </div>

        <textarea
          rows={3}
          maxLength={500}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={reason === 'OTHER' ? 'Nhập ghi chú (bắt buộc)...' : 'Ghi chú thêm (không bắt buộc)...'}
          className="w-full rounded-[8px] border border-gray-200 p-2 text-[12.5px] outline-none focus:border-red-400"
        />
        {error && <p className="mt-2 text-[12px] text-red-600">{error}</p>}

        <div className="mt-4 flex items-center justify-between gap-2">
          {existing ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => applicationService.unflagApplicant(application.id))}
              className="rounded-md px-3 py-1.5 text-[12px] font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-60"
            >
              Gỡ đánh dấu
            </button>
          ) : <span />}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-md bg-gray-100 px-3.5 py-1.5 text-[12px] font-semibold text-gray-700 hover:bg-gray-200"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={busy || (reason === 'OTHER' && !note.trim())}
              onClick={() =>
                run(() => applicationService.flagApplicant(application.id, { reason, note: note.trim() || undefined }))
              }
              className="rounded-md bg-red-600 px-4 py-1.5 text-[12px] font-bold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {busy ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};