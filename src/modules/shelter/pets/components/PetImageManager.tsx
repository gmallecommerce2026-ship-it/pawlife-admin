'use client';

import React from 'react';
import { Star, X, Plus } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
  images: string[];
  onChange: (next: string[]) => void;
  onAdd?: () => void;
  disabled?: boolean;
}

interface ItemProps {
  url: string;
  index: number;
  images: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}

const SortableImage: React.FC<ItemProps> = ({ url, index, images, onChange, disabled }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: url,
    disabled,
  });

  const isMain = index === 0;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 20 : undefined,
      }}
      {...attributes}
      {...listeners}
      className={`group relative aspect-square rounded-xl overflow-hidden border-2 bg-gray-100 select-none
        [-webkit-touch-callout:none]
        ${disabled ? '' : 'cursor-grab active:cursor-grabbing'}
        ${isMain ? 'border-[#E89B5A]' : 'border-transparent'}
        ${isDragging ? 'opacity-70 shadow-xl scale-105' : ''}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        draggable={false}
        className="w-full h-full object-cover pointer-events-none"
      />

      {isMain && (
        <span className="absolute left-1 top-1 rounded-full bg-[#E89B5A] px-2 py-0.5 text-[9px] font-bold text-white shadow">
          Ảnh chính
        </span>
      )}

      {!disabled && (
        <div className="absolute right-1 top-1 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          {!isMain && (
            <button
              type="button"
              title="Đặt làm ảnh chính"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onChange(arrayMove(images, index, 0))}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-[#E89B5A] shadow"
            >
              <Star size={14} />
            </button>
          )}
          <button
            type="button"
            title="Xoá ảnh"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onChange(images.filter((_, i) => i !== index))}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-red-500 shadow"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export const PetImageManager: React.FC<Props> = ({ images, onChange, onAdd, disabled }) => {
  const sensors = useSensors(
    // Chuột: kéo ~5px mới bắt đầu, để bấm nút không bị nhầm thành kéo
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    // Cảm ứng: nhấn giữ 200ms mới kéo, để vuốt cuộn trang vẫn bình thường
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = images.indexOf(String(active.id));
    const to = images.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    onChange(arrayMove(images, from, to));
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] text-[#8E8E93]">
        Kéo thả để sắp xếp (trên điện thoại: nhấn giữ rồi kéo). Ảnh đầu tiên là ảnh chính.
      </p>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={images} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-4 gap-2">
            {images.map((url, i) => (
              <SortableImage
                key={url}
                url={url}
                index={i}
                images={images}
                onChange={onChange}
                disabled={disabled}
              />
            ))}

            {onAdd && !disabled && (
              <button
                type="button"
                onClick={onAdd}
                title="Thêm ảnh"
                className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-[#E89B5A] hover:text-[#E89B5A] transition-colors"
              >
                <Plus size={20} />
              </button>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};