'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Phone,
  Mail,
  Download,
  ChevronDown,
  Send,
  Plus,
  FileText,
  ChevronRight,
  Mars,
  Venus,
} from 'lucide-react';
import { AdoptionApplication, ApplicationTag, ApplicationNote, ROLE_BADGE_STYLE } from '@/types/application';
import { applicationService } from '@/services/applicationService';
import { formatBreed, MaybeBilingual } from '@/utils/bilingualField';
import { SelectTagsModal } from './SelectTagsModal';
import { downloadApplicationPdf } from '@/utils/exportApplicationPdf';
import { STAFF_ROLE_LABEL } from '@/types/shelterTeam';
// Bảng màu đồng bộ chuẩn với ApplicationCard
const TAG_COLOR_PALETTE = [
  'bg-[#EEF3FF] text-[#5982E6]', // Xanh dương
  'bg-[#FFF4E6] text-[#FF922B]', // Cam
  'bg-[#EBFBEE] text-[#40C057]', // Xanh lá
  'bg-[#F3F0FF] text-[#7950F2]', // Tím
];

// Hàm chuẩn hóa mọi cấu trúc Tag từ Prisma / Backend về dạng { id, name }
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

interface ApplicationQuickViewModalProps {
  application: AdoptionApplication;
  onClose: () => void;
  onRefresh?: () => void;
  buttonLabel?: string;
  onActionClick?: () => void;
}

