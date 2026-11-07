'use client';

import React, { useState } from 'react';
import { X, Check, X as RejectIcon } from 'lucide-react';
import { RequiredDocument } from '@/constants/adoptionDocuments';

const formatShortDate = (iso?: string | null) => {
  if (!iso) return '01/01/2025';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '01/01/2025';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const isPdfFile = (url?: string | null, name?: string | null) => {
  if (!url && !name) return false;
  const str = `${url || ''} ${name || ''}`.toLowerCase();
  return str.includes('.pdf') || str.includes('application/pdf');
};

export interface DocumentReviewData extends RequiredDocument {
  submittedAt?: string | null;
  fileSizeLabel?: string;
  fileUrl?: string | null;
  fileName?: string | null;
  reviewStatus?: 'accepted' | 'rejected';
  rejectionReason?: string;
}

interface DocumentReviewModalProps {
  document: DocumentReviewData;
  onClose: () => void;
  onAccept: () => void;
  onReject: (reason: string) => void;
  /** true = tài liệu đã được duyệt rồi (accepted/rejected), chỉ cho xem lại */
  readOnly?: boolean;
}

export const DocumentReviewModal: React.FC<DocumentReviewModalProps> = ({
  document,
  onClose,
  onAccept,
  onReject,
  readOnly = false,
}) => {
  const [rejectionReason, setRejectionReason] = useState('');

  const handleReject = () => {
    onReject(rejectionReason.trim());
  };

  const hasFile = Boolean(document.fileUrl && document.fileUrl.trim().length > 0);
  const isPdf = hasFile && isPdfFile(document.fileUrl, document.fileName);

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[110] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[24px] shadow-2xl w-full max-w-[440px] p-6 sm:p-7 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200 relative font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-[18px] sm:text-[19px] font-bold text-gray-900 leading-snug truncate">
              Tài liệu yêu cầu: {document.label}
            </h2>
            <p className="text-[13px] text-gray-400 mt-0.5 font-normal">
              Đã gửi vào ngày {formatShortDate(document.submittedAt)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors shrink-0 -mt-1 -mr-1 p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Khung hiển thị ảnh / PDF / Placeholder xám */}
        {hasFile ? (
          <div className="relative w-full h-[230px] sm:h-[250px] rounded-[16px] overflow-hidden bg-[#F3F4F6] border border-gray-100 flex items-center justify-center">
            {isPdf ? (
              /* Hiển thị PDF trực tiếp xem được toàn bộ trang */
              <iframe
                src={`${document.fileUrl}#toolbar=0`}
                className="w-full h-full border-0 rounded-[16px]"
                title={document.label}
              />
            ) : (
              /* Hiển thị ảnh (PNG, JPG, JPEG, WEBP...) rõ nét ngay trên modal */
              <img
                src={document.fileUrl!}
                alt={document.label}
                className="w-full h-full object-contain rounded-[14px]"
              />
            )}
          </div>
        ) : (
          /* Khi không có tài liệu đính kèm -> Khung chữ nhật xám trơn chuẩn 100% theo ảnh */
          <div className="w-full h-[220px] bg-[#D9D9D9] rounded-[16px]" />
        )}

        {/* Form nhập lý do & nút Từ chối / Chấp nhận */}
        {readOnly ? (
          <div className="flex flex-col gap-3 pt-1">
            {document.reviewStatus === 'accepted' && (
              <div className="flex items-center gap-2 bg-[#E7F8ED] text-[#16A34A] text-[13px] font-semibold px-4 py-3 rounded-[12px]">
                <Check size={16} /> Tài liệu đã được chấp nhận
              </div>
            )}
            {document.reviewStatus === 'rejected' && (
              <div className="flex flex-col gap-1 bg-red-50 text-red-600 text-[13px] font-semibold px-4 py-3 rounded-[12px]">
                <span className="flex items-center gap-2">
                  <RejectIcon size={16} /> Tài liệu đã bị từ chối
                </span>
                {document.rejectionReason && (
                  <span className="text-[12px] font-normal text-red-500 mt-0.5">
                    Lý do: {document.rejectionReason}
                  </span>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-full h-[46px] rounded-[12px] border border-gray-200 bg-white text-gray-700 font-semibold text-[14px] hover:bg-gray-50 transition-colors"
            >
              Đóng
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-[14px] font-bold text-gray-900 mb-2 block">
                Lý do từ chối tài liệu
              </label>
              <input
                type="text"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="vd: hình quá mờ, tài liệu đã hết hạn,..."
                className="w-full border border-gray-200 rounded-[12px] px-4 py-3 text-[13px] text-gray-800 outline-none focus:border-[#E89B5A] transition-colors placeholder:text-gray-400"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleReject}
                className="flex-1 h-[46px] rounded-[12px] border border-gray-200 bg-white text-gray-600 font-medium text-[14px] hover:bg-gray-50 transition-colors flex items-center justify-center cursor-pointer"
              >
                Từ chối
              </button>
              <button
                type="button"
                onClick={onAccept}
                className="flex-1 h-[46px] rounded-[12px] bg-[#E89B5A] hover:bg-[#D68B4E] text-white font-medium text-[14px] shadow-sm transition-colors flex items-center justify-center cursor-pointer"
              >
                Chấp nhận
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};