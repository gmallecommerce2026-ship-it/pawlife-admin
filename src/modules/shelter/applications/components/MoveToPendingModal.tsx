// src/modules/shelter/applications/components/MoveToPendingModal.tsx

'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  Phone,
  Mail,
  Download,
  ChevronDown,
  Send,
  Check,
  Mars,
  Venus,
  FileText,
  ChevronRight,
} from 'lucide-react';
import {
  AdoptionApplication,
  ApplicationTag,
  ApplicationNote,
  COMMITMENTS_CONFIG,
} from '@/types/application';
import { applicationService } from '@/services/applicationService';
import { formatBreed, MaybeBilingual } from '@/utils/bilingualField';
import { SelectTagsModal } from './SelectTagsModal';
import { formatPetAge } from '@/utils/petAge';
import { NoteItem, resolveNoteRole, unwrapNote } from './NoteItem';
import { ApplicantFlagBanner } from './ApplicantFlag';
import {
  RelatedApplicationsNotice, RelatedApplicationsWarnIcon,
  PetCardActions, OtherPetsDropdown,
  getPetIdLabel,
  PetIdInline,
} from './RelatedApplications';
import ApplicationDetailBody from './ApplicationDetailBody';

// ============================================================================
// 1. CÁC HÀM TIỆN ÍCH DỊCH THUẬT SANG TIẾNG VIỆT
// ============================================================================
const ADOPTER_QUESTION_PREFIX = /^\s*câu hỏi từ người nhận nuôi\s*:?\s*/i;

export const isAdopterQuestionNote = (note: ApplicationNote): boolean =>
  (note as any)?.type === 'ADOPTER_QUESTION' ||
  ADOPTER_QUESTION_PREFIX.test(note?.content || '');

export const getAdopterQuestionText = (note?: ApplicationNote): string =>
  (note?.content || '').replace(ADOPTER_QUESTION_PREFIX, '').trim();

export const isCommitmentAgreed = (val: unknown): boolean => {
  if (val === true || val === 1) return true;
  if (typeof val === 'string') {
    const clean = val.trim().toLowerCase();
    return ['có', 'co', 'yes', 'true', 'đồng ý', 'dong y', '1'].includes(clean);
  }
  return false;
};

const normalizeTags = (rawTags: any[]): ApplicationTag[] => {
  if (!Array.isArray(rawTags)) return [];
  return rawTags
    .map((item: any) => {
      if (!item) return null;
      if (typeof item === 'string') return { id: item, name: item };
      if (item.tag && typeof item.tag === 'object') {
        return {
          id: item.tag.id || item.tagId || item.id || String(Date.now()),
          name: item.tag.name || item.name || '',
          color: item.tag.color || item.color,
        };
      }
      return {
        id: item.id || item.tagId || String(Date.now()),
        name: item.name || '',
        color: item.color,
      };
    })
    .filter((t): t is ApplicationTag => Boolean(t && t.name && t.name.trim() !== ''));
};

// ============================================================================
// 2. SUB-COMPONENTS
// ============================================================================

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
interface MoveToPendingModalProps {
  application: AdoptionApplication;
  onClose: () => void;
  onSubmit: (data: any) => void;
  onRefresh?: () => void;
  onReplacePet?: (application: AdoptionApplication) => void;
}