export const ApplicationQuickViewModal: React.FC<ApplicationQuickViewModalProps> = ({
  application,
  onClose,
  onRefresh,
  buttonLabel = 'Move to Pending Review',
  onActionClick,
}) => {
  const [isAppOpen, setIsAppOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  // Khởi tạo danh sách tags đã được chuẩn hóa an toàn
  const [tags, setTags] = useState<ApplicationTag[]>(() => normalizeTags(application.tags || []));
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const addTagBtnRef = useRef<HTMLButtonElement>(null);
  const [notes, setNotes] = useState<ApplicationNote[]>(application.notes || []);
  const [noteInput, setNoteInput] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  const isMale = application.pet?.gender !== 'FEMALE';
  const petName = application.pet?.name || 'Max';
  const applicantFullName = application.fullName || application.user?.name || 'Michael Rodriguez';
  const applicantFirstName = applicantFullName.split(' ')[0] || 'Michael';
  const petBreedFormatted = formatBreed(application.pet?.breed as MaybeBilingual) || 'G. Retriever';
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);

  const handleAddTagWithColor = async (tagData: { name: string; color: string }) => {
    const tagName = tagData.name.trim();
    if (!tagName) return;

    try {
      const res = await applicationService.addTag(application.id, { name: tagName, color: tagData.color });
      const createdTag = res.data?.tag || res?.tag || { id: Date.now().toString(), name: tagName, color: tagData.color };
      setTags((prev) => [...prev, createdTag]);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Lỗi thêm tag:', err);
    }
  };

  const handleRemoveTagByName = async (tagName: string) => {
    const target = tags.find((t) => t.name.toLowerCase() === tagName.toLowerCase());
    if (target) handleRemoveTag(target.id);
  };
  // CHỈ nạp lại khi mở một đơn khác (application.id đổi)
  useEffect(() => {
    setNotes(application.notes || []);
    setTags(normalizeTags(application.tags || []));
  }, [application.id]);

  // Thêm tag hiển thị ngay lập tức
  const handleAddTag = async () => {
    const tagName = newTagName.trim();
    if (!tagName) return;

    // 1. Tạo tag tạm thời với ID duy nhất
    const tempTag: ApplicationTag = {
      id: `temp-${Date.now()}`,
      name: tagName,
    };

    // 2. Cập nhật state tags NGAY LẬP TỨC (đã bọc safe check toLowerCase)
    setTags((prev) => {
      const currentList = normalizeTags(prev);
      const isExist = currentList.some(
        (t) => (t.name || '').toLowerCase() === tagName.toLowerCase()
      );
      if (isExist) return currentList;
      return [...currentList, tempTag];
    });

    setNewTagName('');
    setIsAddingTag(false);

    try {
      // 3. Gửi API lên server
      const response = await applicationService.addTag(application.id, { name: tagName });

      const resData = response?.data?.data || response?.data || response;
      const tagObj = resData?.tag || resData;
      const realTagId = tagObj?.id || resData?.tagId;

      // 4. Cập nhật lại ID thật từ database
      if (realTagId) {
        setTags((prev) =>
          normalizeTags(prev).map((t) =>
            t.id === tempTag.id
              ? { ...t, id: String(realTagId), name: tagObj?.name || tagName }
              : t
          )
        );
      }

      // 5. Báo component cha cập nhật Board
      onRefresh?.();
    } catch (error) {
      console.error('Lỗi khi thêm tag:', error);
      // Hoàn tác nếu lỗi API
      setTags((prev) => prev.filter((t) => t.id !== tempTag.id));
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    const prevTags = [...tags];
    setTags((prev) => prev.filter((t) => t.id !== tagId));

    try {
      await applicationService.removeTag(application.id, tagId);
      onRefresh?.();
    } catch (error) {
      console.error('Lỗi khi xóa tag:', error);
      setTags(prevTags);
    }
  };

  const handleAddNote = async () => {
    const content = noteInput.trim();
    if (!content || isSubmittingNote) return;

    const tempNote: ApplicationNote = {
      id: `temp-${Date.now()}`,
      authorId: 'current-user',
      authorName: 'Staff Member',
      authorAvatar:
        'https://images.unsplash.com/photo-1573865526739-10659fec78a5?q=80&w=100',
      content,
      type: 'CONCERN',
      createdAt: 'Vừa xong',
    };

    setNotes((prev) => [tempNote, ...prev]);
    setNoteInput('');
    setIsSubmittingNote(true);

    try {
      const response = await applicationService.addNote(application.id, content);
      const addedNote = unwrapNote(response);
      if (addedNote?.id) {
        setNotes((prev) =>
          prev.map((n) =>
            n.id === tempNote.id
              ? {
                ...n,
                id: addedNote.id,
                authorName: addedNote.author?.name || n.authorName,
                authorAvatar: addedNote.author?.avatarUrl || n.authorAvatar,
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

  return (
    <div
      className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-[420px] max-h-[90vh] rounded-[24px] shadow-2xl flex flex-col overflow-hidden relative animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors p-1 bg-transparent hover:bg-gray-50 rounded-full z-10"
        >
          <X size={18} strokeWidth={2} />
        </button>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {/* Header */}
          <div className="flex items-start gap-4 mb-5">
            <div className="relative w-[94px] h-[94px] rounded-full border-[2.5px] border-[#F3A571] p-[2px] shrink-0">
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
              <h2 className="text-[18px] font-bold text-gray-900 leading-tight mb-2 truncate">
                {applicantFullName}
              </h2>
              <div className="flex items-center gap-2 text-gray-500 mb-1.5">
                <Phone size={13} className="text-gray-400 shrink-0" strokeWidth={2} />
                <span className="text-[13px] text-gray-500 font-normal truncate">
                  {application.phone || '(555) 321-7651'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-500 mb-1.5">
                <Mail size={13} className="text-gray-400 shrink-0" strokeWidth={2} />
                <span className="text-[13px] text-gray-500 font-normal truncate">
                  {application.user?.email || application.zalo || 'mike.rodriguez@email.com'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <FileText size={13} className="text-gray-400 shrink-0" strokeWidth={1.8} />
                <span className="text-[13px] text-gray-500 font-normal">Is applying for</span>
              </div>
              <div className="flex items-center gap-2.5 mt-0.5">
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
                      <Mars size={13} strokeWidth={2.5} className="text-[#3DB2FF] shrink-0" />
                    ) : (
                      <Venus size={13} strokeWidth={2.5} className="text-[#FF6B93] shrink-0" />
                    )}
                  </div>
                  <span className="text-[11.5px] text-gray-400 mt-0.5 truncate leading-none">
                    2 years • {petBreedFormatted}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* PDF Box */}
          <div className="border border-gray-200 rounded-[16px] p-3.5 px-4 flex items-center justify-between bg-white hover:bg-gray-50/50 transition-colors mb-6 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-[10px] bg-[#FFF8F3] border border-[#FFE8D6] flex items-center justify-center shrink-0">
                <FileText size={18} className="text-[#F3A571]" strokeWidth={1.8} />
              </div>
              <span className="text-[13.5px] font-semibold text-gray-900 truncate">
                {applicantFirstName} - Don_nhan_nuoi.pdf
              </span>
            </div>
            <button
              type="button"
              onClick={() => downloadApplicationPdf(application)}
              title="Tải đơn nhận nuôi (PDF)"
              className="text-gray-400 hover:text-[#E89B5A] transition-colors p-1 cursor-pointer"
            >
              <Download size={17} strokeWidth={2} />
            </button>
          </div>

          {/* Tags */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="font-bold text-[15px] text-gray-900">Tags</h3>
              <div className="relative">
                <button
                  ref={addTagBtnRef}
                  type="button"
                  onClick={() => setIsTagModalOpen(!isTagModalOpen)}
                  className="text-[13px] font-semibold text-[#F3A571] hover:text-[#E89B5A] transition-colors cursor-pointer"
                >
                  + Add
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

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
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
                })}
              </div>
            )}
          </div>

          {/* Application Details */}
          <div className="mb-5">
            <div
              className="flex items-center justify-between cursor-pointer select-none py-1"
              onClick={() => setIsAppOpen(!isAppOpen)}
            >
              <h3 className="font-bold text-[15px] text-gray-900">Application Details</h3>
              <ChevronDown
                size={18}
                className={`text-gray-400 transition-transform duration-200 ${isAppOpen ? 'rotate-180' : ''
                  }`}
                strokeWidth={2}
              />
            </div>
          </div>

          {/* Internal Notes */}
          <div className="mb-6">
            <div
              className="flex items-center justify-between cursor-pointer select-none py-1"
              onClick={() => setIsNotesOpen(!isNotesOpen)}
            >
              <h3 className="font-bold text-[15px] text-gray-900">Internal Notes</h3>
              <ChevronDown
                size={18}
                className={`text-gray-400 transition-transform duration-200 ${isNotesOpen ? 'rotate-180' : ''
                  }`}
                strokeWidth={2}
              />
            </div>
            {isNotesOpen && (
              <div className="flex flex-col gap-3 mt-3 animate-in fade-in duration-200">
                {notes.map((note) => (
                  <div key={note.id} className="flex gap-2.5 items-start">
                    <img
                      src={
                        note.authorAvatar ||
                        'https://images.unsplash.com/photo-1573865526739-10659fec78a5?q=80&w=100'
                      }
                      className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5"
                      alt="Staff"
                    />
                    <div className="flex flex-col flex-1">
                      <div className="flex items-center justify-between">
                        {/* Nhóm Avatar Name và Badge lại với nhau bằng gap-2 */}
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[12px] text-gray-900">
                            {note.authorName || 'Staff Member'}
                          </span>
                          {/* Hiển thị Badge Role nếu có */}
                          {note.authorRole && (
                            <span className={`px-2.5 py-[2px] rounded-full text-[10px] font-semibold tracking-tight ${ROLE_BADGE_STYLE[note.authorRole]}`}>
                              {STAFF_ROLE_LABEL[note.authorRole]}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400">{note.createdAt}</span>
                      </div>
                      <p className="text-[12px] text-gray-600 mt-0.5">{note.content}</p>
                    </div>
                  </div>
                ))}
                <div className="relative w-full mt-1">
                  <input
                    type="text"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                    placeholder="Add internal note..."
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

          {/* Action Button */}
          <div className="mt-2">
            <button
              type="button"
              onClick={onActionClick || onClose}
              className="w-full bg-[#F3A571] hover:bg-[#E89B5A] active:scale-[0.99] transition-all text-white font-semibold text-[14.5px] py-3.5 px-6 rounded-[16px] shadow-sm flex items-center justify-center gap-1"
            >
              <span>{buttonLabel}</span>
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationQuickViewModal;