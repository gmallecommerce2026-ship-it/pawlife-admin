'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  MeasuringStrategy,
  useDroppable,
  defaultDropAnimationSideEffects,
  type DropAnimation,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { ReplacePetModal } from './components/ReplacePetModal';
import { KANBAN_COLUMNS, ApplicationStatus, AdoptionApplication } from '@/types/application';
import {
  useApplicationList,
  useApplicationActions,
  useApplicationFilter,
  selectFilteredApplications,
} from '@/stores/useApplicationStore';
import { ApplicationColumn } from './components/ApplicationColumn';
import { ApplicationCardContent } from './components/ApplicationCard';
import { ApplicationDetailModal } from './components/ApplicationDetailModal';
import { ApplicationFilterBar } from './components/ApplicationFilterBar';
import { ApplicantProfileModal } from '@/components/ApplicantProfileModal';
import { AllDocumentsModal } from './components/AllDocumentsModal';
import { ApplicationQuickViewModal } from './components/ApplicationQuickViewModal';
import { InterviewScheduleModal } from './components/InterviewScheduleModal';
import { ApproveApplicationModal } from './components/ApproveApplicationModal';
import { NeedMoreInfoModal } from './components/NeedMoreInfoModal';
import { MoveToPendingModal } from './components/MoveToPendingModal';
import { RequestDocumentsModal } from './components/RequestDocumentsModal';
import { RequiredDocument } from '@/constants/adoptionDocuments';
import { applicationService } from '@/services/applicationService';
import { useTagColorStore } from '@/stores/useTagColorStore';
import { useWebsocket } from '@/hooks/useWebsocket';
import { getUserFromToken } from '@/utils/getUserFromToken';
import { useViewedApplicationStore } from '@/stores/useViewedApplicationStore';
import { useShelterTeam, useShelterTeamActions } from '@/store/useShelterTeamStore';
import { useIsShelterAdmin } from '@/hooks/useIsShelterAdmin';
import { DeleteApplicationModal } from '@/components/DeleteApplicationModal';
import { ResponsiveModal } from '@/components/ResponsiveModal';

const isColumnId = (id: string | number) =>
  KANBAN_COLUMNS.some((c) => c.status === id);

const resolveOverId = (id: string | number) =>
  String(id).startsWith('dock-') ? String(id).slice(5) : String(id);

const DockChip: React.FC<{ status: ApplicationStatus; label: string; count: number }> = ({ status, label, count }) => {
  const { setNodeRef, isOver } = useDroppable({ id: `dock-${status}` });
  return (
    <div
      ref={setNodeRef}
      className={`flex h-11 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold transition-all duration-150 ${isOver ? 'scale-110 bg-[#E89B5A] text-white shadow-lg' : 'bg-white text-[#0D062D]'
        }`}
    >
      {label}
      <span className="text-[11px] opacity-60">{count}</span>
    </div>
  );
};
const mergeAdoptionIntoApproved = (status: ApplicationStatus): ApplicationStatus =>
  status === 'ADOPTION_COMPLETED' ? 'APPROVED' : status;
const NEXT_STATUS_MAP: Partial<Record<ApplicationStatus, ApplicationStatus>> = {
  SUBMITTED: 'PENDING',
  PENDING: 'INTERVIEW_SCHEDULED',
  INTERVIEW_SCHEDULED: 'APPROVED',
  APPROVED: 'APPROVED',
};

// Các trạng thái mà khi bấm vào thẻ sẽ mở MoveToPendingModal
const PENDING_STYLE_MODAL_STATUSES: ApplicationStatus[] = [
  'SUBMITTED',
  'PENDING',
  'APPROVED',
  'ADOPTION_COMPLETED', // cùng cột với APPROVED
  'CLOSED',
];

const dropAnimation: DropAnimation = {
  duration: 160,
  easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: '0.4' } },
  }),
};

const CLOSE_REASONS = [
  'Không phù hợp',
  'Đã có người nhận nuôi',
  'Người đăng ký hủy đơn',
  'Hết thời hạn phản hồi',
];

