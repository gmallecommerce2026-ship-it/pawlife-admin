'use client';

import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { AdoptionApplication } from '@/types/application';

// Đổi chuỗi xác nhận ở đây nếu muốn
export const DELETE_CONFIRM_TEXT = 'XOA';

interface Props {
  application: AdoptionApplication;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const DeleteApplicationModal: React.FC<Props> = ({ application, onClose, onConfirm }) => {
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matched = text.trim().toUpperCase() === DELETE_CONFIRM_TEXT;

  const handleConfirm = async () => {
    if (!matched || isDeleting) return;
    try {
      setIsDeleting(true);
      setError(null);
      await onConfirm();
    } catch (e: any) {
      setError(e?.message ?? 'Không thể xoá đơn. Vui lòng thử lại.');
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="m-overlay fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={() => !isDeleting && onClose()}
    >
      <div
        className="m-sheet bg-white w-full max-w-[420px] rounded-[18px] shadow-2xl p-5 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={18} className="text-red-600" />
          <h3 className="text-[16px] font-bold text-gray-900">Xoá vĩnh viễn đơn nhận nuôi?</h3>
        </div>

        <p className="text-[13px] text-gray-600 mb-3 leading-relaxed">
          Đơn của{' '}
          <strong className="text-gray-900">{application.fullName || application.user?.name}</strong>{' '}
          cho bé <strong className="text-gray-900">{application.pet?.name}</strong> sẽ bị xoá cùng toàn bộ
          ghi chú, nhãn, tài liệu và lịch phỏng vấn.{' '}
          <strong className="text-red-600">Hành động này không thể hoàn tác.</strong>
        </p>

        <label className="text-[12px] text-gray-600 mb-1.5 block">
          Nhập <strong className="text-gray-900 font-mono">{DELETE_CONFIRM_TEXT}</strong> để xác nhận:
        </label>
        <input
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm(); }}
          disabled={isDeleting}
          placeholder={DELETE_CONFIRM_TEXT}
          className="w-full border border-gray-200 rounded-[8px] px-2.5 py-2 text-[13px] font-mono outline-none focus:border-red-400"
        />

        {error && <p className="mt-2 text-[12px] text-red-600">{error}</p>}

        <div className="flex items-center justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[12px] font-semibold rounded-md disabled:opacity-60"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!matched || isDeleting}
            className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[12px] font-bold rounded-md disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Đang xoá...' : 'Xoá vĩnh viễn'}
          </button>
        </div>
      </div>
    </div>
  );
};