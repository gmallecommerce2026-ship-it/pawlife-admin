'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Phone,
  Mail,
  Download,
  ChevronUp,
  ChevronDown,
  Send,
  Mars,
  Venus,
  CheckCircle2,
} from 'lucide-react';
import { AdoptionApplication, ApplicationTag, ApplicationNote, COMMITMENTS_CONFIG } from '@/types/application';
import { CommitmentItem, isCommitmentAgreed } from './MoveToPendingModal';
import { applicationService } from '@/services/applicationService';
import { DOCUMENT_TYPE_OPTIONS, RequiredDocument } from '@/constants/adoptionDocuments';
import { DocumentReviewModal } from './DocumentReviewModal';
import { RequestedDocument } from './RequestDocumentsModal';
import { SelectTagsModal } from './SelectTagsModal';
import { useSocket } from '@/contexts/SocketContext';
import { NoteItem, resolveNoteRole, unwrapNote } from './NoteItem';
import { downloadApplicationPdf } from '@/utils/exportApplicationPdf';
import { Socket } from 'socket.io-client';
import { formatBreed, MaybeBilingual } from '@/utils/bilingualField';
import { formatPetAge } from '@/utils/petAge';
import {
  RelatedApplicationsNotice, RelatedApplicationsWarnIcon,
  PetIdRow, PetCardActions, OtherPetsDropdown,
  getPetIdLabel,
  PetIdInline,
} from './RelatedApplications';
import ApplicationDetailBody from './ApplicationDetailBody';
// ============================================================================
// HÀM DỊCH THUẬT — copy nguyên từ MoveToPendingModal để đồng bộ hiển thị
// ============================================================================

type RequiredDocRow = RequiredDocument & {
  id?: string;
  requested: boolean;
  submitted: boolean;
  reviewStatus?: 'accepted' | 'rejected';
  rejectionReason?: string;
  fileUrl?: string | null;
  fileName?: string | null;
  submittedAt?: string | null;
  fileSizeLabel?: string;
};

const mapBackendDoc = (doc: RequestedDocument): RequiredDocRow => ({
  key: doc.key,
  label: doc.label,
  description: doc.description,
  id: doc.id,
  requested: true,
  submitted: doc.status !== 'PENDING_SUBMISSION',
  reviewStatus: doc.status === 'ACCEPTED' ? 'accepted' : doc.status === 'REJECTED' ? 'rejected' : undefined,
  rejectionReason: doc.rejectionReason || undefined,
  fileUrl: (doc as any).fileUrl || null,
  fileName: (doc as any).fileName || null,
  submittedAt: (doc as any).submittedAt || null,
  fileSizeLabel: (doc as any).fileSizeLabel || undefined,
});

interface NeedMoreInfoModalProps {
  application: AdoptionApplication;
  initialDocuments?: RequestedDocument[];
  socket?: Socket | null;
  onClose: () => void;
  onMoveToInterview: () => void;
  onRefresh?: () => void;
  onReplacePet?: (application: AdoptionApplication) => void;
}