/** Khoảng đệm trái của vùng cuộn ngang trên mobile (px) — phải khớp class `px-4` bên dưới */
const BOARD_PAD_LEFT = 16;

/* =============================================================================
   Dialog đóng hồ sơ — bottom sheet trên mobile, dialog giữa màn hình ≥ sm
   ============================================================================= */
interface CloseApplicationDialogProps {
  application: AdoptionApplication;
  reason: string;
  isCustom: boolean;
  isClosing: boolean;
  onReasonChange: (v: string) => void;
  onCustomChange: (v: boolean) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

const CloseApplicationDialog: React.FC<CloseApplicationDialogProps> = ({
  application,
  reason,
  isCustom,
  isClosing,
  onReasonChange,
  onCustomChange,
  onCancel,
  onConfirm,
}) => (
  <ResponsiveModal onClose={onCancel} maxWidth="sm:max-w-[420px]">
    <div className="px-5 pb-5 pt-2 sm:p-5">
      <h3 className="mb-1.5 text-[20px] font-bold tracking-tight text-gray-900 sm:text-[16px]">
        Đóng hồ sơ nhận nuôi?
      </h3>
      <p className="mb-4 text-[15px] leading-relaxed text-gray-600 sm:text-[13px]">
        Bạn có chắc chắn muốn đóng đơn của{' '}
        <strong className="text-gray-900">{application.fullName || application.user?.name}</strong>{' '}
        cho bé <strong className="text-gray-900">{application.pet?.name}</strong>?
      </p>

      <p className="mb-2 text-[13px] font-medium text-gray-500 sm:text-[11px]">Lý do đóng</p>
      <div role="radiogroup" className="mb-2 flex flex-col rounded-2xl bg-gray-50 p-1">
        {CLOSE_REASONS.map((r) => {
          const checked = !isCustom && reason === r;
          return (
            <label
              key={r}
              className={`flex min-h-[48px] cursor-pointer items-center gap-3 rounded-xl px-3 text-[16px] text-gray-800 transition-colors sm:min-h-[36px] sm:text-[12px] ${checked ? 'bg-white shadow-sm' : ''
                }`}
            >
              <input
                type="radio"
                name="close-reason"
                className="h-5 w-5 accent-[#E89B5A] sm:h-4 sm:w-4"
                checked={checked}
                onChange={() => {
                  onCustomChange(false);
                  onReasonChange(r);
                }}
              />
              {r}
            </label>
          );
        })}
        <label
          className={`flex min-h-[48px] cursor-pointer items-center gap-3 rounded-xl px-3 text-[16px] text-gray-800 transition-colors sm:min-h-[36px] sm:text-[12px] ${isCustom ? 'bg-white shadow-sm' : ''
            }`}
        >
          <input
            type="radio"
            name="close-reason"
            className="h-5 w-5 accent-[#E89B5A] sm:h-4 sm:w-4"
            checked={isCustom}
            onChange={() => {
              onCustomChange(true);
              onReasonChange('');
            }}
          />
          Khác (nhập lý do)
        </label>
      </div>

      {isCustom && (
        <textarea
          rows={2}
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          placeholder="Nhập lý do..."
          className="mb-2 w-full resize-none rounded-xl border border-gray-200 p-3 text-[16px] outline-none focus:border-red-400 sm:rounded-[8px] sm:p-2 sm:text-[12px]"
          autoFocus
        />
      )}

      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={isClosing}
          className="h-12 rounded-xl bg-gray-100 text-[16px] font-semibold text-gray-700 transition-colors active:bg-gray-200 sm:h-auto sm:rounded-md sm:px-3.5 sm:py-1.5 sm:text-[12px] sm:hover:bg-gray-200"
        >
          Hủy
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isClosing || !reason.trim()}
          className="h-12 rounded-xl bg-red-600 text-[16px] font-bold text-white transition-colors active:bg-red-700 disabled:opacity-60 sm:h-auto sm:rounded-md sm:px-4 sm:py-1.5 sm:text-[12px] sm:hover:bg-red-700"
        >
          {isClosing ? 'Đang đóng...' : 'Xác nhận đóng'}
        </button>
      </div>
    </div>
  </ResponsiveModal>
);

