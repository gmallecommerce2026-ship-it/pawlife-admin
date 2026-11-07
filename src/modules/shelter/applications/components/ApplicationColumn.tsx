'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { AdoptionApplication, ApplicationStatus } from '@/types/application';
import { ApplicationCard } from './ApplicationCard';
import { useAutoHeight } from '@/stores/useAutoHeight';

interface ApplicationColumnProps {
  status: ApplicationStatus;
  label: string;
  applications: AdoptionApplication[];
  movingIds: string[];
  isDropTarget: boolean;
  onOpenDetail: (app: AdoptionApplication) => void;
  onCardClick: (app: AdoptionApplication) => void;
  onOpenProfile: (app: AdoptionApplication) => void;
  onRemove: (app: AdoptionApplication) => void;
  onOpenDocuments: (app: AdoptionApplication) => void;
  onOpenQuickView: (app: AdoptionApplication) => void;
}

const COLUMN_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  SUBMITTED: { bg: 'bg-[#F7F7F7] bg-gradient-to-b from-[#F9FAFB] from-[5px] to-[#F4F4F4] to-[70px]', border: 'border-[#EAEAEA]', text: 'text-[#858585]' },
  PENDING: { bg: 'bg-[#F7F7F7] bg-gradient-to-b from-[#E8F1FF] from-[5px] to-[#F4F4F4] to-[70px]', border: 'border-[#E0E8FF]', text: 'text-[#5A90DA]' },
  NEED_MORE_INFO: { bg: 'bg-[#F7F7F7] bg-gradient-to-b from-[#FEFCE9] from-[5px] to-[#F4F4F4] to-[70px]', border: 'border-[#FDF0CC]', text: 'text-[#FFBA00]' },
  INTERVIEW_SCHEDULED: { bg: 'bg-[#F7F7F7] bg-gradient-to-b from-[#FAF5FF] from-[5px] to-[#F4F4F4] to-[70px]', border: 'border-[#F3E0FF]', text: 'text-[#5A1B8D]' },
  ADOPTION_COMPLETED: { bg: 'bg-[#F7F7F7] bg-gradient-to-b from-[#F0FDF4] from-[5px] to-[#F4F4F4] to-[70px]', border: 'border-[#D1F2D9]', text: 'text-[#236745]' },
  APPROVED: { bg: 'bg-[#F7F7F7] bg-gradient-to-b from-[#F0FDF4] from-[5px] to-[#F4F4F4] to-[70px]', border: 'border-[#D1F2D9]', text: 'text-[#236745]' },
  CLOSED: { bg: 'bg-[#F7F7F7] bg-gradient-to-b from-[#fb7f5e] from-[5px] to-[#F4F4F4] to-[70px]', border: 'border-[#EAEAEA]', text: 'text-[#c83c16]' },
};