export const NeedMoreInfoModal: React.FC<NeedMoreInfoModalProps> = ({
  application,
  initialDocuments,
  socket,
  onClose,
  onMoveToInterview,
  onRefresh,
  onReplacePet
}) => {
  const [isAppDetailsOpen, setIsAppDetailsOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(true);
  const [isNotesOpen, setIsNotesOpen] = useState(true);
  const [isOtherPetsOpen, setIsOtherPetsOpen] = useState(false);
  const addTagBtnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket || !application?.id) return;

    const refetchDocs = () => {
      applicationService
        .getDocuments(application.id)
        .then((docs: RequestedDocument[]) =>
          setRequiredDocs((Array.isArray(docs) ? docs : []).map(mapBackendDoc)),
        )
        .catch((err) => console.error('Lỗi đồng bộ realtime tài liệu:', err));
    };

    const handleEvent = (payload?: any) => {
      if (!payload?.applicationId || payload.applicationId === application.id) {
        refetchDocs();
      }
    };

    const events = [
      'documents_requested',
      'document_submitted',
      'document_reviewed',
      'document_removed',
    ];

    events.forEach((e) => socket.on(e, handleEvent));
    return () => {
      events.forEach((e) => socket.off(e, handleEvent));
    };
  }, [socket, application?.id]);

  const [tags, setTags] = useState<ApplicationTag[]>(
    application.tags ? application.tags.map((t: any) => t.tag || t) : []
  );
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);

  const [notes, setNotes] = useState<ApplicationNote[]>(application.notes || []);
  const [noteInput, setNoteInput] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  const [requiredDocs, setRequiredDocs] = useState<RequiredDocRow[]>(
    () => (initialDocuments ?? []).map(mapBackendDoc)
  );
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  const [docsErrorMessage, setDocsErrorMessage] = useState<string | null>(null);
  const [isAddDocPickerOpen, setIsAddDocPickerOpen] = useState(false);
  const [reviewingDocKey, setReviewingDocKey] = useState<string | null>(null);
  const isMale = application.pet?.gender !== 'FEMALE';
  const petBreedFormatted = formatBreed(application.pet?.breed as MaybeBilingual) || 'Giống lai';
  const petAgeFormatted = formatPetAge(application.pet?.dob);
  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAddDocPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const extractErrorMessage = (error: any, fallback: string) => {
    const message = error?.response?.data?.message || error?.message || fallback;
    return Array.isArray(message) ? message.join(', ') : message;
  };

  const handleAcceptDocument = async (key: string) => {
    const doc = requiredDocs.find((d) => d.key === key);
    if (!doc?.id) return;
    setDocsErrorMessage(null);
    try {
      const updated: RequestedDocument = await applicationService.reviewDocument(
        application.id,
        doc.id,
        { status: 'ACCEPTED' },
      );
      setRequiredDocs((prev) => prev.map((d) => (d.key === key ? mapBackendDoc(updated) : d)));
    } catch (error: any) {
      console.error('Lỗi khi chấp nhận tài liệu:', error);
      setDocsErrorMessage(extractErrorMessage(error, 'Không thể chấp nhận tài liệu.'));
    } finally {
      setReviewingDocKey(null);
    }
  };

  const handleRejectDocument = async (key: string, reason: string) => {
    const doc = requiredDocs.find((d) => d.key === key);
    if (!doc?.id) return;
    setDocsErrorMessage(null);

    try {
      const updated: RequestedDocument = await applicationService.reviewDocument(
        application.id,
        doc.id,
        { status: 'REJECTED', reason: reason || undefined },
      );
      setRequiredDocs((prev) => prev.map((d) => (d.key === key ? mapBackendDoc(updated) : d)));
    } catch (error: any) {
      console.error('Lỗi khi từ chối tài liệu:', error);
      setDocsErrorMessage(extractErrorMessage(error, 'Không thể từ chối tài liệu.'));
      setReviewingDocKey(null);
      return;
    } finally {
      setReviewingDocKey(null);
    }

    if (reason.trim()) {
      try {
        const response = await applicationService.addNote(
          application.id,
          `Từ chối tài liệu "${doc.label}": ${reason.trim()}`,
          'CONCERN',
        );
        const addedNote = unwrapNote(response);

        const rejectNote: ApplicationNote = {
          id: addedNote?.id || Date.now().toString(),
          authorId: addedNote?.authorId || 'current-user',
          authorName: addedNote?.authorName || addedNote?.author?.name || 'Nhân viên trạm',
          authorAvatar: addedNote?.authorAvatar || addedNote?.author?.avatarUrl || null,
          authorRole: resolveNoteRole(addedNote) ?? null,
          type: addedNote?.type || 'CONCERN',
          content: addedNote?.content || `Từ chối tài liệu "${doc.label}": ${reason.trim()}`,
          createdAt: addedNote?.createdAt || new Date().toISOString(),
        };

        setNotes((prev) => [rejectNote, ...prev]);
        if (onRefresh) onRefresh();
      } catch (error) {
        console.error('Lỗi khi ghi lại lý do từ chối:', error);
      }
    }
  };

  const reviewingDoc = requiredDocs.find((d) => d.key === reviewingDocKey) ?? null;

  useEffect(() => {
    setNotes(application.notes || []);
    setTags(application.tags ? application.tags.map((t: any) => t.tag || t) : []);

    if (initialDocuments && initialDocuments.length > 0) {
      setRequiredDocs(initialDocuments.map(mapBackendDoc));
      return;
    }

    let cancelled = false;
    setIsLoadingDocs(true);
    applicationService
      .getDocuments(application.id)
      .then((docs: RequestedDocument[]) => {
        if (!cancelled) setRequiredDocs((Array.isArray(docs) ? docs : []).map(mapBackendDoc));
      })
      .catch((error) => {
        console.error('Lỗi khi tải danh sách tài liệu:', error);
        if (!cancelled) setRequiredDocs([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingDocs(false);
      });

    return () => {
      cancelled = true;
    };
  }, [application.id]);

  const availableDocOptions = DOCUMENT_TYPE_OPTIONS.filter(
    (opt) => !requiredDocs.some((d) => d.key === opt.key)
  );

  const handleAddDocument = (doc: RequiredDocument) => {
    setRequiredDocs((prev) => [...prev, { ...doc, requested: false, submitted: false }]);
    setIsAddDocPickerOpen(false);
  };

  const handleRequestDocument = async (key: string) => {
    const doc = requiredDocs.find((d) => d.key === key);
    if (!doc || doc.requested) return;
    setDocsErrorMessage(null);
    try {
      const created: RequestedDocument[] = await applicationService.requestDocuments(
        application.id,
        [{
          key: doc.key,
          label: doc.label,
          description: doc.description,
          category: (doc as any).category || 'APPLICANT', // 👈 bổ sung, khớp với RequestDocumentsModal
        }],
      );
      setRequiredDocs((prev) => prev.map((d) => (d.key === key ? mapBackendDoc(created[0]) : d)));
    } catch (error: any) {
      console.error('Lỗi khi gửi yêu cầu tài liệu:', error);
      setDocsErrorMessage(extractErrorMessage(error, 'Không thể gửi yêu cầu tài liệu.'));
      try {
        const docs: RequestedDocument[] = await applicationService.getDocuments(application.id);
        setRequiredDocs((Array.isArray(docs) ? docs : []).map(mapBackendDoc));
      } catch { }
    }
  };

  const handleRemoveDocument = async (key: string) => {
    const doc = requiredDocs.find((d) => d.key === key);
    if (!doc) return;
    setDocsErrorMessage(null);

    if (doc.id) {
      try {
        await applicationService.removeDocument(application.id, doc.id);
      } catch (error: any) {
        console.error('Lỗi khi gỡ tài liệu:', error);
        setDocsErrorMessage(extractErrorMessage(error, 'Không thể gỡ tài liệu.'));
        return;
      }
    }

    setRequiredDocs((prev) => prev.filter((d) => d.key !== key));
  };

  const handleAddTagWithColor = async (tagData: { name: string; color: string }) => {
    const tagName = tagData.name.trim();
    if (!tagName) return;

    const tempTag: ApplicationTag = {
      id: `temp-${Date.now()}`,
      name: tagName,
      color: tagData.color,
    };

    setTags((prev) => {
      const isExist = prev.some((t) => t.name.toLowerCase() === tagName.toLowerCase());
      if (isExist) return prev;
      return [...prev, tempTag];
    });

    try {
      const added = await applicationService.addTag(application.id, {
        name: tagName,
        color: tagData.color,
      });
      const newTag = added?.tag ?? added;
      if (newTag?.id) {
        setTags((prev) =>
          prev.map((t) => (t.id === tempTag.id ? { ...t, id: String(newTag.id), color: newTag.color || tagData.color } : t))
        );
      }
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Lỗi khi thêm thẻ:', error);
      setTags((prev) => prev.filter((t) => t.id !== tempTag.id));
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    const prev = [...tags];
    setTags((t) => t.filter((item) => item.id !== tagId));
    try {
      await applicationService.removeTag(application.id, tagId);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Lỗi khi xóa thẻ:', error);
      setTags(prev);
    }
  };

  const handleRemoveTagByName = async (tagName: string) => {
    const targetTag = tags.find((t) => t.name.toLowerCase() === tagName.toLowerCase());
    if (targetTag) {
      await handleRemoveTag(targetTag.id);
    }
  };

  const handleAddNote = async () => {
    if (!noteInput.trim() || isSubmittingNote) return;
    setIsSubmittingNote(true);
    try {
      const response = await applicationService.addNote(
        application.id,
        noteInput.trim(),
        'FOLLOW_UP',
      );
      const addedNote = unwrapNote(response);

      const newNoteObj: ApplicationNote = {
        id: addedNote?.id || Date.now().toString(),
        authorId: addedNote?.authorId || 'current-user',
        authorName: addedNote?.authorName || addedNote?.author?.name || 'Nhân viên trạm',
        authorAvatar: addedNote?.authorAvatar || addedNote?.author?.avatarUrl || null,
        authorRole: resolveNoteRole(addedNote) ?? null,
        content: addedNote?.content || noteInput.trim(),
        type: addedNote?.type || 'FOLLOW_UP',
        createdAt: addedNote?.createdAt || new Date().toISOString(),
      };

      setNotes((prev) => [newNoteObj, ...prev]);
      setNoteInput('');
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Lỗi khi thêm ghi chú:', error);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // const handleSubmit = () => {
  //   const requestedLabels = requiredDocs.filter((d) => d.requested).map((d) => d.label);
  //   const reviewNote =
  //     requestedLabels.length > 0
  //       ? `Cần bổ sung tài liệu: ${requestedLabels.join(', ')}${noteInput ? '. ' + noteInput : ''}`
  //       : noteInput || 'Đã duyệt yêu cầu tài liệu';

  //   // Bổ sung thuộc tính action để báo cho Kanban Board biết cần move đi đâu
  //   onSubmit({
  //     reviewNote,
  //     tags,
  //     notes,
  //     requiredDocuments: requiredDocs,
  //     action: allAccepted ? 'MOVE_TO_INTERVIEW' : 'UPDATE_INFO' // <--- THÊM DÒNG NÀY
  //   });
  // };

  const allAccepted =
    requiredDocs.length > 0 &&
    requiredDocs.every((doc) => doc.requested && doc.submitted && doc.reviewStatus === 'accepted');

  return (
    <div
      className="m-overlay fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="m-sheet bg-white w-full max-w-[460px] max-h-[92vh] rounded-[24px] shadow-2xl flex flex-col overflow-hidden relative animate-in fade-in zoom-in-95 duration-200 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút đóng modal */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors p-1 z-10"
        >
          <X size={18} strokeWidth={2} />
        </button>

        <div className="flex-1 overflow-y-auto px-5 pt-9 pb-6 sm:p-6 scrollbar-thin scrollbar-thumb-gray-200">
          {/* 1. Header & Thông tin người đăng ký */}
          <div className="flex gap-4 mb-5 items-start">
            <img
              src={
                application.user?.avatarUrl ||
                'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=140'
              }
              className="w-[68px] h-[68px] sm:w-[92px] sm:h-[92px] rounded-full object-cover shrink-0 border border-gray-100"
              alt={application.fullName || application.user?.name || 'Applicant'}
            />
            <div className="flex flex-col flex-1 pt-0.5">
              <div className="flex items-center gap-1.5 mb-2 min-w-0">
                <h2 className="text-[17px] font-bold text-gray-900 leading-tight truncate">
                  {application.fullName || application.user?.name || 'Người đăng ký'}
                </h2>
                <RelatedApplicationsWarnIcon application={application} size={16} />
              </div>
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Phone size={13} className="text-gray-400 shrink-0" />
                <span className="text-[12.5px]">{application.phone || '09876543210'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <Mail size={13} className="text-gray-400 shrink-0" />
                <span className="text-[12.5px] truncate max-w-[200px]">
                  {application.zalo || application.user?.email || 'adopter@pawlife.vn'}
                </span>
              </div>

            </div>
          </div>

          {/* Thẻ thông tin thú cưng */}
          <div className="border border-gray-200/80 rounded-[14px] p-2.5 flex items-center gap-3 bg-white mb-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <img
              src={
                application.pet?.avatarUrl ||
                application.pet?.images?.[0]?.url ||
                'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=120'
              }
              className="w-11 h-11 rounded-[10px] object-cover"
              alt={application.pet?.name || 'Pet'}
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="font-bold text-[14px] text-gray-900">
                  {application.pet?.name || 'Bé'}
                </span>
                {isMale ? (
                  <Mars size={14} strokeWidth={2.5} className="text-[#3DB2FF]" />
                ) : (
                  <Venus size={14} strokeWidth={2.5} className="text-[#FF6B93]" />
                )}
              </div>
              <PetIdInline
                pet={application.pet}
                fallback={`${petAgeFormatted} • ${petBreedFormatted}`}
                className="text-[11.5px] text-gray-400 mt-0.5 leading-snug"
              />
            </div>
            <PetCardActions
              application={application}
              open={isOtherPetsOpen}
              onToggle={() => setIsOtherPetsOpen((v) => !v)}
              onReplacePet={onReplacePet}
            />
          </div>
          <OtherPetsDropdown application={application} open={isOtherPetsOpen} />

          {/* 2. Gắn thẻ (Tags) */}
          <div className="mb-5">
            <div className="flex justify-between items-center mb-2.5">
              <h3 className="font-bold text-[14px] text-gray-900">Gắn thẻ</h3>

              <div className="relative">
                <button
                  ref={addTagBtnRef}
                  type="button"
                  onClick={() => setIsTagModalOpen((v) => !v)}
                  className="text-gray-400 hover:text-gray-600 text-[13px] font-medium flex items-center gap-1 cursor-pointer select-none transition-colors"
                >
                  + tag
                </button>

                {isTagModalOpen && (
                  <SelectTagsModal
                    triggerRef={addTagBtnRef}
                    existingTags={tags}
                    onClose={() => setIsTagModalOpen(false)}
                    onAddTag={handleAddTagWithColor}
                    onRemoveTag={handleRemoveTagByName}
                  />
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {tags.length === 0 ? (
                <span className="text-[12px] text-gray-400 italic">Chưa có thẻ nào</span>
              ) : (
                tags
                  .filter((tag) => tag && tag.id && tag.name)
                  .map((tag, idx) => {
                    const isFirst = idx === 0;
                    return (
                      <span
                        key={tag.id}
                        className={`px-3 py-1 text-[12px] font-medium rounded-full flex items-center gap-1.5 transition-all ${isFirst
                          ? 'bg-[#EBF2FF] text-[#4F75E2]'
                          : 'bg-[#F4F5F7] text-gray-600'
                          }`}
                      >
                        {tag.name}
                        <X
                          size={12}
                          onClick={() => handleRemoveTag(tag.id)}
                          className="cursor-pointer hover:opacity-70 transition-opacity"
                        />
                      </span>
                    );
                  })
              )}
            </div>
          </div>

          {/* 3. Accordion: Đơn nhận nuôi */}
          {/* 3. Accordion: Đơn nhận nuôi */}
          <div className="border-t border-gray-100 py-3.5">
            <div
              className="flex justify-between items-center cursor-pointer select-none"
              onClick={() => setIsAppDetailsOpen(!isAppDetailsOpen)}
            >
              <h3 className="font-bold text-[14px] text-gray-900">Đơn nhận nuôi</h3>
              {isAppDetailsOpen ? (
                <ChevronUp size={18} className="text-gray-400" />
              ) : (
                <ChevronDown size={18} className="text-gray-400" />
              )}
            </div>

            {isAppDetailsOpen && <ApplicationDetailBody application={application} />}
          </div>

          {/* 4. Section: Bổ sung tài liệu */}
          <div className="border-t border-gray-100 pt-4 pb-2">
            <div
              className="flex justify-between items-center mb-3 cursor-pointer select-none"
              onClick={() => setIsDocsOpen(!isDocsOpen)}
            >
              <h3 className="font-bold text-[14px] text-gray-900">Bổ sung tài liệu</h3>
              {isDocsOpen ? (
                <ChevronUp size={18} className="text-gray-400" />
              ) : (
                <ChevronDown size={18} className="text-gray-400" />
              )}
            </div>

            {isDocsOpen && (
              <div className="flex flex-col">
                {docsErrorMessage && (
                  <div className="bg-red-50 border border-red-100 text-red-600 text-[12px] rounded-xl px-3.5 py-2.5 mb-3 flex items-start justify-between gap-2">
                    <span>{docsErrorMessage}</span>
                    <button
                      type="button"
                      onClick={() => setDocsErrorMessage(null)}
                      className="text-red-400 hover:text-red-600 shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* Dropdown "Chọn tài liệu cần bổ sung" ngay đầu phần Bổ sung tài liệu */}
                <div className="relative mb-4" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsAddDocPickerOpen((v) => !v)}
                    className="w-full flex items-center justify-between border border-gray-200 rounded-[12px] px-4 py-2.5 bg-white hover:border-gray-300 transition-colors text-left"
                  >
                    <span className="text-[13px] text-gray-400">Chọn tài liệu cần bổ sung</span>
                    <ChevronDown
                      size={18}
                      className={`text-gray-400 transition-transform duration-200 ${isAddDocPickerOpen ? 'rotate-180' : ''
                        }`}
                    />
                  </button>

                  {isAddDocPickerOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 z-30 border border-gray-100 rounded-[14px] bg-white shadow-xl max-h-[220px] overflow-y-auto divide-y divide-gray-50 animate-in fade-in zoom-in-95 duration-150">
                      {availableDocOptions.length === 0 ? (
                        <div className="px-4 py-3 text-[12px] text-gray-400 text-center italic">
                          Đã chọn hết tất cả các loại tài liệu
                        </div>
                      ) : (
                        availableDocOptions.map((opt) => (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => handleAddDocument(opt)}
                            className="w-full text-left px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors font-medium"
                          >
                            {opt.label}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {isLoadingDocs ? (
                  <p className="text-[12px] text-gray-400 italic py-2">Đang tải danh sách tài liệu...</p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {requiredDocs.map((doc) => {
                      // Xác định trạng thái
                      const isNotRequested = !doc.requested;
                      const isPendingSubmission = doc.requested && !doc.submitted;
                      const isSubmittedPendingReview = doc.requested && doc.submitted && !doc.reviewStatus;
                      const isAccepted = doc.requested && doc.submitted && doc.reviewStatus === 'accepted';
                      const isRejected = doc.requested && doc.submitted && doc.reviewStatus === 'rejected';

                      return (
                        <div key={doc.key} className="flex flex-col min-[420px]:flex-row min-[420px]:items-start justify-between gap-3 py-1">
                          {/* Bên trái: Tên + Badge + Mô tả */}
                          <div className="flex-1 min-w-0 pr-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-bold text-[13.5px] text-gray-900 leading-tight">
                                {doc.label}
                              </span>

                              {/* Badges đúng màu chuẩn theo thiết kế */}
                              {isNotRequested && (
                                <span className="bg-[#F1F3F5] text-[#6C727F] text-[11px] font-medium px-2 py-0.5 rounded-[6px]">
                                  Missing
                                </span>
                              )}
                              {isPendingSubmission && (
                                <span className="bg-[#FEF9E7] text-[#E5A124] text-[11px] font-medium px-2 py-0.5 rounded-[6px]">
                                  Đã yêu cầu
                                </span>
                              )}
                              {isSubmittedPendingReview && (
                                <span className="bg-[#E8F1FF] text-[#3B82F6] text-[11px] font-medium px-2 py-0.5 rounded-[6px]">
                                  Đã bổ sung
                                </span>
                              )}
                              {isAccepted && (
                                <span className="bg-[#E6F9EE] text-[#10B981] text-[11px] font-medium px-2 py-0.5 rounded-[6px]">
                                  Chấp nhận
                                </span>
                              )}
                              {isRejected && (
                                <span className="bg-[#FEE2E2] text-[#EF4444] text-[11px] font-medium px-2 py-0.5 rounded-[6px]">
                                  Từ chối
                                </span>
                              )}
                            </div>

                            <p className="text-[12px] text-gray-500 leading-relaxed">
                              {doc.description ||
                                'Nếu bạn đang thuê nhà, chúng mình cần sự đồng ý từ chủ nhà để đảm bảo rằng thú cưng được phép sống an toàn tại nơi ở của bạn.'}
                            </p>
                          </div>

                          {/* Bên phải: Nút hành động */}
                          <div className="shrink-0 flex flex-col min-[420px]:items-end min-w-[84px] [&>div]:flex-row [&>div]:w-full min-[420px]:[&>div]:flex-col min-[420px]:[&>div]:w-[84px]">
                            {/* Trạng thái 1: Missing (Chưa yêu cầu) */}
                            {isNotRequested && (
                              <div className="flex flex-col gap-1.5 w-[84px]">
                                <button
                                  type="button"
                                  onClick={() => handleRequestDocument(doc.key)}
                                  className="w-full bg-[#FFA877] hover:bg-[#F39562] transition-colors text-white font-semibold text-[13px] py-1.5 rounded-[10px] shadow-sm text-center"
                                >
                                  Yêu cầu
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDocument(doc.key)}
                                  className="w-full border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-gray-500 font-medium text-[13px] py-1.5 rounded-[10px] text-center"
                                >
                                  Hủy
                                </button>
                              </div>
                            )}

                            {/* Trạng thái 2: Đã yêu cầu (Chờ người nộp) */}
                            {isPendingSubmission && (
                              <button
                                type="button"
                                onClick={() => handleRemoveDocument(doc.key)}
                                className="w-[84px] border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-gray-500 font-medium text-[13px] py-1.5 rounded-[10px] text-center"
                              >
                                Hủy
                              </button>
                            )}

                            {/* Trạng thái 3: Đã bổ sung (Chờ duyệt) */}
                            {isSubmittedPendingReview && (
                              <button
                                type="button"
                                onClick={() => setReviewingDocKey(doc.key)}
                                className="bg-[#4D88E5] hover:bg-[#3E7AD7] transition-colors text-white font-semibold text-[13px] px-3.5 py-2 rounded-[10px] shadow-sm whitespace-nowrap text-center"
                              >
                                Xem tài liệu
                              </button>
                            )}

                            {/* Trạng thái 4: Chấp nhận (Đã duyệt thành công) */}
                            {isAccepted && (
                              <button
                                type="button"
                                onClick={() => setReviewingDocKey(doc.key)}
                                className="w-[84px] border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-gray-600 font-medium text-[13px] py-1.5 rounded-[10px] text-center"
                              >
                                Xem
                              </button>
                            )}

                            {/* Trạng thái 5: Bị từ chối */}
                            {isRejected && (
                              <button
                                type="button"
                                onClick={() => setReviewingDocKey(doc.key)}
                                className="w-[84px] border border-red-200 bg-red-50/50 hover:bg-red-50 transition-colors text-red-600 font-medium text-[13px] py-1.5 rounded-[10px] text-center"
                              >
                                Xem lại
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Thông báo xanh: Tất cả tài liệu đã được chấp nhận */}
                    {allAccepted && (
                      <div className="flex items-center gap-2 text-[#10B981] font-semibold text-[13px] pt-2">
                        <CheckCircle2 size={16} className="text-[#10B981]" />
                        <span>Tất cả tài liệu đã được chấp nhận</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 5. Section: Ghi chú nội bộ */}
          <div className="border-t border-gray-100 pt-4 pb-2">
            <div
              className="flex justify-between items-center mb-3.5 cursor-pointer select-none"
              onClick={() => setIsNotesOpen(!isNotesOpen)}
            >
              <h3 className="font-bold text-[14px] text-gray-900">Ghi chú nội bộ</h3>
              {isNotesOpen ? (
                <ChevronUp size={18} className="text-gray-400" />
              ) : (
                <ChevronDown size={18} className="text-gray-400" />
              )}
            </div>

            {isNotesOpen && (
              <div className="flex flex-col gap-3.5">
                {notes.map((note) => (
                  <NoteItem key={note.id} note={note} />
                ))}

                {/* Input thêm ghi chú */}
                <div className="relative w-full mt-1">
                  <div className="bg-[#F5F6F8] rounded-[16px] px-4 py-3 flex items-center gap-2 border border-transparent focus-within:border-gray-200 transition-colors">
                    <input
                      type="text"
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                      placeholder="Thêm ghi chú... (Nhập @ để tag thành viên khác)"
                      className="w-full bg-transparent text-[13px] outline-none placeholder-gray-400 text-gray-700 pr-7"
                    />
                    <button
                      onClick={handleAddNote}
                      disabled={isSubmittingNote || !noteInput.trim()}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#FFA877] hover:text-[#F39562] transition-colors disabled:opacity-40"
                    >
                      <Send size={15} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Nút hành động cố định ở chân Modal */}
        <div className="px-5 sm:px-6 py-3 sm:py-4 border-t border-gray-100 bg-white/90 backdrop-blur-xl shrink-0">
          <button
            type="button"
            onClick={onMoveToInterview}
            disabled={!allAccepted}
            className="w-full bg-[#E59754] hover:bg-[#D98844] active:bg-[#C97B38] transition-colors text-white font-bold text-[14px] py-3.5 rounded-[14px] shadow-sm cursor-pointer text-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Di chuyển tới hẹn phỏng vấn
          </button>
        </div>

        {/* Modal chi tiết duyệt tài liệu */}
        {reviewingDoc && (
          <DocumentReviewModal
            document={{
              ...reviewingDoc,
              submittedAt:
                reviewingDoc.submittedAt || application.updatedAt || application.createdAt,
            }}
            onClose={() => setReviewingDocKey(null)}
            onAccept={() => handleAcceptDocument(reviewingDoc.key)}
            onReject={(reason) => handleRejectDocument(reviewingDoc.key, reason)}
            readOnly={!!reviewingDoc.reviewStatus}
          />
        )}
      </div>
    </div>
  );
};