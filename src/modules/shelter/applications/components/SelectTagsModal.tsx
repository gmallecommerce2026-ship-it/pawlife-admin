'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Check,
  Plus,
  Home,
  PawPrint,
  Stethoscope,
  CheckCircle2,
  UserCheck,
  Building2,
} from 'lucide-react';
import { ApplicationTag } from '@/types/application';
import { useTagColorStore } from '@/stores/useTagColorStore';

// Danh sách 18 màu sắc chuẩn theo 2 hàng
export const TAG_COLOR_PALETTE = [
  // Hàng 1
  '#4B5563', '#EF4444', '#F97316', '#E89B5A', '#EAB308', '#84CC16', '#22C55E', '#14B8A6', '#06B6D4',
  // Hàng 2
  '#38BDF8', '#3B82F6', '#2563EB', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF', '#EC4899', '#F43F5E',
];

export interface PresetTagOption {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
}

export const PRESET_TAGS: PresetTagOption[] = [
  { id: 'has_yard', name: 'Có sân vườn', icon: Home, color: '#16A34A' },
  { id: 'has_other_pets', name: 'Có thú cưng khác', icon: PawPrint, color: '#885BF2' },
  { id: 'medical_questions', name: 'Có vấn đề sức khoẻ', icon: Stethoscope, color: '#D6447A' },
  { id: 'verified_info', name: 'Thông tin đã xác minh', icon: CheckCircle2, color: '#2563EB' },
  { id: 'experienced_adopter', name: 'Người nhận nuôi có kinh nghiệm', icon: UserCheck, color: '#E89B5A' },
  { id: 'home_visit', name: 'Cần thăm nhà', icon: Building2, color: '#F97316' },
];

interface SelectTagsModalProps {
  triggerRef: React.RefObject<HTMLElement | null>;
  existingTags: ApplicationTag[];
  onClose: () => void;
  onAddTag: (tag: { name: string; color: string }) => Promise<void> | void;
  onRemoveTag: (tagName: string) => Promise<void> | void;
}

