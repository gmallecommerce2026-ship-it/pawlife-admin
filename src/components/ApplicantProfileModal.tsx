'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Phone, Mail, ChevronDown, ChevronUp, Check, MessageSquare, Flag,
  Loader2, MoreVertical, Pencil, Trash2,
  Cake, QrCode, Home, Syringe, Stethoscope, User, HeartHandshake, Smile,
  PawPrint // Import thêm PawPrint để làm icon giống React Native
} from 'lucide-react';
import { AdoptionApplication, ROLE_BADGE_STYLE } from '@/types/application';
import { applicationService } from '@/services/applicationService';
import type { ApplicantProfileResponse, ApplicationNoteType } from '@/types/application';
import { STAFF_ROLE_LABEL } from '@/types/shelterTeam';

// IMPORT THÊM ĐỂ KIỂM TRA QUYỀN ADMIN
import { useShelterTeam, useShelterTeamActions } from '@/store/useShelterTeamStore';
import { getUserFromToken } from '@/utils/getUserFromToken';

interface ApplicantProfileModalProps {
  application: AdoptionApplication;
  onClose: () => void;
}

const NOTE_TYPE_OPTIONS: { value: ApplicationNoteType; label: string }[] = [
  { value: 'HOME_VISIT', label: 'Thăm nhà' },
  { value: 'VET_RECORDS', label: 'Hồ sơ thú y' },
  { value: 'FOLLOW_UP', label: 'Theo dõi sau' },
  { value: 'CONCERN', label: 'Lưu ý / Quan ngại' },
  { value: 'REJECTION', label: 'Từ chối' },
  { value: 'REFERENCE_CHECK', label: 'Kiểm tra người tham chiếu' },
  { value: 'BACKGROUND_CHECK', label: 'Xác minh lý lịch' },
];

const NOTE_TYPE_STYLE: Record<ApplicationNoteType, { label: string; color: string }> = {
  HOME_VISIT: { label: 'Home Visit', color: '#1B8A44' },
  VET_RECORDS: { label: 'Vet Records', color: '#3B6BE3' },
  FOLLOW_UP: { label: 'Follow-up', color: '#0EA5A5' },
  CONCERN: { label: 'Concern', color: '#D97706' },
  REJECTION: { label: 'Rejection', color: '#DC2626' },
  REFERENCE_CHECK: { label: 'Reference Check', color: '#7C3AED' },
  BACKGROUND_CHECK: { label: 'Background Check', color: '#8A38D4' },
};

const STATUS_BADGE: Record<string, { label: string; bg: string; border: string; text: string }> = {
  SUBMITTED: { label: 'Mới', bg: '#F3F4F6', border: '#E5E7EB', text: '#6B7280' },
  PENDING: { label: 'Đang xem xét', bg: '#EFF6FF', border: '#BFDBFE', text: '#3B82F6' },
  NEED_MORE_INFO: { label: 'Cần bổ sung', bg: '#FFF8F0', border: '#FFE1C2', text: '#E89B5A' },
  INTERVIEW_SCHEDULED: { label: 'Hẹn phỏng vấn', bg: '#F4E8FF', border: '#E9D5FF', text: '#8A38D4' },
  APPROVED: { label: 'Đã duyệt', bg: '#EFF6FF', border: '#BFDBFE', text: '#2563EB' },
  ADOPTION_COMPLETED: { label: 'Đã nhận nuôi', bg: '#F2FCF5', border: '#D1F2D9', text: '#1B8A44' },
  CLOSED: { label: 'Đóng', bg: '#F3F4F6', border: '#E5E7EB', text: '#6B7280' },
};

