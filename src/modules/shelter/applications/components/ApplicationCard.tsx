'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useRouter } from 'next/navigation';
import {
  Phone,
  Mail,
  Cake,
  Calendar,
  MessageCircle,
  FileText,
  MoreVertical,
  User,
  AlertTriangle,
  Folder,
  X,
  File,
  ChevronRight,
} from 'lucide-react';
import { AdoptionApplication } from '@/types/application';
import { useTagColorStore } from '@/stores/useTagColorStore';
import { useViewedApplicationStore } from '@/stores/useViewedApplicationStore';
import { useIsShelterAdmin } from '@/hooks/useIsShelterAdmin';
import { motion } from 'framer-motion';
import { useApplicationActions } from '@/stores/useApplicationStore';
import { ApplicantFlagModal } from './ApplicantFlag';
import { getApplicantFlagLabel } from '@/constants/applicantFlag';
import {
  RelatedApplicationsBadge,
  getApplicantId,
  getApplicantColor,
  getRelated,
  setHoveredApplicant,
  useIsApplicantHighlighted,
} from './RelatedApplications';
import { ApplicationHoverCard, isHoverInfoStatus } from './ApplicationHoverCard';

const formatSubmittedAt = (iso: string) => {
  try {
    return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso));
  } catch {
    return '13/02/2026';
  }
};

/** Ngày sinh người nhận nuôi → dd/MM/yyyy. Trả về null nếu không có / không hợp lệ (đơn cũ chưa có dob). */
const formatDob = (iso?: string | null): string | null => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
};

/** true khi viewport < 768px (khớp breakpoint `md` của Tailwind) */
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return isMobile;
};

/**
 * React cho sự kiện nổi bọt qua Portal về cây React cha. Thẻ này đang gắn
 * listener kéo-thả + onClick mở modal, nên mọi thứ render trong portal
 * (menu, sheet, modal cờ) phải chặn nổi bọt, nếu không chạm vào menu sẽ
 * kích hoạt kéo thẻ hoặc mở modal đơn.
 */
const stopBubbling = {
  onClick: (e: React.SyntheticEvent) => e.stopPropagation(),
  onPointerDown: (e: React.SyntheticEvent) => e.stopPropagation(),
  onMouseDown: (e: React.SyntheticEvent) => e.stopPropagation(),
  onTouchStart: (e: React.SyntheticEvent) => e.stopPropagation(),
  onKeyDown: (e: React.SyntheticEvent) => e.stopPropagation(),
};

type MenuEntry = {
  key: string;
  label: string;
  Icon: React.ElementType;
  danger?: boolean;
};

interface ApplicationCardContentProps {
  application: AdoptionApplication;
  showMenu?: boolean;
  onOpenProfile: (app: AdoptionApplication) => void;
  onOpenDetail: (app: AdoptionApplication) => void;
  onRemove: (app: AdoptionApplication) => void;
  onOpenDocuments: (app: AdoptionApplication) => void;
}