export const SelectTagsModal: React.FC<SelectTagsModalProps> = ({
  triggerRef,
  existingTags,
  onClose,
  onAddTag,
  onRemoveTag,
}) => {
  const [mounted, setMounted] = useState(false);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customTagName, setCustomTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(TAG_COLOR_PALETTE);
  const [coords, setCoords] = useState<{ top: number; left: number; placeAbove: boolean; maxHeight: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { getTagColor, setTagColor } = useTagColorStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Đồng bộ 1 lần: nạp màu preset mặc định vào store nếu tag đó chưa có màu được lưu
  // (giúp lần đầu tạo tag preset vẫn thống nhất màu ngay từ store)
  useEffect(() => {
    PRESET_TAGS.forEach((preset) => {
      if (!getTagColor(preset.name)) {
        setTagColor(preset.name, preset.color);
      }
    });
    // Đồng bộ luôn màu của các tag đang tồn tại trên đơn (trường hợp BE đã gán màu riêng)
    existingTags.forEach((t: any) => {
      if (t?.name && t?.color) {
        setTagColor(t.name, t.color);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tính toán vị trí và giới hạn chiều cao tối đa không vượt qua mép màn hình
  useEffect(() => {
    const updatePosition = () => {
      if (!triggerRef?.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const dropdownWidth = 320;
      const vpHeight = window.innerHeight;
      const vpWidth = window.innerWidth;
      const margin = 12; // Khoảng đệm an toàn cách mép màn hình

      // Ước tính chiều cao popup khi ở chế độ tạo custom tag vs bình thường
      const targetHeight = isCustomMode ? 380 : 290;
      const spaceBelow = vpHeight - rect.bottom - margin;
      const spaceAbove = rect.top - margin;

      // Ưu tiên lật lên trên nếu phía dưới không đủ chỗ nhưng phía trên rộng hơn
      const placeAbove = spaceBelow < targetHeight && spaceAbove > spaceBelow;

      let top = 0;
      let maxHeight = 0;

      if (placeAbove) {
        top = Math.max(margin, rect.top - 6);
        maxHeight = Math.min(spaceAbove, 440);
      } else {
        top = rect.bottom + 6;
        maxHeight = Math.min(spaceBelow, 440);
      }

      let left = rect.right - dropdownWidth;
      if (left < margin) left = margin;
      if (left + dropdownWidth > vpWidth - margin) {
        left = vpWidth - dropdownWidth - margin;
      }

      setCoords({ top, left, placeAbove, maxHeight });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [triggerRef, isCustomMode]);

  // Tự động đóng khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        triggerRef?.current &&
        !triggerRef.current.contains(target)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, triggerRef]);

  const handleTogglePreset = async (preset: PresetTagOption) => {
    const isSelected = existingTags.some(
      (t) => t.name.toLowerCase() === preset.name.toLowerCase()
    );
    // Lấy màu đã lưu trong store (nếu người dùng từng đổi màu tag này) thay vì luôn dùng màu mặc định
    const colorToUse = getTagColor(preset.name) || preset.color;

    if (isSelected) {
      await onRemoveTag(preset.name);
    } else {
      setTagColor(preset.name, colorToUse);
      await onAddTag({ name: preset.name, color: colorToUse });
    }
  };

  const handleCreateCustomTag = async () => {
    const trimmed = customTagName.trim();
    if (!trimmed) return;

    // Nếu tag trùng tên với 1 tag đã có màu lưu sẵn, ưu tiên dùng lại màu đó để đồng bộ
    const colorToUse = getTagColor(trimmed) || selectedColor;

    setTagColor(trimmed, colorToUse);
    await onAddTag({ name: trimmed, color: colorToUse });
    setCustomTagName('');
    setIsCustomMode(false);
  };

  if (!mounted || !coords) return null;

  return createPortal(
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        transform: coords.placeAbove ? 'translateY(-100%)' : 'none',
        maxHeight: `${coords.maxHeight}px`,
        zIndex: 99999,
      }}
      className="w-[310px] sm:w-[325px] bg-white rounded-[22px] shadow-2xl border border-gray-100 p-4 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-150 font-sans overflow-y-auto custom-scrollbar"
    >
      {/* Tiêu đề */}
      <div className="flex items-center justify-between pb-0.5 shrink-0">
        <h2 className="text-[15px] font-bold text-gray-900 leading-none">
          Chọn nhãn
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700 transition-colors p-1 -mr-1"
        >
          <X size={16} />
        </button>
      </div>

      {/* Danh sách Tag mặc định (tự thu gọn chiều cao khi mở phần chọn màu) */}
      <div
        className={`flex flex-col gap-1.5 overflow-y-auto custom-scrollbar pr-0.5 transition-all ${
          isCustomMode ? 'max-h-[120px]' : 'max-h-[180px]'
        }`}
      >
        {PRESET_TAGS.map((preset) => {
          const isSelected = existingTags.some(
            (t) => t.name.toLowerCase() === preset.name.toLowerCase()
          );
          const Icon = preset.icon;
          // Ưu tiên màu đã đồng bộ trong store để hiển thị nhất quán
          const displayColor = getTagColor(preset.name) || preset.color;

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleTogglePreset(preset)}
              className={`w-full min-h-[42px] px-3 py-2 rounded-[12px] border flex items-center justify-between transition-all text-left cursor-pointer ${
                isSelected
                  ? 'shadow-2xs'
                  : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
              style={
                isSelected
                  ? {
                      backgroundColor: `${displayColor}15`,
                      borderColor: `${displayColor}50`,
                      color: displayColor,
                    }
                  : undefined
              }
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  size={15}
                  className="shrink-0"
                  style={{ color: isSelected ? displayColor : '#6B7280' }}
                />
                <span className="text-[12.5px] font-semibold truncate">
                  {preset.name}
                </span>
              </div>
              {isSelected && (
                <Check
                  size={14}
                  strokeWidth={2.5}
                  className="shrink-0"
                  style={{ color: displayColor }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Phần Custom Tag: Nút nét đứt hoặc Form nhập tên & bảng 18 màu */}
      {!isCustomMode ? (
        <button
          type="button"
          onClick={() => setIsCustomMode(true)}
          className="w-full h-[42px] rounded-[12px] border border-dashed border-gray-300 hover:border-[#E89B5A] hover:text-[#E89B5A] text-gray-500 font-medium text-[12.5px] flex items-center justify-center gap-1.5 transition-all cursor-pointer bg-white shrink-0"
        >
          <Plus size={14} /> Tạo nhãn tuỳ chỉnh
        </button>
      ) : (
        <div className="flex flex-col gap-2.5 pt-1 border-t border-gray-100 animate-in fade-in duration-150 shrink-0">
          <div>
            <label className="text-[10px] font-bold text-gray-500 tracking-wider block mb-1 uppercase">
              TÊN NHÃN
            </label>
            <input
              autoFocus
              type="text"
              value={customTagName}
              onChange={(e) => setCustomTagName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateCustomTag();
                if (e.key === 'Escape') setIsCustomMode(false);
              }}
              placeholder="Nhập tên nhãn..."
              className="w-full border-2 border-[#E89B5A] rounded-[10px] px-3 py-1.5 text-[12.5px] text-gray-800 outline-none transition-colors placeholder:text-gray-400"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 tracking-wider block mb-1.5 uppercase">
              MÀU SẮC
            </label>
            <div className="grid grid-cols-9 gap-1 items-center">
              {TAG_COLOR_PALETTE.map((c) => {
                const isSelected = selectedColor === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-[20px] h-[20px] rounded-full transition-transform cursor-pointer relative ${
                      isSelected
                        ? 'scale-115 ring-2 ring-offset-1 ring-gray-600 shadow-xs'
                        : 'hover:scale-110 opacity-90 hover:opacity-100'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <button
              type="button"
              onClick={handleCreateCustomTag}
              disabled={!customTagName.trim()}
              className="flex-1 h-[38px] rounded-[10px] bg-[#FDBA74] hover:bg-[#E89B5A] text-white font-bold text-[12.5px] transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center cursor-pointer"
            >
              Tạo nhãn
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCustomMode(false);
                setCustomTagName('');
              }}
              className="w-[38px] h-[38px] rounded-[10px] bg-[#F3F4F6] hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
              title="Đóng"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};