const HISTORY_TYPE_CONFIG: Record<string, { Icon: React.ElementType; bg: string; color: string }> = {
  BIRTH: { Icon: Cake, bg: '#FFF4EC', color: '#F2A465' },
  CREATED: { Icon: QrCode, bg: '#EAE7FB', color: '#885BF2' },
  QR_LINKED: { Icon: QrCode, bg: '#EAE7FB', color: '#885BF2' },
  TRANSFER: { Icon: Home, bg: '#EBFFE2', color: '#77C582' },
  VACCINE: { Icon: Syringe, bg: '#E3F0FF', color: '#5A90DA' },
  DENTAL_CARE: { Icon: Smile, bg: '#E8FFD8', color: '#5FA83D' },
  ANNUAL_CHECKUP: { Icon: Stethoscope, bg: '#E8FFD8', color: '#5FA83D' },
  CURRENT_OWNER: { Icon: User, bg: '#FFE9B8', color: '#CF7900' },
  PREVIOUS_OWNER: { Icon: User, bg: '#FFE9B8', color: '#CF7900' },
  UNDER_SHELTER_CARE: { Icon: HeartHandshake, bg: '#FFE4F0', color: '#D6447A' },
};

const DEFAULT_HISTORY_CONFIG = { Icon: Cake, bg: '#F5F5F5', color: '#8E8E93' };

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