export const ApplicationCardContent: React.FC<ApplicationCardContentProps> = ({
  application,
  onOpenProfile,
  onOpenDetail,
  onRemove,
  onOpenDocuments,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { getTagColor } = useTagColorStore();
  const isAdmin = useIsShelterAdmin();
  const isMobile = useIsMobile();
  const isViewed = useViewedApplicationStore((s) => !!s.viewed[application.id]);
  const shouldShowDot = mounted && !isViewed;
  const [isFlagOpen, setIsFlagOpen] = useState(false);
  const { fetchApplications } = useApplicationActions();
  const flag = application.applicantFlag;
  // Bóc tách danh sách tags động từ application (hỗ trợ cả dạng nested t.tag lẫn dạng phẳng)
  const displayTags = application.tags ? application.tags.map((t: any) => t.tag || t) : [];
  const isAdopted =
    application.status === 'ADOPTION_COMPLETED' ||
    (application.pet as any)?.status === 'ADOPTED'; // fallback: pet bị đổi trạng thái qua dropdown ở Pet Detail
  const isInterviewCompleted = application.appointment?.status === 'COMPLETED';
  const documents = (application as any).documents as { status: string }[] | undefined;
  const totalDocs = documents?.length ?? 0;
  const acceptedDocs = documents?.filter((d) => d.status === 'ACCEPTED').length ?? 0;
  const showDocsBadge = application.status === 'NEED_MORE_INFO' && totalDocs > 0;
  const allDocsAccepted = showDocsBadge && acceptedDocs === totalDocs;
  // Ngày sinh người nhận nuôi (app mobile mới gửi lên; đơn cũ có thể không có)
  const applicantDob = formatDob((application as any).dob);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Desktop: click ra ngoài thì đóng dropdown
  useEffect(() => {
    if (isMobile) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current && !menuRef.current.contains(target) &&
        buttonRef.current && !buttonRef.current.contains(target)
      ) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen, isMobile]);

  // Desktop: cuộn thì đóng dropdown (vị trí fixed sẽ lệch khỏi thẻ)
  useEffect(() => {
    if (isMobile) return;
    const handleScroll = () => { if (isMenuOpen) setIsMenuOpen(false); };
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isMenuOpen, isMobile]);

  // Mobile: khoá cuộn nền khi sheet đang mở
  useEffect(() => {
    if (!isMobile || !isMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isMobile, isMenuOpen]);

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isMenuOpen && buttonRef.current && !isMobile) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuCoords({
        top: rect.bottom + 8,
        left: Math.max(8, rect.right - 220),
      });
    }
    setIsMenuOpen(!isMenuOpen);
  };

  const runAction = (action: string) => {
    setIsMenuOpen(false);
    switch (action) {
      case 'applicantProfile':
        onOpenProfile(application);
        break;
      case 'petProfile': {
        const petId = application.pet?.id;
        if (petId) router.push(`/shelter/pets/${petId}`);
        break;
      }
      case 'allDocuments': onOpenDocuments(application); break;
      case 'viewApplication': onOpenDetail(application); break;
      case 'flagApplicant': setIsFlagOpen(true); break;
      case 'removeTicket': onRemove(application); break;
    }
  };

  const handleMenuAction = (e: React.MouseEvent, action: string) => {
    e.stopPropagation();
    runAction(action);
  };

  const entries: MenuEntry[] = [
    { key: 'applicantProfile', label: 'Hồ sơ người nhận nuôi', Icon: User },
    { key: 'viewApplication', label: 'Xem đơn đăng ký', Icon: FileText },
    { key: 'allDocuments', label: 'Tất cả tài liệu', Icon: Folder },
    ...(isAdmin
      ? [{ key: 'flagApplicant', label: flag ? 'Sửa / gỡ đánh dấu' : 'Đánh dấu hành vi xấu', Icon: AlertTriangle, danger: true }]
      : []),
    ...(isAdmin && application.status !== 'ADOPTION_COMPLETED'
      ? [{ key: 'removeTicket', label: 'Xoá đơn', Icon: X, danger: true }]
      : []),
  ];

  const applicantName = application.fullName || application.user?.name || 'Maria Garcia';
  const petName = application.pet?.name || 'Luna';

  return (
    <div className="flex flex-col w-full relative group/content">
      {/* Nút "..." — mobile luôn hiện (không có hover), vùng chạm 36px; desktop hiện khi hover */}
      <div className="absolute top-[-6px] right-[-6px] z-10 opacity-100 md:top-[-2px] md:right-[-2px] md:opacity-0 md:group-hover/content:opacity-100 transition-opacity">
        <button
          ref={buttonRef}
          type="button"
          aria-label="Tuỳ chọn"
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition-all active:bg-gray-100 md:h-auto md:w-auto md:rounded-md md:p-1 md:hover:bg-gray-100 md:hover:text-gray-800"
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onClick={toggleMenu}
        >
          <MoreVertical size={isMobile ? 18 : 15} strokeWidth={2} />
        </button>

        {/* Desktop: dropdown */}
        {mounted && isMenuOpen && !isMobile && createPortal(
          <div
            ref={menuRef}
            {...stopBubbling}
            style={{ position: 'fixed', top: `${menuCoords.top}px`, left: `${menuCoords.left}px`, zIndex: 99999 }}
            className="w-[220px] bg-white rounded-[16px] shadow-xl border border-gray-100 py-2.5 flex flex-col origin-top-right"
          >
            {entries.map((entry, i) => {
              const prev = entries[i - 1];
              const needDivider = entry.danger && prev && !prev.danger;
              return (
                <React.Fragment key={entry.key}>
                  {needDivider && <div className="h-[1px] w-full bg-gray-100 my-1" />}
                  <button
                    onClick={(e) => handleMenuAction(e, entry.key)}
                    className={`flex items-center gap-3.5 px-4 py-2.5 w-full text-left ${entry.danger ? 'hover:bg-red-50' : 'hover:bg-gray-50'}`}
                  >
                    <entry.Icon size={18} className={entry.danger ? 'text-red-600' : 'text-gray-800'} />
                    <span className={`text-[15px] font-medium ${entry.danger ? 'text-red-600' : 'text-gray-900'}`}>{entry.label}</span>
                  </button>
                </React.Fragment>
              );
            })}
          </div>,
          document.body
        )}

        {/* Mobile: bottom sheet */}
        {mounted && isMenuOpen && isMobile && createPortal(
          <div
            {...stopBubbling}
            className="fixed inset-0 z-[99999] flex items-end bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-150"
            onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Tuỳ chọn đơn nhận nuôi"
              onClick={(e) => e.stopPropagation()}
              className="w-full rounded-t-[28px] bg-[#F5F5F7] px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-10px_40px_rgba(0,0,0,0.18)] animate-in slide-in-from-bottom-8 duration-250"
            >
              <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-black/15" />

              <div className="mb-3 px-1">
                <p className="truncate text-[17px] font-semibold tracking-[-0.01em] text-[#0D062D]">{applicantName}</p>
                <p className="truncate text-[14px] text-[#787486]">Đăng ký nhận nuôi {petName}</p>
              </div>

              <div className="overflow-hidden rounded-[20px] bg-white">
                {entries.filter((e) => !e.danger).map((entry, i, arr) => (
                  <button
                    key={entry.key}
                    type="button"
                    onClick={(e) => handleMenuAction(e, entry.key)}
                    className={`flex min-h-[54px] w-full items-center gap-3 px-4 text-left transition-colors active:bg-black/[0.04] ${i < arr.length - 1 ? 'border-b border-black/[0.06]' : ''}`}
                  >
                    <entry.Icon size={20} className="text-[#0D062D]" />
                    <span className="flex-1 text-[16px] text-[#0D062D]">{entry.label}</span>
                    <ChevronRight size={18} className="text-gray-300" />
                  </button>
                ))}
              </div>

              {entries.some((e) => e.danger) && (
                <div className="mt-3 overflow-hidden rounded-[20px] bg-white">
                  {entries.filter((e) => e.danger).map((entry, i, arr) => (
                    <button
                      key={entry.key}
                      type="button"
                      onClick={(e) => handleMenuAction(e, entry.key)}
                      className={`flex min-h-[54px] w-full items-center gap-3 px-4 text-left transition-colors active:bg-red-50 ${i < arr.length - 1 ? 'border-b border-black/[0.06]' : ''}`}
                    >
                      <entry.Icon size={20} className="text-red-600" />
                      <span className="flex-1 text-[16px] font-medium text-red-600">{entry.label}</span>
                    </button>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); }}
                className="mt-3 h-[52px] w-full rounded-[16px] bg-white text-[16px] font-semibold text-[#0D062D] transition-transform active:scale-[0.98]"
              >
                Đóng
              </button>
            </div>
          </div>,
          document.body
        )}
      </div>

      {/* 1. Ảnh đại diện & Tên */}
      <div className="flex items-center gap-2.5 w-full mb-2.5 pr-8 md:pr-0">
        <img
          className="w-[38px] h-[38px] md:w-[34px] md:h-[34px] rounded-full object-cover bg-gray-100 border border-gray-200 shrink-0"
          src={application.pet?.avatarUrl || application.pet?.images?.[0]?.url || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=100'}
          alt={applicantName}
        />
        <div className="flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className="font-sans text-[15px] md:text-[14px] leading-tight text-[#111111] font-semibold truncate md:hover:text-[#E89B5A] cursor-pointer transition-colors"
              onPointerDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onOpenProfile(application); }}
            >
              {applicantName}
            </span>
            {shouldShowDot && (
              <span className="w-[7px] h-[7px] md:w-[6px] md:h-[6px] bg-[#FF6B6B] rounded-full shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
            <span className="font-sans text-[13px] md:text-[12px] leading-tight text-[#888888] truncate">
              Nhận nuôi <span className="font-semibold text-[#111111]">{petName}</span>
            </span>
            <RelatedApplicationsBadge application={application} />
          </div>
        </div>
      </div>

      {flag && (
        <div
          className="flex items-center gap-1.5 mb-2.5 px-2 py-1 rounded-lg bg-[#FEF2F2] border border-[#FECACA] w-fit max-w-full"
          title={flag.note || undefined}
        >
          <AlertTriangle size={12} className="text-[#DC2626] shrink-0" strokeWidth={2} />
          <span className="font-sans text-[11px] font-semibold text-[#DC2626] truncate">
            {getApplicantFlagLabel(flag.reason)}
          </span>
        </div>
      )}

      <div className="flex flex-col gap-1.5 mb-2.5">
        <div className="flex items-center gap-2 w-full">
          <Phone size={13} className="text-[#888888] shrink-0" strokeWidth={2} />
          <span className="font-sans text-[13px] md:text-[12px] text-[#555555] font-semibold tracking-wide truncate">
            {application.phone || '0912345678'}
          </span>
        </div>
        {/* Ngày sinh — chỉ hiện khi đơn có dob */}
        {applicantDob && (
          <div className="flex items-center gap-2 w-full" title="Ngày sinh">
            <Cake size={13} className="text-[#888888] shrink-0" strokeWidth={2} />
            <span className="font-sans text-[13px] md:text-[12px] text-[#555555] font-normal truncate">
              {applicantDob}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2 w-full">
          <Mail size={13} className="text-[#888888] shrink-0" strokeWidth={2} />
          <span className="font-sans text-[13px] md:text-[12px] text-[#888888] font-normal truncate">
            {application.user?.email || application.zalo || 'mariagarcia@email.com'}
          </span>
        </div>
      </div>

      {/* 3. Nhãn — badge trạng thái thay thế tags khi phỏng vấn xong / đã nhận nuôi */}
      {isAdopted || isInterviewCompleted ? (
        <div
          className="w-full mb-2.5 px-3 py-1.5 rounded-[10px] border text-center text-[12px] md:text-[11px] font-semibold tracking-tight leading-tight"
          style={
            isAdopted
              ? { backgroundColor: '#F3F4F6', borderColor: '#6B728040', color: '#6B7280' }
              : { backgroundColor: '#F9F5FD', borderColor: '#5A1B8D40', color: '#5A1B8D' }
          }
        >
          {isAdopted ? 'Đã nhận nuôi' : 'Đã hoàn thành phỏng vấn'}
        </div>
      ) : displayTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 mb-2.5">
          {displayTags.map((tag: any, idx: number) => {
            const tagColor = tag.color || (typeof tag.tag === 'object' ? tag.tag?.color : null);
            const fallbackColors = ['#5982E6', '#FF922B', '#40C057', '#7950F2'];
            const activeColor = getTagColor(tag.name) || tagColor || fallbackColors[idx % fallbackColors.length];

            return (
              <div
                key={tag.id || idx}
                className="px-2.5 py-[3px] md:px-2 md:py-[2px] rounded-full border text-[11.5px] md:text-[10.5px] font-semibold tracking-tight transition-colors leading-tight"
                style={{
                  backgroundColor: `${activeColor}15`,
                  borderColor: `${activeColor}40`,
                  color: activeColor,
                }}
              >
                <span>{tag.name}</span>
              </div>
            );
          })}
        </div>
      )}

      {showDocsBadge && (
        <div
          className={`flex items-center gap-1.5 mb-2.5 px-2 py-1 rounded-lg w-fit ${allDocsAccepted ? 'bg-[#E7F8ED]' : 'bg-[#FFF8E6]'}`}
        >
          <File size={12} className={allDocsAccepted ? 'text-[#16A34A]' : 'text-[#E89B5A]'} strokeWidth={2} />
          <span
            className={`font-sans text-[11px] font-semibold ${allDocsAccepted ? 'text-[#16A34A]' : 'text-[#E89B5A]'}`}
          >
            {acceptedDocs}/{totalDocs} tài liệu đã duyệt
            {allDocsAccepted ? ' — sẵn sàng chuyển bước' : ''}
          </span>
        </div>
      )}

      {/* 4. Đường kẻ phân cách */}
      <div className="w-full h-px bg-[#EEEEEE] mb-2" />

      {/* 5. Chân thẻ */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-1.5">
          <Calendar size={12} className="text-[#888888]" strokeWidth={1.8} />
          <span className="font-sans text-[12px] md:text-[11px] text-[#888888] font-medium tracking-wide">
            {formatSubmittedAt(application.createdAt)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1" title="Số ghi chú">
            <MessageCircle size={12} className="text-[#888888]" strokeWidth={1.8} />
            <span className="font-sans text-[12px] md:text-[11px] text-[#888888] font-semibold">
              {application.notes?.length || 0}
            </span>
          </div>
          <div className="flex items-center gap-1" title="Số nhãn">
            <File size={12} className="text-[#888888]" strokeWidth={1.8} />
            <span className="font-sans text-[12px] md:text-[11px] text-[#888888] font-semibold">
              {displayTags.length}
            </span>
          </div>
        </div>
      </div>

      {mounted && isFlagOpen && (
        <div {...stopBubbling}>
          <ApplicantFlagModal
            application={application}
            onClose={() => setIsFlagOpen(false)}
            onDone={fetchApplications}
          />
        </div>
      )}
    </div>
  );
};


interface ApplicationCardProps {
  application: AdoptionApplication;
  isMoving: boolean;
  showRedDot?: boolean;
  showMenu?: boolean;
  onOpenProfile: (app: AdoptionApplication) => void;
  onOpenDetail: (app: AdoptionApplication) => void;
  onCardClick: (app: AdoptionApplication) => void;
  onRemove: (app: AdoptionApplication) => void;
  onOpenDocuments: (app: AdoptionApplication) => void;
  onOpenQuickView: (app: AdoptionApplication) => void;
}

export const ApplicationCard: React.FC<ApplicationCardProps> = ({
  application,
  isMoving,
  showMenu,
  onOpenProfile,
  onOpenDetail,
  onCardClick,
  onRemove,
  onOpenDocuments,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: application.id,
  });

  const applicantId = getApplicantId(application);
  const hasRelated = !!applicantId && getRelated(application).length > 0;
  const highlighted = useIsApplicantHighlighted(hasRelated ? applicantId : undefined);
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showHoverInfo = isHoverInfoStatus(application.status);

  const clearHover = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = null;
    setHoverRect(null);
  };

  // Đang kéo thẻ thì không hiện popup
  useEffect(() => {
    if (isDragging) clearHover();
  }, [isDragging]);

  // Cuộn thì ẩn, tránh popup lệch khỏi thẻ
  useEffect(() => {
    if (!hoverRect) return;
    window.addEventListener('scroll', clearHover, true);
    return () => window.removeEventListener('scroll', clearHover, true);
  }, [hoverRect]);

  useEffect(() => () => { if (hoverTimer.current) clearTimeout(hoverTimer.current); }, []);

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    forcedColorAdjust: 'none' as const,
    // QUAN TRỌNG: trước đây là 'none' → ngón tay đặt lên thẻ sẽ không cuộn được
    // bảng/cột. 'manipulation' cho phép cuộn; kéo thẻ kích hoạt bằng nhấn giữ.
    touchAction: 'manipulation',
    WebkitTouchCallout: 'none',
    ...(highlighted && applicantId ? { boxShadow: `0 0 0 2px ${getApplicantColor(applicantId)}` } : {}),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      tabIndex={-1}
      onClick={() => onCardClick(application)}
      // Chỉ phản ứng với chuột thật — trên cảm ứng, mouseenter bị giả lập khi chạm
      // và sẽ bật popup hover rồi đè lên modal.
      onPointerEnter={(e) => {
        if (e.pointerType !== 'mouse') return;
        if (hasRelated) setHoveredApplicant(applicantId!);
        if (showHoverInfo && !isDragging) {
          const el = e.currentTarget;
          hoverTimer.current = setTimeout(() => setHoverRect(el.getBoundingClientRect()), 200);
        }
      }}
      onPointerLeave={(e) => {
        if (e.pointerType !== 'mouse') return;
        if (hasRelated) setHoveredApplicant(null);
        clearHover();
      }}
      className={`group bg-white rounded-[16px] md:rounded-[14px] w-full p-3.5 md:p-3 border border-[#EAEAEA] shadow-[0_1px_2px_rgba(16,16,24,0.04)] md:shadow-none cursor-grab active:cursor-grabbing select-none focus:outline-none relative ${isDragging ? 'opacity-40 shadow-xl z-50' : 'z-10 md:hover:border-[#D1D1D1]'} ${isMoving ? 'pointer-events-none opacity-60' : ''}`}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      >
        <ApplicationCardContent
          application={application}
          showMenu={showMenu}
          onOpenProfile={onOpenProfile}
          onOpenDetail={onOpenDetail}
          onRemove={onRemove}
          onOpenDocuments={onOpenDocuments}
        />
      </motion.div>
      {hoverRect && !isDragging && <ApplicationHoverCard application={application} rect={hoverRect} />}
    </div>
  );
};