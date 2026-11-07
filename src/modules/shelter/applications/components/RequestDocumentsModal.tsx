'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { X, Pencil, Check, Loader2, Lock, Radio } from 'lucide-react';
import { AdoptionApplication } from '@/types/application';
import { DOCUMENT_TYPE_OPTIONS, RequiredDocument } from '@/constants/adoptionDocuments';
import { applicationService } from '@/services/applicationService';
import { useWebsocket } from '@/hooks/useWebsocket';

export type RequestedDocument = RequiredDocument & {
  id: string;
  status: 'PENDING_SUBMISSION' | 'PENDING_REVIEW' | 'ACCEPTED' | 'REJECTED';
  rejectionReason?: string | null;
  category?: 'SHELTER' | 'VETERINARY' | 'APPLICANT' | 'STAFF';
};

interface RequestDocumentsModalProps {
  application: AdoptionApplication;
  onClose: () => void;
  onNext: (documents: RequestedDocument[]) => void;
  userToken?: string;
}

export const RequestDocumentsModal: React.FC<RequestDocumentsModalProps> = ({
  application,
  onClose,
  onNext,
  userToken,
}) => {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [descriptions, setDescriptions] = useState<Record<string, string>>(() =>
    Object.fromEntries(DOCUMENT_TYPE_OPTIONS.map((o) => [o.key, o.description]))
  );

  const [existingDocs, setExistingDocs] = useState<RequestedDocument[]>([]);
  const [isLoadingExisting, setIsLoadingExisting] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const socket = useWebsocket(userToken, (application as any).pet?.shelterId);

  // Map tra nhanh document theo key
  const existingDocsByKey = useMemo(() => {
    const map: Record<string, RequestedDocument> = {};
    existingDocs.forEach((d) => {
      map[d.key] = d;
    });
    return map;
  }, [existingDocs]);

  // Load danh sách từ Server
  const loadDocuments = useCallback(async () => {
    try {
      setIsLoadingExisting(true);
      const docs: RequestedDocument[] = await applicationService.getDocuments(application.id);
      setExistingDocs(docs);
      setSelectedKeys(docs.map((d) => d.key));
      setDescriptions((prev) => {
        const next = { ...prev };
        docs.forEach((d) => {
          if (d.description) next[d.key] = d.description;
        });
        return next;
      });
    } catch (error) {
      console.error('Lỗi khi tải danh sách tài liệu:', error);
    } finally {
      setIsLoadingExisting(false);
    }
  }, [application.id]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // 📡 REALTIME: Lắng nghe các thay đổi từ Mobile App (khi adopter nộp bài)
  useEffect(() => {
    if (!socket) return;

    const handleDocumentUpdate = (payload: { applicationId: string }) => {
      if (payload.applicationId === application.id) {
        loadDocuments();
      }
    };

    socket.on('document_submitted', handleDocumentUpdate);
    socket.on('documents_requested', handleDocumentUpdate);
    socket.on('document_reviewed', handleDocumentUpdate);
    socket.on('document_removed', handleDocumentUpdate);

    return () => {
      socket.off('document_submitted', handleDocumentUpdate);
      socket.off('documents_requested', handleDocumentUpdate);
      socket.off('document_reviewed', handleDocumentUpdate);
      socket.off('document_removed', handleDocumentUpdate);
    };
  }, [socket, application.id, loadDocuments]);

  // Đã nộp/duyệt -> Khoá không cho gỡ bỏ tick
  const isLocked = (key: string) => {
    const existing = existingDocsByKey[key];
    return !!existing && existing.status !== 'PENDING_SUBMISSION';
  };

  const toggleSelect = (key: string) => {
    if (isLocked(key)) return;

    setSelectedKeys((prev) => {
      const isSelected = prev.includes(key);
      if (isSelected) {
        if (editingKey === key) setEditingKey(null);
        return prev.filter((k) => k !== key);
      }
      if (key === 'other') setEditingKey('other');
      return [...prev, key];
    });
  };

  const toggleEdit = (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    if (existingDocsByKey[key]) return;
    setEditingKey((prev) => (prev === key ? null : key));
  };

  const updateDescription = (key: string, value: string) => {
    setDescriptions((prev) => ({ ...prev, [key]: value }));
  };

  const handleNext = async () => {
    if (selectedKeys.length === 0 || isSubmitting || isLoadingExisting) return;

    const itemsToCreate = DOCUMENT_TYPE_OPTIONS.filter(
      (o) => selectedKeys.includes(o.key) && !existingDocsByKey[o.key]
    ).map((o) => ({
      key: o.key,
      label: o.label,
      description: descriptions[o.key],
      category: (o as any).category || 'APPLICANT',
    }));

    const itemsToRemove = existingDocs.filter(
      (d) => d.status === 'PENDING_SUBMISSION' && !selectedKeys.includes(d.key)
    );

    const remainingExisting = existingDocs.filter((d) => selectedKeys.includes(d.key));

    if (itemsToCreate.length === 0 && itemsToRemove.length === 0) {
      onNext(remainingExisting);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      let created: RequestedDocument[] = [];
      if (itemsToCreate.length > 0) {
        created = await applicationService.requestDocuments(application.id, itemsToCreate);
      }
      if (itemsToRemove.length > 0) {
        await Promise.all(
          itemsToRemove.map((d) => applicationService.removeDocument(application.id, d.id))
        );
      }
      onNext([...remainingExisting, ...created]);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Không thể cập nhật yêu cầu tài liệu. Vui lòng thử lại.';
      setErrorMessage(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const STATUS_LABEL: Record<string, string> = {
    PENDING_SUBMISSION: 'Chờ nộp',
    PENDING_REVIEW: 'Chờ duyệt — không thể gỡ',
    ACCEPTED: 'Đã chấp nhận — không thể gỡ',
    REJECTED: 'Đã từ chối — không thể gỡ',
  };

  return (
    <div
      className="m-overlay fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="m-sheet bg-white rounded-[28px] shadow-2xl w-full max-w-[480px] max-h-[90vh] overflow-y-auto p-6 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[20px] font-bold text-[#0D062D]">Tài liệu yêu cầu</h2>
              <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
              </span>
            </div>
            <p className="text-[13px] text-gray-500 mt-1">Chọn các loại tài liệu cần bổ sung từ người đăng ký</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors shrink-0 mt-1"
          >
            <X size={20} />
          </button>
        </div>

        {errorMessage && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-[12.5px] rounded-xl px-3.5 py-2.5">
            {errorMessage}
          </div>
        )}

        {isLoadingExisting ? (
          <div className="flex items-center justify-center gap-2 py-10 text-gray-400 text-[13px]">
            <Loader2 size={16} className="animate-spin" /> Đang tải danh sách đã yêu cầu...
          </div>
        ) : (
          <div className="border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100">
            {DOCUMENT_TYPE_OPTIONS.map((option) => {
              const isSelected = selectedKeys.includes(option.key);
              const existing = existingDocsByKey[option.key];
              const locked = isLocked(option.key);

              if (!isSelected) {
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => toggleSelect(option.key)}
                    className="w-full text-left px-4 py-3.5 text-[14px] font-medium text-black hover:bg-gray-50 transition-colors"
                  >
                    {option.label}
                  </button>
                );
              }

              return (
                <div key={option.key} className="p-4 flex flex-col gap-2 bg-white">
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => toggleSelect(option.key)}
                      disabled={locked}
                      className={`flex items-center gap-2 text-left ${locked ? 'cursor-not-allowed' : ''}`}
                    >
                      <span className="w-4 h-4 rounded-full bg-[#E89B5A] flex items-center justify-center shrink-0">
                        {locked ? (
                          <Lock size={9} className="text-white" strokeWidth={3} />
                        ) : (
                          <Check size={10} className="text-white" strokeWidth={3} />
                        )}
                      </span>
                      <span className="text-[14px] font-semibold text-[#E89B5A]">{option.label}</span>
                    </button>

                    <div className="flex items-center gap-2 shrink-0">
                      {existing && (
                        <span className="text-[10px] font-medium text-gray-400">
                          {STATUS_LABEL[existing.status]}
                        </span>
                      )}
                      {!existing && (
                        <button
                          type="button"
                          onClick={(e) => toggleEdit(e, option.key)}
                          title="Chỉnh sửa nội dung yêu cầu"
                          className="text-gray-400 hover:text-[#E89B5A] transition-colors p-1 -m-1"
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {editingKey === option.key && !existing ? (
                    <textarea
                      autoFocus
                      rows={3}
                      value={descriptions[option.key]}
                      onChange={(e) => updateDescription(option.key, e.target.value)}
                      onBlur={() => setEditingKey(null)}
                      placeholder="Nhập nội dung yêu cầu bổ sung..."
                      className="w-full bg-[#F9FAFB] border border-gray-200 rounded-xl px-3 py-2 text-[12.5px] text-gray-600 leading-relaxed outline-none resize-none focus:border-[#E89B5A]"
                    />
                  ) : (
                    <p className="text-[12.5px] text-gray-500 leading-relaxed pl-6">{descriptions[option.key]}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 h-[46px] rounded-xl border border-gray-200 bg-white text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={selectedKeys.length === 0 || isSubmitting || isLoadingExisting}
            className="flex-1 h-[46px] rounded-xl bg-[#E89B5A] hover:bg-[#D68B4E] disabled:opacity-50 text-white font-bold text-sm shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {isSubmitting ? 'Đang cập nhật...' : 'Gửi yêu cầu'}
          </button>
        </div>
      </div>
    </div>
  );
};