export const ApplicantProfileModal: React.FC<ApplicantProfileModalProps> = ({ application, onClose }) => {
  const [profile, setProfile] = useState<ApplicantProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ----- Quyền Admin -----
  const { me } = useShelterTeam();
  const { fetchMe } = useShelterTeamActions();
  const [tokenUser, setTokenUser] = useState<any>(null);

  const [expandedPawHistoryId, setExpandedPawHistoryId] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState<ApplicationNoteType | ''>('');
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const typeDropdownRef = useRef<HTMLDivElement>(null);

  const [openMenuNoteId, setOpenMenuNoteId] = useState<string | null>(null);
  const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const noteMenuRef = useRef<HTMLDivElement>(null);
  const noteButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editType, setEditType] = useState<ApplicationNoteType | ''>('');
  const [isEditTypeOpen, setIsEditTypeOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const editTypeDropdownRef = useRef<HTMLDivElement>(null);

  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setTokenUser(getUserFromToken());
    fetchMe();
  }, []); // eslint-disable-next-line react-hooks/exhaustive-deps

  const isAdmin = me?.shelterRole === 'ADMIN' || tokenUser?.role === 'SHELTER' || tokenUser?.role === 'ADMIN';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target as Node)) {
        setIsTypeOpen(false);
      }
      if (editTypeDropdownRef.current && !editTypeDropdownRef.current.contains(e.target as Node)) {
        setIsEditTypeOpen(false);
      }
      const target = e.target as Node;
      const activeButton = openMenuNoteId ? noteButtonRefs.current[openMenuNoteId] : null;
      if (
        openMenuNoteId &&
        noteMenuRef.current && !noteMenuRef.current.contains(target) &&
        activeButton && !activeButton.contains(target)
      ) {
        setOpenMenuNoteId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuNoteId]);

  useEffect(() => {
    const handleScroll = () => { if (openMenuNoteId) setOpenMenuNoteId(null); };
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [openMenuNoteId]);

  const toggleNoteMenu = (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    if (openMenuNoteId !== noteId) {
      const btn = noteButtonRefs.current[noteId];
      if (btn) {
        const rect = btn.getBoundingClientRect();
        setMenuCoords({
          top: rect.bottom + 6,
          left: rect.right - 160,
        });
      }
      setOpenMenuNoteId(noteId);
    } else {
      setOpenMenuNoteId(null);
    }
  };

  const startEditNote = (note: ApplicantProfileResponse['notes'][number]) => {
    setEditingNoteId(note.id);
    setEditContent(note.content);
    setEditType(note.type);
    setOpenMenuNoteId(null);
  };

  const cancelEditNote = () => {
    setEditingNoteId(null);
    setEditContent('');
    setEditType('');
    setIsEditTypeOpen(false);
  };

  const handleSaveEditNote = async () => {
    if (!editingNoteId || !editContent.trim() || !editType) return;
    try {
      setIsSavingEdit(true);
      await applicationService.updateNote(application.id, editingNoteId, editContent.trim(), editType);
      cancelEditNote();
      await loadProfile();
    } catch (err) {
      console.error('Lỗi khi sửa ghi chú:', err);
      alert('Không thể sửa ghi chú. Vui lòng thử lại.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    setOpenMenuNoteId(null);
    if (!window.confirm('Bạn có chắc chắn muốn xoá ghi chú này không?')) return;
    try {
      setDeletingNoteId(noteId);
      await applicationService.deleteNote(application.id, noteId);
      await loadProfile();
    } catch (err) {
      console.error('Lỗi khi xoá ghi chú:', err);
      alert('Không thể xoá ghi chú. Vui lòng thử lại.');
    } finally {
      setDeletingNoteId(null);
    }
  };

  const handleAddNote = async () => {
    if (!noteContent.trim() || !noteType) return;
    try {
      setIsSubmittingNote(true);
      await applicationService.addNote(application.id, noteContent.trim(), noteType);
      setNoteContent('');
      setNoteType('');
      await loadProfile();
    } catch (err) {
      console.error('Lỗi khi thêm note:', err);
      alert('Không thể thêm ghi chú. Vui lòng thử lại.');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await applicationService.getApplicantProfile(application.id);
      if (!data) {
        throw new Error('Empty applicant profile response');
      }
      setProfile(data);
    } catch (err) {
      console.error('Không tải được hồ sơ applicant:', err);
      setError('Không thể tải hồ sơ người nhận nuôi. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [application.id]);

  const fullName = profile?.applicant.fullName || application.fullName || application.user?.name || '';
  const phone = profile?.applicant.phone || application.phone || '';
  const email = profile?.applicant.email || application.zalo || '';
  const avatar = profile?.applicant.avatarUrl || application.pet?.avatarUrl || application.pet?.images?.[0]?.url || '/images/placeholder-avatar.png';

  return (
    <div className="m-overlay fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="m-sheet bg-[#F8F9FA] w-full max-w-[900px] max-h-[90vh] rounded-[24px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-white px-5 sm:px-8 pt-8 pb-5 sm:py-6 border-b border-gray-200 relative shrink-0">
          <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} strokeWidth={1.5} />
          </button>

          <div className="flex gap-4 sm:gap-5 items-start pr-8 sm:pr-0">
            <img
              src={avatar}
              alt={fullName}
              className="w-[60px] h-[60px] sm:w-[84px] sm:h-[84px] rounded-[16px] sm:rounded-[20px] object-cover bg-gray-100 border border-gray-200 shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <h2 className="font-['Be_Vietnam_Pro',_sans-serif] text-[19px] sm:text-[24px] font-bold text-gray-900 leading-tight mb-2">
                {fullName || '—'}
              </h2>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6 mb-4 sm:mb-5 min-w-0 [&_span]:truncate">
                <div className="flex items-center gap-2 text-gray-500">
                  <Phone size={14} />
                  <span className="text-[13px] font-medium">{phone || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <Mail size={14} />
                  <span className="text-[13px] font-medium">{email || '—'}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 sm:gap-10 -ml-[76px] sm:ml-0 mt-1 sm:mt-0">
                <div className="flex flex-col border-r border-gray-200 pr-10">
                  <span className="text-[22px] font-bold text-gray-900 leading-none mb-1">
                    {profile ? profile.stats.activeApplications : '–'}
                  </span>
                  <span className="text-[13px] text-gray-500">Đang đăng ký</span>
                </div>
                <div className="flex flex-col border-r border-gray-200 pr-10">
                  <span className="text-[22px] font-bold text-gray-900 leading-none mb-1">
                    {profile ? profile.stats.successfulAdoptions : '–'}
                  </span>
                  <span className="text-[13px] text-gray-500">Đã nhận nuôi</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[22px] font-bold text-gray-900 leading-none mb-1">
                    {profile ? profile.stats.totalApplications : '–'}
                  </span>
                  <span className="text-[13px] text-gray-500">Đơn đã ghi nhận</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Body Content */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-24">
            <Loader2 className="animate-spin text-gray-400" size={28} />
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 gap-3">
            <p className="text-[13px] text-red-500">{error}</p>
            <button onClick={loadProfile} className="text-[13px] font-bold text-[#E89B5A] hover:underline">
              Thử lại
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 flex gap-6">
            <div className="w-full lg:w-1/2 flex flex-col gap-4">
              <div className="bg-white border border-gray-200 rounded-[16px] p-5 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-[16px] text-gray-900">
                    Đơn đang đăng ký
                  </h3>
                  <ChevronDown size={18} className="text-gray-400" />
                </div>
                {profile!.activeApplications.length === 0 ? (
                  <p className="text-[13px] text-gray-400 py-2">Không có đơn nào đang hoạt động.</p>
                ) : (
                  profile!.activeApplications.map((app, idx) => {
                    const badge = STATUS_BADGE[app.status] ?? STATUS_BADGE.SUBMITTED;
                    return (
                      <div
                        key={app.id}
                        className={`flex items-center justify-between gap-3 ${idx !== 0 ? 'border-t border-gray-100 pt-4 mt-4' : ''}`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <img
                            src={app.pet.avatarUrl || '/images/dog-placeholder.png'}
                            alt={app.pet.name}
                            className="w-[52px] h-[52px] rounded-[12px] object-cover"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-[15px] text-gray-900">{app.pet.name}</span>
                            <span className="text-[13px] text-gray-500">{app.shelterName || '—'}</span>
                            <span className="text-[11px] text-gray-400 mt-0.5">Đăng ký ngày {formatDate(app.createdAt)}</span>
                          </div>
                        </div>
                        <div
                          className="px-3 py-1 rounded-full border shrink-0"
                          style={{ background: badge.bg, borderColor: badge.border }}
                        >
                          <span className="text-[11px] font-bold" style={{ color: badge.text }}>
                            {badge.label}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Adoption History */}
              <div className="bg-white border border-gray-200 rounded-[16px] p-5 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-[16px] text-gray-900">
                    Đã nhận nuôi
                  </h3>
                  <ChevronDown size={18} className="text-gray-400" />
                </div>
                {profile!.adoptionHistory.length === 0 ? (
                  <p className="text-[13px] text-gray-400 py-2">Chưa có lịch sử nhận nuôi thành công.</p>
                ) : (
                  profile!.adoptionHistory.map((app, idx) => (
                    <div
                      key={app.id}
                      className={`flex items-center gap-3 py-4 ${idx !== 0 ? 'border-t border-gray-100' : 'pt-0 pb-0'}`}
                    >
                      <img
                        src={app.pet.avatarUrl || '/images/dog-placeholder.png'}
                        alt={app.pet.name}
                        className="w-[52px] h-[52px] rounded-[12px] object-cover"
                      />
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-bold text-[15px] text-gray-900">{app.pet.name}</span>
                        <span className="text-[13px] text-gray-500">{app.shelterName || '—'}</span>
                        <span className="text-[11px] text-gray-400 mt-0.5">Nhận nuôi {formatDate(app.createdAt)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Current Pets with PawHistory (Perfect Pixel UI) */}
              <div className="bg-white border border-gray-200 rounded-[16px] p-5 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-[16px] text-gray-900">
                    Thú cưng đang nuôi
                  </h3>
                  <ChevronDown size={18} className="text-gray-400" />
                </div>
                {profile!.currentPets.length === 0 ? (
                  <p className="text-[13px] text-gray-400 py-2">Chưa ghi nhận thú cưng nào.</p>
                ) : (
                  <div className="flex flex-col">
                    {profile!.currentPets.map((pet, idx) => {
                      const isExpanded = expandedPawHistoryId === pet.id;
                      const historyData = pet.pawHistory || [];
                      const sortedHistory = [...historyData].sort(
                        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
                      );

                      return (
                        <div
                          key={pet.id}
                          className="bg-white rounded-[16px] border border-[#FFF9F0] p-[12px] mb-[21px] last:mb-0 flex flex-col transition-all shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
                        >
                          {/* Pet Info Row (Clickable) */}
                          <div
                            className="flex flex-row items-center cursor-pointer"
                            onClick={() => setExpandedPawHistoryId(isExpanded ? null : pet.id)}
                          >
                            <img
                              src={pet.avatarUrl || '/images/dog-placeholder.png'}
                              alt={pet.name}
                              className="w-[76px] h-[92px] sm:w-[92px] sm:h-[108px] rounded-[14px] sm:rounded-[16px] object-cover bg-gray-100 shrink-0"
                            />

                            <div className="flex-1 ml-3.5 sm:ml-6 flex flex-col min-w-0 justify-center">
                              {/* Title & Badge */}
                              <div className="flex flex-row justify-between items-start mb-2">
                                <span className="font-semibold text-gray-900 text-lg truncate flex-1 mr-2 leading-tight">
                                  {pet.name}
                                </span>
                                {pet.qrVerificationStatus === 'VERIFIED' && (
                                  <div className="bg-[#FFF8F0] px-3 py-1 rounded-full border border-[#FFE1C2] shrink-0">
                                    <span className="text-[#E89B5A] text-[10px] uppercase font-bold tracking-wider">
                                      QR Registered
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Details */}
                              <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-1.5">
                                  <PawPrint size={14} className="text-gray-400 shrink-0" />
                                  <span className="text-gray-500 text-sm truncate">{pet.status || 'Chó ta'}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Cake size={14} className="text-gray-400 shrink-0" />
                                  <span className="text-gray-500 text-sm truncate">2 tuổi</span>
                                </div>
                              </div>

                              {/* Expand Button */}
                              <div className="mt-3 flex items-center gap-1 text-[12px] font-semibold text-[#E89B5A] hover:underline w-fit">
                                Xem PawHistory
                                {isExpanded ? <ChevronUp size={14} strokeWidth={2.5} /> : <ChevronDown size={14} strokeWidth={2.5} />}
                              </div>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-300">
                              <div className="flex flex-col pl-[10px]">
                                {sortedHistory.map((item, index) => {
                                  const isLastItem = index === sortedHistory.length - 1;
                                  const cfg = HISTORY_TYPE_CONFIG[item.type] ?? DEFAULT_HISTORY_CONFIG;
                                  const Icon = cfg.Icon;
                                  return (
                                    <div key={item.id ?? index} className="flex min-h-[44px]">
                                      <div className="w-6 relative mr-3 shrink-0">
                                        {!isLastItem && (
                                          <div className="absolute w-[1px] bg-gray-200" style={{ top: 26, bottom: -4, left: 11.5 }} />
                                        )}
                                        <div className="w-6 h-6 rounded-full flex items-center justify-center relative z-10" style={{ backgroundColor: cfg.bg }}>
                                          <Icon size={12} style={{ color: cfg.color }} />
                                        </div>
                                      </div>
                                      <div className={`flex-1 ${!isLastItem ? 'pb-3' : ''}`}>
                                        <div className="flex justify-between items-start gap-2">
                                          <p className="text-[13px] font-medium text-black">{item.title}</p>
                                          <span className="text-[11px] text-[#8E8E93] shrink-0">
                                            {formatDate(item.date)}
                                          </span>
                                        </div>
                                        {item.description && (
                                          <p className="text-[11px] text-[#8E8E93] mt-0.5 line-clamp-2 leading-snug">{item.description}</p>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                                {sortedHistory.length === 0 && (
                                  <p className="text-[12px] text-gray-400 italic py-2 text-center">Chưa có lịch sử nào.</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column — Notes */}
            <div className="w-full lg:w-1/2 flex flex-col lg:h-full">
              <div className="bg-white border border-gray-200 rounded-[16px] p-6 shadow-sm flex-1 flex flex-col">
                <h3 className="font-bold text-[16px] text-gray-900 mb-6">
                  Ghi chú từ các trạm
                </h3>

                <div className="flex flex-col gap-6">
                  {profile!.notes.length === 0 ? (
                    <p className="text-[13px] text-gray-400">Chưa có ghi chú nào.</p>
                  ) : (
                    profile!.notes.map((note, idx) => {
                      const style = NOTE_TYPE_STYLE[note.type];
                      const isLast = idx === profile!.notes.length - 1;
                      const isEditingThis = editingNoteId === note.id;
                      const isDeletingThis = deletingNoteId === note.id;

                      const authorRole = (note.author as any)?.role || (note as any).authorRole;

                      return (
                        <div key={note.id} className="flex gap-4">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border"
                            style={{ borderColor: style.color, backgroundColor: `${style.color}10` }}
                          >
                            <img
                              src={note.author?.avatarUrl || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=100"}
                              className="w-full h-full rounded-full object-cover"
                              alt="Trạm"
                            />
                          </div>
                          <div className={`flex flex-col flex-1 ${!isLast ? 'border-b border-gray-100 pb-5' : ''}`}>
                            {isEditingThis ? (
                              <div className="flex flex-col gap-3">
                                <div className="relative" ref={editTypeDropdownRef}>
                                  <button
                                    type="button"
                                    onClick={() => setIsEditTypeOpen((v) => !v)}
                                    className={`w-full bg-white border rounded-lg px-3 py-2 flex justify-between items-center text-left transition-colors ${isEditTypeOpen ? 'border-[#E89B5A] ring-2 ring-[#E89B5A]/20' : 'border-gray-200'
                                      }`}
                                  >
                                    <span className={`text-[13px] ${editType ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                                      {editType ? NOTE_TYPE_OPTIONS.find((o) => o.value === editType)?.label : 'Select type...'}
                                    </span>
                                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${isEditTypeOpen ? 'rotate-180' : ''}`} />
                                  </button>
                                  {isEditTypeOpen && (
                                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                                      {NOTE_TYPE_OPTIONS.map((opt) => (
                                        <button
                                          key={opt.value}
                                          type="button"
                                          onClick={() => { setEditType(opt.value); setIsEditTypeOpen(false); }}
                                          className={`w-full text-left px-3 py-2.5 text-[13px] transition-colors ${editType === opt.value
                                            ? 'bg-[#2563EB] text-white font-bold'
                                            : 'text-gray-700 hover:bg-gray-50'
                                            }`}
                                        >
                                          {opt.label}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <textarea
                                  rows={3}
                                  value={editContent}
                                  onChange={(e) => setEditContent(e.target.value)}
                                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-[13px] outline-none resize-none focus:border-[#E89B5A]"
                                />
                                <div className="flex items-center gap-2 justify-end">
                                  <button
                                    type="button"
                                    onClick={cancelEditNote}
                                    disabled={isSavingEdit}
                                    className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[12px] font-semibold rounded-md"
                                  >
                                    Hủy
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleSaveEditNote}
                                    disabled={isSavingEdit || !editContent.trim() || !editType}
                                    className="px-4 py-1.5 bg-[#E89B5A] hover:bg-[#DA8A45] text-white text-[12px] font-bold rounded-md disabled:opacity-60"
                                  >
                                    {isSavingEdit ? 'Đang lưu...' : 'Lưu'}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex justify-between items-start mb-1 gap-2">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-[14px] text-gray-900">
                                      {note.author.name || 'Nhân viên trạm'}
                                    </h4>
                                    {authorRole && STAFF_ROLE_LABEL[authorRole as keyof typeof STAFF_ROLE_LABEL] && (
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-tight ${ROLE_BADGE_STYLE[authorRole as keyof typeof ROLE_BADGE_STYLE] || 'bg-gray-100 text-gray-600'}`}>
                                        {STAFF_ROLE_LABEL[authorRole as keyof typeof STAFF_ROLE_LABEL]}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {isAdmin && (
                                      <button
                                        ref={(el) => { noteButtonRefs.current[note.id] = el; }}
                                        type="button"
                                        onClick={(e) => toggleNoteMenu(e, note.id)}
                                        disabled={isDeletingThis}
                                        className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-800 transition-colors disabled:opacity-50"
                                      >
                                        {isDeletingThis ? (
                                          <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                          <MoreVertical size={16} strokeWidth={2} />
                                        )}
                                      </button>
                                    )}
                                    <Flag size={14} className="text-gray-400" />
                                  </div>
                                </div>
                                <p className="text-[11px] text-gray-500 mb-2">
                                  <span className="font-bold" style={{ color: style.color }}>{style.label}</span>
                                  {' · '}{formatDate(note.createdAt)}
                                </p>
                                <p className="text-[13px] text-gray-600 leading-relaxed">{note.content}</p>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Add New Note (Chỉ hiện cho Admin) */}
                {isAdmin && (
                  <div className="mt-6 border border-dashed border-gray-300 rounded-[16px] p-5 bg-[#FAFAFA]">
                    <h4 className="font-bold text-[14px] text-gray-900 mb-4">Thêm ghi chú</h4>

                    <div className="flex flex-col gap-4">
                      <div className="relative" ref={typeDropdownRef}>
                        <label className="text-[12px] font-bold text-gray-700 mb-1.5 block">Loại ghi chú</label>
                        <button
                          type="button"
                          onClick={() => setIsTypeOpen((v) => !v)}
                          className={`w-full bg-white border rounded-lg px-3 py-2.5 flex justify-between items-center text-left transition-colors ${isTypeOpen ? 'border-[#E89B5A] ring-2 ring-[#E89B5A]/20' : 'border-gray-200'
                            }`}
                        >
                          <span className={`text-[13px] ${noteType ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                            {noteType ? NOTE_TYPE_OPTIONS.find((o) => o.value === noteType)?.label : 'Chọn loại ghi chú'}
                          </span>
                          <ChevronDown size={16} className={`text-gray-400 transition-transform ${isTypeOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isTypeOpen && (
                          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                            <button
                              type="button"
                              onClick={() => { setNoteType(''); setIsTypeOpen(false); }}
                              className="w-full text-left px-3 py-2.5 text-[13px] text-gray-400 hover:bg-gray-50"
                            >
                              Chọn loại ghi chú...
                            </button>
                            {NOTE_TYPE_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => { setNoteType(opt.value); setIsTypeOpen(false); }}
                                className={`w-full text-left px-3 py-2.5 text-[13px] transition-colors ${noteType === opt.value
                                  ? 'bg-[#E89B5A] text-white font-bold'
                                  : 'text-gray-700 hover:bg-gray-50'
                                  }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="text-[12px] font-bold text-gray-700 mb-1.5 block">Chi tiết</label>
                        <textarea
                          rows={3}
                          value={noteContent}
                          onChange={(e) => setNoteContent(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-[13px] outline-none resize-none focus:border-[#E89B5A]"
                          placeholder="Chia sẻ dưới tên shelter name"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col items-center mt-4 gap-3">
                      <span className="text-[11px] text-gray-500 text-center">
                        Chia sẻ thông tin khách quan · Chỉ hiển thị nội bộ
                      </span>
                      <button
                        onClick={handleAddNote}
                        disabled={isSubmittingNote || !noteContent.trim() || !noteType}
                        className="bg-[#F49494] hover:bg-[#FF7070] transition-colors text-white font-bold text-[13px] py-[10px] px-[32px] rounded-full shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isSubmittingNote ? 'Đang lưu...' : 'Thêm ghi chú'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Note item action popup (portal to escape modal's overflow) */}
      {mounted && openMenuNoteId && profile && createPortal(
        <div
          ref={noteMenuRef}
          style={{ position: 'fixed', top: `${menuCoords.top}px`, left: `${menuCoords.left}px`, zIndex: 99999 }}
          className="w-[160px] bg-white rounded-[14px] shadow-xl border border-gray-100 py-1.5 flex flex-col origin-top-right"
        >
          <button
            type="button"
            onClick={() => {
              const note = profile.notes.find((n) => n.id === openMenuNoteId);
              if (note) startEditNote(note);
            }}
            className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-gray-50 w-full text-left"
          >
            <Pencil size={15} className="text-gray-700" />
            <span className="text-[13px] font-medium text-gray-900">Sửa</span>
          </button>
          <button
            type="button"
            onClick={() => openMenuNoteId && handleDeleteNote(openMenuNoteId)}
            className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-red-50 w-full text-left"
          >
            <Trash2 size={15} className="text-red-600" />
            <span className="text-[13px] font-medium text-red-600">Xoá</span>
          </button>
        </div>,
        document.body
      )}
    </div>
  );
};