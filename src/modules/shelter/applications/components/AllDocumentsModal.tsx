'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X, FileText, Download, Eye, CheckCircle2, Clock, XCircle,
  Building2, Stethoscope, User, Users, Loader2, Inbox
} from 'lucide-react';
import { AdoptionApplication, ApplicationDocument, DocumentCategory } from '@/types/application';
import { applicationService } from '@/services/applicationService';

interface AllDocumentsModalProps {
  application: AdoptionApplication;
  onClose: () => void;
}

const CATEGORY_META: Record<DocumentCategory, { title: string; color: string; icon: React.ReactNode }> = {
  SHELTER: {
    title: 'SHELTER DOCUMENTS',
    color: 'text-[#E85C2F]',
    icon: <Building2 size={16} strokeWidth={2.5} />,
  },
  VETERINARY: {
    title: 'VETERINARY DOCUMENTS',
    color: 'text-[#3B6BE3]',
    icon: <Stethoscope size={16} strokeWidth={2.5} />,
  },
  APPLICANT: {
    title: 'APPLICANT DOCUMENTS',
    color: 'text-[#1B8A44]',
    icon: <User size={16} strokeWidth={2.5} />,
  },
  STAFF: {
    title: 'STAFF / INTERNAL DOCUMENTS',
    color: 'text-[#8A38D4]',
    icon: <Users size={16} strokeWidth={2.5} />,
  },
};

const STATUS_META: Record<ApplicationDocument['status'], { label: string; className: string; icon: React.ReactNode }> = {
  ACCEPTED: {
    label: 'Received',
    className: 'bg-green-50 border-green-200 text-green-700',
    icon: <CheckCircle2 size={14} className="text-green-600" strokeWidth={2.5} />,
  },
  PENDING_REVIEW: {
    label: 'Pending review',
    className: 'bg-amber-50 border-amber-200 text-amber-700',
    icon: <Clock size={14} className="text-amber-600" strokeWidth={2.5} />,
  },
  PENDING_SUBMISSION: {
    label: 'Not submitted',
    className: 'bg-gray-50 border-gray-200 text-gray-500',
    icon: <Clock size={14} className="text-gray-400" strokeWidth={2.5} />,
  },
  REJECTED: {
    label: 'Rejected',
    className: 'bg-red-50 border-red-200 text-red-700',
    icon: <XCircle size={14} className="text-red-600" strokeWidth={2.5} />,
  },
};