export const ApplicationColumn: React.FC<ApplicationColumnProps> = ({
  status,
  label,
  applications,
  movingIds,
  isDropTarget,
  onOpenDetail,
  onCardClick,
  onOpenProfile,
  onRemove,
  onOpenDocuments,
  onOpenQuickView,
}) => {
  const { setNodeRef } = useDroppable({ id: status });
  const style = COLUMN_STYLES[status] || COLUMN_STYLES.SUBMITTED;

  // Đo chiều cao thật của khu vực chứa item, để container ngoài animate height mượt
  // mỗi khi số lượng item trong cột thay đổi (thêm/bớt/kéo qua cột khác).
  const { contentRef, height } = useAutoHeight<HTMLDivElement>([
    applications.length,
    applications.map((a) => a.id).join(','),
  ]);

  return (
    <div
      ref={setNodeRef}
      // Thêm max-h: cột vẫn tự co giãn theo nội dung như trước, nhưng khi số item
      // vượt quá chiều cao này thì khu vực bên dưới sẽ cuộn nội bộ thay vì đẩy cả
      // board cao vô hạn. Đồng bộ mốc với skeleton loading (500px / 741px).
      className={`flex flex-col flex-1 min-h-0 basis-[260px] rounded-[18px] border transition-all duration-300 px-1.5 py-2.5 ${isDropTarget
        ? 'bg-[#e89b5a70] bg-gradient-to-b from-[#00000000] from-[45px] to-[#F7F7F7] to-[120px] border-[#e89b5a70] border-dashed'
        : `${style.bg} ${style.border}`
        }`}
    >
      {/* Header: cố định, không cuộn theo danh sách bên dưới */}
      <div className="flex justify-between items-center w-full h-[32px] mb-2.5 px-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`font-sans text-[16px] whitespace-nowrap leading-none font-semibold ${style.text}`}>
            {label}
          </span>
          {/* Badge số lượng item, hiện cho mọi cột kể cả khi = 0 */}
          <span
            className={`inline-flex items-center justify-center h-[20px] min-w-[20px] px-1.5 rounded-full bg-white/80 border border-black/5 text-[11px] font-bold leading-none shrink-0 ${style.text}`}
          >
            {applications.length}
          </span>
        </div>
        <button className="text-[#888888] hover:text-[#111111] transition-colors shrink-0">
          <Plus size={18} strokeWidth={1.8} />
        </button>
      </div>

      {/* Vùng cuộn: flex-1 + min-h-0 để co lại đúng theo max-h của cột cha (bắt
          buộc trong flexbox). `-mx-1.5 px-1.5` kéo vùng cuộn ra khớp mép ngoài
          của cột rồi đệm lại đúng bằng padding gốc (px-1.5) — nhờ vậy khi
          scrollbar (thin, chỉ hiện lúc hover) xuất hiện, nó nằm gọn trong đúng
          khoảng đệm cũ, KHÔNG cộng thêm không gian, 2 bên trái/phải luôn đối
          xứng như thiết kế ban đầu dù đang cuộn hay không. */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain kanban-scroll -mx-1.5 px-1.5">
        <SortableContext
          items={applications.map((a) => a.id)}
          strategy={verticalListSortingStrategy}
        >
          <div
            style={{ height }}
            className="w-full transition-[height] duration-300 ease-in-out overflow-hidden"
          >
            <div ref={contentRef} className="flex flex-col gap-2 w-full pb-2 items-center px-1">
              {applications.length > 0 ? (
                applications.map((app) => (
                  <ApplicationCard
                    key={app.id}
                    application={app}
                    isMoving={movingIds.includes(app.id)}
                    onOpenProfile={onOpenProfile}
                    onOpenDetail={onOpenDetail}
                    onCardClick={onCardClick}
                    onRemove={onRemove}
                    showMenu={true}
                    onOpenDocuments={onOpenDocuments}
                    onOpenQuickView={onOpenQuickView}
                  />
                ))
              ) : (
                // TRẠNG THÁI EMPTY (Chưa có đơn nào)
                <div className="w-full flex items-center justify-center p-1.5">
                  <div className="w-full h-[150px] rounded-[14px] border-2 border-dashed border-[#D4D4D4] flex items-center justify-center transition-colors">
                    <span className="text-[12px] font-medium text-[#A3A3A3] select-none">
                      Chưa có đơn nào
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </SortableContext>
      </div>

      <style jsx>{`
        .kanban-scroll {
          /* KHÔNG dùng scrollbar-gutter: stable nữa — nó reserve thêm không
             gian cố định gây lệch 2 bên. Nhờ trick -mx-1.5/px-1.5 ở trên,
             scrollbar giờ tự nằm trong đúng padding cũ nên không cần gutter. */
          scrollbar-width: thin; /* Firefox: thanh mỏng */
          scrollbar-color: transparent transparent; /* ẩn mặc định */
        }
        .kanban-scroll:hover {
          scrollbar-color: rgba(0, 0, 0, 0.18) transparent;
        }
        .kanban-scroll::-webkit-scrollbar {
          width: 4px; /* Chrome/Edge/Safari: siêu mỏng */
        }
        .kanban-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .kanban-scroll::-webkit-scrollbar-thumb {
          background-color: transparent;
          border-radius: 999px;
        }
        .kanban-scroll:hover::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.18);
        }
      `}</style>
    </div>
  );
};