/* =============================================================================
   BOARD
   ============================================================================= */
export const ApplicationKanbanBoard: React.FC = () => {
  const { items, isLoading, movingIds } = useApplicationList();
  const { filter } = useApplicationFilter();
  const { fetchApplications, moveApplication } = useApplicationActions();
  const { getTagColor, setTagColor } = useTagColorStore();
  const markViewed = useViewedApplicationStore((s) => s.markViewed);
  const { me } = useShelterTeam();
  const { fetchMe } = useShelterTeamActions();
  const isAdmin = useIsShelterAdmin();
  const [replacePetApp, setReplacePetApp] = useState<AdoptionApplication | null>(null);
  useEffect(() => {
    if (!me) fetchMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [quickViewApp, setQuickViewApp] = useState<AdoptionApplication | null>(null);
  const [localItems, setLocalItems] = useState<AdoptionApplication[]>(items);
  const isDraggingRef = useRef(false);
  const justDraggedRef = useRef(false);

  // States modal
  const [approveApp, setApproveApp] = useState<AdoptionApplication | null>(null);
  const [interviewApp, setInterviewApp] = useState<AdoptionApplication | null>(null);
  const [needInfoApp, setNeedInfoApp] = useState<AdoptionApplication | null>(null);
  const [pendingApp, setPendingApp] = useState<AdoptionApplication | null>(null);
  const [requestDocsApp, setRequestDocsApp] = useState<AdoptionApplication | null>(null);
  const [pendingRequiredDocs, setPendingRequiredDocs] = useState<RequiredDocument[]>([]);
  const [closeAppTarget, setCloseAppTarget] = useState<AdoptionApplication | null>(null);
  const [deleteAppTarget, setDeleteAppTarget] = useState<AdoptionApplication | null>(null);
  const [closeReason, setCloseReason] = useState('');
  const [isClosingApp, setIsClosingApp] = useState(false);
  const [isCustomCloseReason, setIsCustomCloseReason] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const [isScrollable, setIsScrollable] = useState(false);
  const [activeColIdx, setActiveColIdx] = useState(0);
  const user = getUserFromToken();
  const socket = useWebsocket(undefined, user?.shelterId);

  useEffect(() => {
    if (closeAppTarget) {
      setIsCustomCloseReason(false);
      setCloseReason(CLOSE_REASONS[0]);
    }
  }, [closeAppTarget]);

  // Lắng nghe realtime để tự reload lại danh sách đơn trên Kanban
  useEffect(() => {
    if (!socket) return;

    const handleRealtimeUpdate = () => {
      fetchApplications();
    };

    socket.on('documents_requested', handleRealtimeUpdate);
    socket.on('document_submitted', handleRealtimeUpdate);
    socket.on('document_reviewed', handleRealtimeUpdate);
    socket.on('document_removed', handleRealtimeUpdate);
    socket.on('application_updated', handleRealtimeUpdate);
    socket.on('application_deleted', handleRealtimeUpdate);

    return () => {
      socket.off('documents_requested', handleRealtimeUpdate);
      socket.off('document_submitted', handleRealtimeUpdate);
      socket.off('document_reviewed', handleRealtimeUpdate);
      socket.off('document_removed', handleRealtimeUpdate);
      socket.off('application_updated', handleRealtimeUpdate);
      socket.off('application_deleted', handleRealtimeUpdate);
    };
  }, [socket, fetchApplications]);

  const formattedItems = useMemo(() => {
    return localItems.map((app: any) => ({
      ...app,
      tags: app.tags
        ? app.tags.map((t: any) => {
          const base = t && typeof t === 'object' && t.tag
            ? { ...t.tag, id: t.tag.id || t.id, color: t.tag.color || t.color }
            : t;
          const syncedColor = getTagColor(base?.name) || base?.color;
          return { ...base, color: syncedColor };
        })
        : [],
    }));
  }, [localItems, getTagColor]);

  useEffect(() => {
    items.forEach((app: any) => {
      (app.tags || []).forEach((t: any) => {
        const tagObj = t?.tag || t;
        if (tagObj?.name && tagObj?.color) {
          setTagColor(tagObj.name, tagObj.color);
        }
      });
    });
  }, [items, setTagColor]);

  useEffect(() => {
    if (!isDraggingRef.current) {
      setLocalItems(items);
    }
  }, [items]);

  const [activeApp, setActiveApp] = useState<AdoptionApplication | null>(null);
  const [selectedApp, setSelectedApp] = useState<AdoptionApplication | null>(null);
  const [overColumn, setOverColumn] = useState<ApplicationStatus | null>(null);
  const [profileApp, setProfileApp] = useState<AdoptionApplication | null>(null);
  const [documentsApp, setDocumentsApp] = useState<AdoptionApplication | null>(null);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const REQUIRES_CONFIRM: ApplicationStatus[] = ['CLOSED'];

  // Chuột: kéo là chạy (8px). Cảm ứng: PHẢI nhấn giữ ~220ms mới kéo thẻ,
  // nên vuốt nhanh vẫn cuộn bảng / cuộn cột bình thường.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } })
  );

  const collisionDetection: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);
    const dock = pointerCollisions.find((c) => String(c.id).startsWith('dock-'));
    if (dock) return [dock];
    if (pointerCollisions.length > 0) {
      const cardCollision = pointerCollisions.find((c) => !isColumnId(c.id));
      if (cardCollision) return [cardCollision];
      return pointerCollisions;
    }
    return rectIntersection(args);
  };

  const columns = useMemo(() => {
    const filtered = selectFilteredApplications(formattedItems, filter.search, filter.noteTypes, filter.datePreset);
    return KANBAN_COLUMNS.map((col) => ({
      ...col,
      applications: filtered.filter((a) => mergeAdoptionIntoApproved(a.status) === col.status),
    }));
  }, [formattedItems, filter.search, filter.noteTypes, filter.datePreset]);

  useEffect(() => {
    const checkScrollable = () => {
      if (scrollContainerRef.current) {
        const { scrollWidth, clientWidth } = scrollContainerRef.current;
        setIsScrollable(scrollWidth > clientWidth);
      }
    };
    const timer = setTimeout(checkScrollable, 100);
    window.addEventListener('resize', checkScrollable);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkScrollable);
    };
  }, [columns]);

  // ---- Mobile: theo dõi cột đang hiển thị + chip chuyển cột ----
  const handleBoardScroll = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const el = scrollContainerRef.current;
      if (!el) return;
      const kids = Array.from(el.children) as HTMLElement[];
      let best = 0;
      let bestDist = Infinity;
      kids.forEach((k, i) => {
        const d = Math.abs(k.offsetLeft - BOARD_PAD_LEFT - el.scrollLeft);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      setActiveColIdx(best);
    });
  }, []);

  const scrollToColumn = (index: number) => {
    const el = scrollContainerRef.current;
    const kid = el?.children[index] as HTMLElement | undefined;
    if (!el || !kid) return;
    el.scrollTo({ left: Math.max(0, kid.offsetLeft - BOARD_PAD_LEFT), behavior: 'smooth' });
  };

  // Giữ chip đang chọn luôn nằm giữa thanh chip
  useEffect(() => {
    const chip = chipsRef.current?.children[activeColIdx] as HTMLElement | undefined;
    const bar = chipsRef.current;
    if (!chip || !bar) return;
    bar.scrollTo({
      left: chip.offsetLeft - (bar.clientWidth - chip.clientWidth) / 2,
      behavior: 'smooth',
    });
  }, [activeColIdx]);

  useEffect(() => {
    if (approveApp) {
      const fresh = items.find((a) => a.id === approveApp.id);
      if (fresh && fresh !== approveApp) {
        setApproveApp(fresh);
      }
    }
  }, [items, approveApp]);

  useEffect(() => {
    if (interviewApp) {
      const fresh = items.find((a) => a.id === interviewApp.id);
      if (fresh && fresh !== interviewApp) {
        setInterviewApp(fresh);
      }
    }
  }, [items, interviewApp]);
  useEffect(() => {
    if (!pendingApp) return;
    const fresh = items.find((a) => a.id === pendingApp.id);
    if (fresh && fresh !== pendingApp) setPendingApp(fresh);
  }, [items, pendingApp]);

  useEffect(() => {
    if (!needInfoApp) return;
    const fresh = items.find((a) => a.id === needInfoApp.id);
    if (fresh && fresh !== needInfoApp) setNeedInfoApp(fresh);
  }, [items, needInfoApp]);

  const handleDragStart = (event: DragStartEvent) => {
    isDraggingRef.current = true;
    // Rung nhẹ khi "nhấc" thẻ lên (Android; iOS Safari bỏ qua)
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(8);
    }
    const app = localItems.find((a) => a.id === event.active.id);
    setActiveApp(app ?? null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) {
      setOverColumn(null);
      return;
    }

    const activeId = active.id as string;
    const overId = resolveOverId(over.id);
    if (activeId === overId) return;

    const activeItem = localItems.find((a) => a.id === activeId);
    if (!activeItem) return;

    const overIsColumn = isColumnId(overId);
    const overItem = localItems.find((a) => a.id === overId);
    const targetStatus = overIsColumn
      ? (overId as ApplicationStatus)
      : (overItem ? mergeAdoptionIntoApproved(overItem.status) : undefined);
    if (!targetStatus) return;

    setOverColumn(targetStatus);
    setLocalItems((prev) => {
      const oldIndex = prev.findIndex((a) => a.id === activeId);
      if (oldIndex === -1) return prev;

      if (mergeAdoptionIntoApproved(activeItem.status) === targetStatus && !overIsColumn && overItem) {
        const newIndex = prev.findIndex((a) => a.id === overId);
        if (newIndex === -1 || newIndex === oldIndex) return prev;
        return arrayMove(prev, oldIndex, newIndex);
      }

      if (mergeAdoptionIntoApproved(activeItem.status) !== targetStatus) {
        const next = [...prev];
        next[oldIndex] = { ...next[oldIndex], status: targetStatus };
        if (!overIsColumn && overItem) {
          const newIndex = next.findIndex((a) => a.id === overId);
          return arrayMove(next, oldIndex, newIndex);
        }
        return next;
      }
      return prev;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    isDraggingRef.current = false;
    justDraggedRef.current = true;
    setTimeout(() => { justDraggedRef.current = false; }, 200);

    setActiveApp(null);

    const activeId = active.id as string;
    const originalItem = items.find((a) => a.id === activeId);

    let finalStatus: ApplicationStatus | undefined;

    if (over) {
      const overId = over.id as string;
      if (overId === activeId) {
        finalStatus = overColumn ?? undefined;
      } else {
        const overIsColumn = isColumnId(overId);
        const overItem = items.find((a) => a.id === overId);
        finalStatus = overIsColumn
          ? (overId as ApplicationStatus)
          : (overItem ? mergeAdoptionIntoApproved(overItem.status) : undefined);
      }
    }

    setOverColumn(null);

    if (!over || !originalItem || !finalStatus || finalStatus === mergeAdoptionIntoApproved(originalItem.status)) {
      setLocalItems(items);
      return;
    }

    if (finalStatus === 'NEED_MORE_INFO') {
      setRequestDocsApp(originalItem);
      return;
    }

    if (finalStatus === 'INTERVIEW_SCHEDULED') {
      setInterviewApp(originalItem);
      return;
    }

    if (REQUIRES_CONFIRM.includes(finalStatus)) {
      if (!isAdmin) {
        setLocalItems(items);
        return;
      }
      setCloseAppTarget(originalItem);
      return;
    }

    moveApplication(activeId, finalStatus);
  };

  // Kéo bị huỷ (thả ra ngoài / hệ thống ngắt) → trả state về như cũ
  const handleDragCancel = () => {
    isDraggingRef.current = false;
    setActiveApp(null);
    setOverColumn(null);
    setLocalItems(items);
  };

  const handleCardClick = (app: AdoptionApplication) => {
    if (justDraggedRef.current) return;
    markViewed(app.id);
    if (app.status === 'NEED_MORE_INFO') {
      setNeedInfoApp(app);
      return;
    }

    // Cột mới nộp / đang xem xét / đã duyệt / đóng → cùng một modal
    if (PENDING_STYLE_MODAL_STATUSES.includes(app.status)) {
      setPendingApp(app);
      return;
    }

    const nextStatus = NEXT_STATUS_MAP[app.status];
    switch (nextStatus) {
      case 'INTERVIEW_SCHEDULED':
        setInterviewApp(app);
        return;
      case 'APPROVED':
        setApproveApp(app);
        return;
      default:
        setSelectedApp(app);
    }
  };

  const handleConfirmClose = async () => {
    if (!closeAppTarget) return;
    try {
      setIsClosingApp(true);
      await moveApplication(closeAppTarget.id, 'CLOSED', closeReason.trim() || 'Trạm đã đóng hồ sơ.');
      await fetchApplications();
      setCloseAppTarget(null);
      setCloseReason('');
    } catch (error) {
      console.error('Lỗi khi đóng hồ sơ:', error);
      alert('Không thể đóng đơn nhận nuôi. Vui lòng thử lại.');
    } finally {
      setIsClosingApp(false);
    }
  };
  const handleConfirmDelete = async () => {
    if (!deleteAppTarget) return;
    const id = deleteAppTarget.id;
    await applicationService.deleteApplication(id); // lỗi sẽ ném ra → modal tự hiện message
    setLocalItems((prev) => prev.filter((a) => a.id !== id));
    setDeleteAppTarget(null);
    fetchApplications();
  };
  const handleCompleteAdoption = async (applicationId: string) => {
    try {
      await applicationService.updateStatus(applicationId, 'ADOPTION_COMPLETED');
      await fetchApplications();
      setApproveApp(null);
    } catch (error) {
      console.error('Lỗi khi hoàn tất nhận nuôi:', error);
      alert('Không thể hoàn tất nhận nuôi. Vui lòng thử lại.');
    }
  };

  return (
    // `h-app-screen` định nghĩa trong globals.mobile.css (đã trừ top bar + tab bar + safe-area)
    <div className="flex flex-col w-full h-app-screen overflow-hidden gap-2 pb-1">

      {/* 1. Header — mobile: large title kiểu iOS, filter bar xuống dòng riêng */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between flex-shrink-0 w-full px-1">
        <h1 className="font-['Be_Vietnam_Pro',_sans-serif] text-[28px] leading-[1.1] sm:text-[22px] lg:text-[24px] text-[#0D062D] font-bold tracking-tight">
          Đăng ký nhận nuôi
        </h1>
        <ApplicationFilterBar />
      </div>

      {/* 1b. Mobile: chip chuyển nhanh giữa các cột */}
      {!isLoading && (
        <div className="md:hidden flex-shrink-0">
          <div
            ref={chipsRef}
            role="tablist"
            aria-label="Các cột trạng thái"
            className="no-scrollbar relative flex gap-2 overflow-x-auto px-1 py-0.5"
          >
            {columns.map((col, i) => {
              const active = i === activeColIdx;
              return (
                <button
                  key={col.status}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => scrollToColumn(i)}
                  className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition-all duration-200 active:scale-95 ${active ? 'bg-[#0D062D] text-white shadow-sm' : 'bg-black/[0.05] text-[#6B6B70]'
                    }`}
                >
                  {col.label}
                  <span
                    className={`min-w-[20px] rounded-full px-1.5 text-center text-[11px] font-bold leading-[18px] ${active ? 'bg-white/20 text-white' : 'bg-black/[0.06] text-[#6B6B70]'
                      }`}
                  >
                    {col.applications.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Vùng chứa Kanban Board */}
      <div className="flex-1 min-h-0 w-full relative">
        {isLoading && localItems.length === 0 ? (
          <div className="flex gap-3 w-full h-full overflow-x-auto px-4 md:px-0 pb-1">
            {KANBAN_COLUMNS.map((col) => (
              <div
                key={col.status}
                className="w-[calc(100vw-3.5rem)] max-w-[340px] sm:w-[290px] lg:w-[310px] flex-shrink-0 h-full rounded-[18px] bg-gray-100/70 animate-pulse border border-gray-200"
              />
            ))}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={collisionDetection}
            measuring={{ droppable: { strategy: MeasuringStrategy.WhileDragging } }}
            autoScroll={{ acceleration: 30, interval: 4, threshold: { x: 0.24, y: 0.12 } }}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div
              ref={scrollContainerRef}
              onScroll={handleBoardScroll}
              className={`relative flex gap-3 sm:gap-3.5 overflow-x-auto items-stretch h-full w-full px-4 md:px-0 pb-1 custom-board-scroll overscroll-x-contain ${activeApp ? '' : 'snap-x snap-mandatory'
                } md:snap-none`}
            >
              {columns.map((col) => (
                <div
                  key={col.status}
                  className="w-[calc(100vw-3.5rem)] max-w-[340px] sm:w-[290px] lg:w-[310px] flex-shrink-0 h-full flex flex-col snap-start"
                >
                  <ApplicationColumn
                    status={col.status}
                    label={col.label}
                    applications={col.applications}
                    movingIds={movingIds}
                    isDropTarget={overColumn === col.status && activeApp?.status !== col.status}
                    onOpenDetail={(app) => { markViewed(app.id); setSelectedApp(app); }}
                    onCardClick={handleCardClick}
                    onOpenProfile={(app) => { markViewed(app.id); setProfileApp(app); }}
                    onRemove={(app) => { if (isAdmin) setDeleteAppTarget(app); }}
                    onOpenDocuments={(app) => { markViewed(app.id); setDocumentsApp(app); }}
                    onOpenQuickView={(app) => { markViewed(app.id); setQuickViewApp(app); }}
                  />
                </div>
              ))}
              {/* Đệm cuối để cột cuối cùng cũng căn được về mép trái khi snap */}
              <div className="w-1 shrink-0 md:hidden" aria-hidden />
            </div>

            <DragOverlay dropAnimation={dropAnimation}>
              {activeApp ? (
                <div className="bg-white border border-gray-200 rounded-[12px] shadow-2xl w-[calc(100vw-4.5rem)] max-w-[300px] sm:w-[290px] p-2.5 rotate-[1.5deg] scale-[1.02] cursor-grabbing pointer-events-none will-change-transform">
                  <ApplicationCardContent
                    application={activeApp}
                    onOpenProfile={() => { }}
                    onOpenDetail={() => { }}
                    onRemove={() => { }}
                    onOpenDocuments={() => { }}
                  />
                </div>
              ) : null}
            </DragOverlay>
            {activeApp && (
              <div className="md:hidden fixed inset-x-0 z-[70] px-3 bottom-[calc(var(--tabbar-h,56px)+env(safe-area-inset-bottom)+8px)] animate-in fade-in slide-in-from-bottom-4 duration-150">
                <div className="flex flex-wrap justify-center gap-2 rounded-[28px] bg-black/70 p-2.5 backdrop-blur-xl">
                  {columns
                    .filter((c) => c.status !== mergeAdoptionIntoApproved(activeApp.status))
                    .map((c) => (
                      <DockChip key={c.status} status={c.status} label={c.label} count={c.applications.length} />
                    ))}
                </div>
              </div>
            )}
          </DndContext>
        )}
      </div>

      {/* 3. Hint Scroll — chỉ desktop (mobile đã có chip + vuốt ngang) */}
      {!isLoading && isScrollable && (
        <div className="hidden md:flex justify-end w-full px-2 flex-shrink-0 -mt-1">
          <p className="text-[10px] sm:text-[11px] text-gray-400 flex items-center gap-1 italic">
            Mẹo: Giữ
            <kbd className="font-sans font-bold border border-gray-200 rounded px-1 bg-gray-50 text-[9px] not-italic text-gray-600">
              Shift
            </kbd>
            + cuộn chuột ngang
          </p>
        </div>
      )}

      {/* Modals */}
      {closeAppTarget && (
        <CloseApplicationDialog
          application={closeAppTarget}
          reason={closeReason}
          isCustom={isCustomCloseReason}
          isClosing={isClosingApp}
          onReasonChange={setCloseReason}
          onCustomChange={setIsCustomCloseReason}
          onCancel={() => setCloseAppTarget(null)}
          onConfirm={handleConfirmClose}
        />
      )}
      {deleteAppTarget && (
        <DeleteApplicationModal
          application={deleteAppTarget}
          onClose={() => setDeleteAppTarget(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
      {selectedApp && (
        <ApplicationDetailModal
          application={selectedApp}
          onClose={() => { setSelectedApp(null); fetchApplications(); }}
        />
      )}
      {profileApp && <ApplicantProfileModal application={profileApp} onClose={() => setProfileApp(null)} />}
      {documentsApp && <AllDocumentsModal application={documentsApp} onClose={() => setDocumentsApp(null)} />}
      {pendingApp && (
        <MoveToPendingModal
          application={pendingApp}
          onClose={() => { setPendingApp(null); fetchApplications(); }}
          onRefresh={fetchApplications}
          onSubmit={async (data) => {
            await moveApplication(pendingApp.id, 'PENDING', data?.reviewNote);
            await fetchApplications();
            setPendingApp(null);
          }}
          onReplacePet={setReplacePetApp}
        />
      )}
      {quickViewApp && (
        <ApplicationQuickViewModal
          application={quickViewApp}
          onClose={() => { setQuickViewApp(null); fetchApplications(); }}
          onRefresh={fetchApplications}
        />
      )}
      {interviewApp && (
        <InterviewScheduleModal
          application={interviewApp}
          onClose={() => { setInterviewApp(null); fetchApplications(); }}
          onRefresh={fetchApplications}
          onSubmit={async (data) => {
            const res = await applicationService.scheduleAppointment(interviewApp.id, data);
            await fetchApplications();
            setInterviewApp(null);
            return res;
          }}
          onReplacePet={setReplacePetApp}
        />
      )}
      {approveApp && (
        <ApproveApplicationModal
          application={approveApp}
          onClose={() => { setApproveApp(null); fetchApplications(); }}
          onRefresh={fetchApplications}
          onCompleteAdoption={handleCompleteAdoption}
          onScheduleInterview={async (id, d) => {
            const res = await applicationService.scheduleAppointment(id, d);
            await fetchApplications();
            return res;
          }}
          onSubmit={async (data) => {
            await moveApplication(approveApp.id, 'APPROVED', data?.reviewNote);
            await fetchApplications();
            setApproveApp(null);
          }}
          onReplacePet={setReplacePetApp}
        />
      )}
      {requestDocsApp && (
        <RequestDocumentsModal
          application={requestDocsApp}
          onClose={() => { setRequestDocsApp(null); fetchApplications(); }}
          onNext={(documents) => {
            setPendingRequiredDocs(documents);
            setNeedInfoApp(requestDocsApp);
            setRequestDocsApp(null);
          }}
        />
      )}
      {needInfoApp && (
        <NeedMoreInfoModal
          application={needInfoApp}
          initialDocuments={pendingRequiredDocs}
          socket={socket}
          onClose={() => { setNeedInfoApp(null); setPendingRequiredDocs([]); fetchApplications(); }}
          onRefresh={fetchApplications}
          onMoveToInterview={() => {
            setInterviewApp(needInfoApp);
            setNeedInfoApp(null);
            setPendingRequiredDocs([]);
          }}
          onReplacePet={setReplacePetApp}
        />
      )}
      {replacePetApp && (
        <ReplacePetModal
          application={replacePetApp}
          onClose={() => setReplacePetApp(null)}
          onDone={fetchApplications}
        />
      )}
      <style jsx>{`
        .custom-board-scroll {
          scrollbar-width: thin;
          scrollbar-color: #E89B5A transparent;
        }
        .custom-board-scroll::-webkit-scrollbar {
          height: 5px;
        }
        .custom-board-scroll::-webkit-scrollbar-thumb {
          background-color: #E89B5A;
          border-radius: 10px;
        }
        /* Mobile: ẩn thanh cuộn ngang (đã có chip + peek cột kế bên) */
        @media (max-width: 767px) {
          .custom-board-scroll {
            scrollbar-width: none;
          }
          .custom-board-scroll::-webkit-scrollbar {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};