const formatMeta = (doc: ApplicationDocument) => {
  const parts: string[] = [];
  if (doc.fileName) {
    const ext = doc.fileName.split('.').pop()?.toUpperCase();
    if (ext) parts.push(ext);
  }
  if (doc.fileSizeLabel) parts.push(doc.fileSizeLabel);
  const dateSrc = doc.submittedAt || doc.requestedAt;
  if (dateSrc) {
    parts.push(new Date(dateSrc).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  }
  return parts.length ? parts.join(' • ') : 'Awaiting submission';
};

export const AllDocumentsModal: React.FC<AllDocumentsModalProps> = ({ application, onClose }) => {
  const [mounted, setMounted] = useState(false);
  const [documents, setDocuments] = useState<ApplicationDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    applicationService
      .getDocuments(application.id)
      .then((data) => {
        if (!cancelled) setDocuments(data);
      })
      .catch((err) => {
        console.error('Failed to load documents:', err);
        if (!cancelled) setError('Không thể tải danh sách tài liệu. Vui lòng thử lại.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [application.id]);

  const groupedCategories = useMemo(() => {
    const order: DocumentCategory[] = ['SHELTER', 'VETERINARY', 'APPLICANT', 'STAFF'];
    return order
      .map((cat) => ({
        id: cat,
        ...CATEGORY_META[cat],
        docs: documents.filter((d) => d.category === cat),
      }))
      .filter((group) => group.docs.length > 0);
  }, [documents]);

  const handleDownload = (doc: ApplicationDocument) => {
    if (!doc.fileUrl) return;
    const a = document.createElement('a');
    a.href = doc.fileUrl;
    a.download = doc.fileName || doc.label;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();
  };

  if (!mounted) return null;

  return createPortal(
    <div className="m-overlay fixed inset-0 z-[99999] bg-[#00000040] flex justify-center items-center backdrop-blur-[2px] transition-opacity">
      <div
        className="m-sheet bg-white rounded-[16px] w-[540px] max-w-[95vw] h-[85vh] max-h-[750px] shadow-2xl flex flex-col relative animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-1.5 rounded-full transition-colors z-10"
        >
          <X size={20} strokeWidth={2} />
        </button>

        <div className="px-5 sm:px-7 pt-9 sm:pt-7 pb-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-['Be_Vietnam_Pro',_sans-serif] text-[24px] font-bold text-gray-900 leading-tight">
            All Documents
          </h2>
          <p className="font-['Be_Vietnam_Pro',_sans-serif] text-[15px] text-gray-500 mt-1">
            Application for{' '}
            <span className="text-gray-900 font-bold">{application.pet?.name}</span> by{' '}
            <span className="text-gray-900 font-bold">
              {application.fullName || application.user?.name}
            </span>
          </p>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-7 py-5 sm:py-6 flex flex-col gap-6 sm:gap-8 bg-[#FAFAFA] rounded-b-[16px]">
          {isLoading && (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-gray-400 py-20">
              <Loader2 size={28} className="animate-spin" />
              <span className="text-[13px]">Đang tải tài liệu...</span>
            </div>
          )}

          {!isLoading && error && (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-red-500 py-20">
              <span className="text-[13px]">{error}</span>
            </div>
          )}

          {!isLoading && !error && groupedCategories.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-gray-400 py-20">
              <Inbox size={32} strokeWidth={1.5} />
              <span className="text-[13px]">Chưa có tài liệu nào được yêu cầu.</span>
            </div>
          )}

          {!isLoading &&
            !error &&
            groupedCategories.map((category) => (
              <div key={category.id} className="flex flex-col w-full">
                <div className={`flex items-center gap-2 mb-3 ${category.color}`}>
                  {category.icon}
                  <span className="font-['Be_Vietnam_Pro',_sans-serif] text-[12px] font-bold tracking-widest uppercase">
                    {category.title}{' '}
                    <span className="text-gray-400 font-medium">({category.docs.length})</span>
                  </span>
                </div>

                <div className="bg-white border border-gray-200 rounded-[12px] shadow-sm flex flex-col overflow-hidden">
                  {category.docs.map((doc, index) => {
                    const statusMeta = STATUS_META[doc.status];
                    return (
                      <div
                        key={doc.id}
                        className={`flex items-center justify-between p-4 hover:bg-[#FDFDFD] transition-colors ${
                          index !== category.docs.length - 1 ? 'border-b border-gray-100' : ''
                        }`}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                            <FileText size={20} className="text-gray-400" strokeWidth={1.5} />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-['Be_Vietnam_Pro',_sans-serif] text-[15px] font-semibold text-gray-900 truncate">
                              {doc.label}
                            </span>
                            <span className="font-['Be_Vietnam_Pro',_sans-serif] text-[13px] text-gray-500">
                              {formatMeta(doc)}
                            </span>
                            {doc.status === 'REJECTED' && doc.rejectionReason && (
                              <span className="text-[12px] text-red-500 mt-0.5">
                                {doc.rejectionReason}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 sm:pl-4">
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 border rounded-full ${statusMeta.className}`}>
                            {statusMeta.icon}
                            <span className="font-['Be_Vietnam_Pro',_sans-serif] text-[12px] font-bold">
                              {statusMeta.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 ml-2">
                            <button
                              onClick={() => doc.fileUrl && window.open(doc.fileUrl, '_blank')}
                              disabled={!doc.fileUrl}
                              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              title="View"
                            >
                              <Eye size={18} strokeWidth={2} />
                            </button>
                            <button
                              onClick={() => handleDownload(doc)}
                              disabled={!doc.fileUrl}
                              className="p-2 text-gray-400 hover:text-[#3B6BE3] hover:bg-blue-50 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Download"
                            >
                              <Download size={18} strokeWidth={2} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>,
    document.body
  );
};