export const MoveToPendingModal: React.FC<MoveToPendingModalProps> = ({
  application,
  onClose,
  onSubmit,
  onRefresh,
  onReplacePet,
}) => {
  const [isAppOpen, setIsAppOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [tags, setTags] = useState<ApplicationTag[]>(() => normalizeTags(application.tags || []));
  const addTagBtnRef = useRef<HTMLButtonElement>(null);
  const [notes, setNotes] = useState<ApplicationNote[]>(application.notes || []);
  const adopterQuestionNote = useMemo(
    () => notes.find(isAdopterQuestionNote),
    [notes]
  );
  const adopterQuestion = getAdopterQuestionText(adopterQuestionNote);
  const staffNotes = useMemo(
    () => notes.filter((n) => !isAdopterQuestionNote(n)),
    [notes]
  );
  const [noteInput, setNoteInput] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isOtherPetsOpen, setIsOtherPetsOpen] = useState(false);
  const isMale = application.pet?.gender !== 'FEMALE';

  // Chỉ đơn mới nộp (SUBMITTED) mới được bấm "Chuyển sang đang xem xét".
  // PENDING / APPROVED / ADOPTION_COMPLETED / CLOSED chỉ xem + ghi chú + gắn thẻ.
  const canMoveToPending = application.status === 'SUBMITTED';
  const statusHint =
    application.status === 'PENDING'
      ? 'Đơn đang ở trạng thái đang xem xét'
      : application.status === 'CLOSED'
        ? 'Hồ sơ đã được đóng'
        : 'Đơn đã được duyệt'; // APPROVED / ADOPTION_COMPLETED

  const petName = application.pet?.name || 'Bé';
  const applicantFullName = application.fullName || application.user?.name || 'Người đăng ký';
  const applicantFirstName = applicantFullName.split(' ')[0] || 'Người đăng ký';
  const petBreedFormatted = formatBreed(application.pet?.breed as MaybeBilingual) || 'Giống lai';
  const petAgeFormatted = formatPetAge(application.pet?.dob);



  const [isTagModalOpen, setIsTagModalOpen] = useState(false);

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
      const response = await applicationService.addTag(application.id, { name: tagName, color: tagData.color });
      const resData = response?.data?.data || response?.data || response;
      const tagObj = resData?.tag || resData;
      const realTagId = tagObj?.id || resData?.tagId;

      if (realTagId) {
        setTags((prev) =>
          prev.map((t) => (t.id === tempTag.id ? { ...t, id: String(realTagId), color: tagObj?.color || tagData.color } : t))
        );
      }
      onRefresh?.();
    } catch (error) {
      setTags((prev) => prev.filter((t) => t.id !== tempTag.id));
    }
  };

  const handleRemoveTagByName = async (tagName: string) => {
    const target = tags.find((t) => t.name.toLowerCase() === tagName.toLowerCase());
    if (target) handleRemoveTag(target.id);
  };

  useEffect(() => {
    setNotes(application.notes || []);
    setTags(normalizeTags(application.tags || []));
  }, [application.id]);

  const handleRemoveTag = async (tagId: string) => {
    const prevTags = [...tags];
    setTags((prev) => prev.filter((t) => t.id !== tagId));
    try {
      await applicationService.removeTag(application.id, tagId);
      onRefresh?.();
    } catch (error) {
      console.error('Lỗi khi xóa thẻ:', error);
      setTags(prevTags);
    }
  };

  const handleAddNote = async () => {
    const content = noteInput.trim();
    if (!content || isSubmittingNote) return;

    const tempNote: ApplicationNote = {
      id: `temp-${Date.now()}`,
      authorId: 'current-user',
      authorName: 'Nhân viên trạm',
      authorAvatar: "",
      authorRole: null,
      content,
      type: 'FOLLOW_UP',
      createdAt: new Date().toISOString(),
    };

    setNotes((prev) => [tempNote, ...prev]);
    setNoteInput('');
    setIsSubmittingNote(true);

    try {
      const response = await applicationService.addNote(application.id, content, "FOLLOW_UP");
      const addedNote = unwrapNote(response);
      if (addedNote?.id) {
        setNotes((prev) =>
          prev.map((n: any) =>
            n.id === tempNote.id
              ? {
                ...n,
                id: addedNote.id,
                authorId: addedNote.authorId ?? n.authorId,
                authorName: addedNote.authorName || addedNote.author?.name || n.authorName,
                authorAvatar: addedNote.authorAvatar || addedNote.author?.avatarUrl || n.authorAvatar,
                authorRole: resolveNoteRole(addedNote) ?? n.authorRole ?? null,
                createdAt: addedNote.createdAt ?? n.createdAt,
              }
              : n
          )
        );
      }
      onRefresh?.();
    } catch (error) {
      console.error('Lỗi khi thêm ghi chú:', error);
      setNotes((prev) => prev.filter((n) => n.id !== tempNote.id));
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleSubmit = () => {
    if (!canMoveToPending) return;
    onSubmit({
      reviewNote: noteInput || 'Đã chuyển sang Đang xem xét',
      tags,
      notes,
    });
  };

  return (
    <div
      className="m-overlay fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="m-sheet bg-white w-full max-w-[440px] max-h-[90vh] rounded-[24px] shadow-2xl flex flex-col overflow-hidden relative animate-in fade-in zoom-in-95 duration-200 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors p-1 bg-transparent hover:bg-gray-50 rounded-full z-10 cursor-pointer"
        >
          <X size={18} strokeWidth={2} />
        </button>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-5 pt-8 pb-6 sm:p-6">
          {/* Header */}
          <div className="flex items-start gap-3 sm:gap-4 mb-5">
            <div className="relative w-[68px] h-[68px] sm:w-[94px] sm:h-[94px] rounded-full border-[2.5px] border-[#F3A571] p-[2px] shrink-0">
              <img
                src={
                  application.user?.avatarUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200'
                }
                className="w-full h-full rounded-full object-cover"
                alt={applicantFullName}
              />
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-start">
              <div className="flex items-center gap-1.5 mb-2 min-w-0">
                <h2 className="text-[18px] font-bold text-gray-900 leading-tight truncate">
                  {applicantFullName}
                </h2>
                <RelatedApplicationsWarnIcon application={application} size={16} />
              </div>
              <div className="flex items-center gap-2 text-gray-500 mb-1.5">
                <Phone size={13} className="text-gray-400 shrink-0" strokeWidth={2} />
                <span className="text-[13px] text-gray-500 font-normal truncate">
                  {application.phone || 'Chưa cập nhật'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-500 mb-1.5">
                <Mail size={13} className="text-gray-400 shrink-0" strokeWidth={2} />
                <span className="text-[13px] text-gray-500 font-normal truncate">
                  {application.user?.email || application.zalo || 'Chưa cập nhật'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <FileText size={13} className="text-gray-400 shrink-0" strokeWidth={1.8} />
                <span className="text-[13px] text-gray-500 font-normal">Đang xin nhận nuôi</span>
              </div>
              <div className="flex items-center gap-2.5 mt-0.5 w-full">
                <img
                  src={
                    application.pet?.avatarUrl ||
                    application.pet?.images?.[0]?.url ||
                    'https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=100'
                  }
                  className="w-10 h-10 rounded-[10px] object-cover shrink-0 border border-gray-100"
                  alt={petName}
                />
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[14px] text-gray-900 leading-none">
                      {petName}
                    </span>
                    {isMale ? (
                      <Mars size={13} strokeWidth={2.5} className="text-[#3DB2FF]" />
                    ) : (
                      <Venus size={13} strokeWidth={2.5} className="text-[#FF6B93]" />
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
            </div>
          </div>
          <ApplicantFlagBanner flag={application.applicantFlag} />

          {/* Tags */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="font-bold text-[15px] text-gray-900">Gắn thẻ</h3>
              <div className="relative">
                <button
                  ref={addTagBtnRef}
                  type="button"
                  onClick={() => setIsTagModalOpen((v) => !v)}
                  className="text-[13px] font-semibold text-[#E89B5A] hover:text-[#D68B4E] transition-colors cursor-pointer"
                >
                  + Thêm
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
                tags.map((tag) => {
                  const tagColor = tag.color || '#5982E6';
                  return (
                    <span
                      key={tag.id}
                      className="px-3 py-1 text-[11.5px] font-semibold rounded-full flex items-center gap-1.5 border transition-all"
                      style={{
                        backgroundColor: `${tagColor}15`,
                        borderColor: `${tagColor}40`,
                        color: tagColor,
                      }}
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

          {/* Accordion Chi tiết đơn nhận nuôi */}
          <div className="mb-5">
            <div
              className="flex items-center justify-between cursor-pointer select-none py-1"
              onClick={() => setIsAppOpen(!isAppOpen)}
            >
              <h3 className="font-bold text-[15px] text-gray-900">Chi tiết đơn nhận nuôi</h3>
              <ChevronDown
                size={18}
                className={`text-gray-400 transition-transform duration-200 ${isAppOpen ? 'rotate-180' : ''}`}
                strokeWidth={2}
              />
            </div>
            {isAppOpen && (
              <ApplicationDetailBody
                application={application}
                adopterQuestion={adopterQuestion}
              />
            )}
          </div>

          {/* Ghi chú */}
          <div className="mb-6">
            <div
              className="flex items-center justify-between cursor-pointer select-none py-1"
              onClick={() => setIsNotesOpen(!isNotesOpen)}
            >
              <h3 className="font-bold text-[15px] text-gray-900">Ghi chú</h3>
              <ChevronDown
                size={18}
                className={`text-gray-400 transition-transform duration-200 ${isNotesOpen ? 'rotate-180' : ''}`}
                strokeWidth={2}
              />
            </div>
            {isNotesOpen && (
              <div className="flex flex-col gap-3 mt-3 animate-in fade-in duration-200">
                {staffNotes.map((note) => (
                  <NoteItem key={note.id} note={note} />
                ))}
                <div className="relative w-full mt-1">
                  <input
                    type="text"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                    placeholder="Thêm ghi chú... (gõ Enter để gửi)"
                    className="w-full bg-[#F6F6F6] rounded-[12px] pl-3.5 pr-9 py-2.5 text-[12.5px] outline-none placeholder-gray-400 border border-transparent focus:border-[#F3A571]"
                  />
                  <button
                    type="button"
                    onClick={handleAddNote}
                    disabled={isSubmittingNote}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#F3A571] hover:text-[#E89B5A] disabled:opacity-50"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {canMoveToPending ? (
            <div className="mt-2 sticky bottom-0 -mx-5 px-5 pt-3 pb-2 bg-white/85 backdrop-blur-xl sm:static sm:m-0 sm:p-0 sm:bg-transparent sm:backdrop-blur-none">
              <button
                type="button"
                onClick={handleSubmit}
                className="w-full bg-[#F3A571] hover:bg-[#E89B5A] active:scale-[0.99] transition-all text-white font-semibold text-[14.5px] py-3.5 px-6 rounded-[16px] shadow-sm flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Chuyển sang đang xem xét</span>
                <ChevronRight size={16} strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            <p className="mt-2 text-center text-[12.5px] text-gray-400 italic">
              {statusHint}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MoveToPendingModal;