'use client';

import React from 'react';
import { Sparkles, Copy, Sun, Moon } from 'lucide-react';

export interface OpeningHour {
  day: string;
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
  open?: string;
  close?: string;
  startTime?: string;
  endTime?: string;
}

interface OpeningHoursEditorProps {
  value: OpeningHour[];
  isEditing: boolean;
  onChange: (next: OpeningHour[]) => void;
}

const DAY_LABELS: Record<string, { short: string; full: string }> = {
  Monday: { short: 'T2', full: 'Thứ Hai' },
  Tuesday: { short: 'T3', full: 'Thứ Ba' },
  Wednesday: { short: 'T4', full: 'Thứ Tư' },
  Thursday: { short: 'T5', full: 'Thứ Năm' },
  Friday: { short: 'T6', full: 'Thứ Sáu' },
  Saturday: { short: 'T7', full: 'Thứ Bảy' },
  Sunday: { short: 'CN', full: 'Chủ Nhật' },
  'Thứ 2': { short: 'T2', full: 'Thứ Hai' },
  'Thứ 3': { short: 'T3', full: 'Thứ Ba' },
  'Thứ 4': { short: 'T4', full: 'Thứ Tư' },
  'Thứ 5': { short: 'T5', full: 'Thứ Năm' },
  'Thứ 6': { short: 'T6', full: 'Thứ Sáu' },
  'Thứ 7': { short: 'T7', full: 'Thứ Bảy' },
  'Chủ Nhật': { short: 'CN', full: 'Chủ Nhật' },
};

const INDEX_TO_DAY_KEY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Helper lấy giá trị thời gian hỗ trợ các biến thể tên trường
const getOpenVal = (item: OpeningHour) => item.openTime || item.startTime || item.open || '08:00';
const getCloseVal = (item: OpeningHour) => item.closeTime || item.endTime || item.close || '17:00';

export const OpeningHoursEditor: React.FC<OpeningHoursEditorProps> = ({
  value = [],
  isEditing,
  onChange,
}) => {
  const currentDayIndex = new Date().getDay();
  const todayKey = INDEX_TO_DAY_KEY[currentDayIndex];

  const getDayLabel = (dayKey: string) => {
    return DAY_LABELS[dayKey] || { short: dayKey, full: dayKey };
  };

  // Tính toán trạng thái Mở/Đóng cửa Live
  const getLiveStatus = () => {
    const todayData = value.find(
      (item) => item.day === todayKey || getDayLabel(item.day).full === getDayLabel(todayKey).full
    );
    if (!todayData || !todayData.isOpen) {
      return { status: 'closed', label: 'Hôm nay', color: 'bg-rose-50 text-rose-600 border-rose-200' };
    }

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const openStr = getOpenVal(todayData);
    const closeStr = getCloseVal(todayData);

    const [openH, openM] = openStr.split(':').map(Number);
    const [closeH, closeM] = closeStr.split(':').map(Number);

    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    if (currentMinutes >= openMinutes && currentMinutes <= closeMinutes) {
      return {
        status: 'open',
        label: `Đang mở cửa • Đóng cửa lúc ${closeStr}`,
        color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      };
    }

    return {
      status: 'closed',
      label: `Đã đóng cửa • Mở cửa lại lúc ${openStr}`,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
    };
  };

  // Tạo object OpeningHour chuẩn cho Backend DTO (Sử dụng openTime & closeTime)
  const createHourObj = (day: string, isOpen: boolean, openTime: string, closeTime: string): OpeningHour => {
    return {
      day,
      isOpen,
      openTime,
      closeTime,
    };
  };

  // Cài đặt nhanh
  const applyPreset = (presetType: 'standard' | 'allWeek' | 'weekdaysOnly') => {
    const next = value.map((item) => {
      const label = getDayLabel(item.day).short;
      if (presetType === 'standard') {
        const isWeekend = label === 'T7' || label === 'CN';
        return createHourObj(item.day, true, '08:00', isWeekend ? '12:00' : '17:00');
      } else if (presetType === 'allWeek') {
        return createHourObj(item.day, true, '08:00', '18:00');
      } else if (presetType === 'weekdaysOnly') {
        const isWeekend = label === 'T7' || label === 'CN';
        return createHourObj(item.day, !isWeekend, '08:00', '17:00');
      }
      return item;
    });
    onChange(next);
  };

  const toggleDay = (index: number) => {
    const next = [...value];
    const current = next[index];
    next[index] = createHourObj(
      current.day,
      !current.isOpen,
      getOpenVal(current),
      getCloseVal(current)
    );
    onChange(next);
  };

  const updateTime = (index: number, field: 'openTime' | 'closeTime', timeVal: string) => {
    const next = [...value];
    const current = next[index];
    const openTime = field === 'openTime' ? timeVal : getOpenVal(current);
    const closeTime = field === 'closeTime' ? timeVal : getCloseVal(current);

    next[index] = createHourObj(current.day, current.isOpen, openTime, closeTime);
    onChange(next);
  };

  const copyToAll = () => {
    if (!value.length) return;
    const first = value[0];
    const openTime = getOpenVal(first);
    const closeTime = getCloseVal(first);

    const next = value.map((item) =>
      createHourObj(item.day, item.isOpen, openTime, closeTime)
    );
    onChange(next);
  };

  const liveStatus = getLiveStatus();

  // --- CHẾ ĐỘ XEM (VIEW MODE) ---
  if (!isEditing) {
    return (
      <div className="w-full flex flex-col gap-4">
        {/* Live Status Badge */}
        {/* <div className="flex items-center justify-between bg-white/90 backdrop-blur-sm p-3 px-4 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  liveStatus.status === 'open' ? 'bg-emerald-400' : 'bg-rose-400'
                }`}
              ></span>
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  liveStatus.status === 'open' ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              ></span>
            </span>
            <span className="text-[13px] font-semibold text-gray-800">{liveStatus.label}</span>
          </div>
          <span className="text-[11px] font-medium text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
            Giờ địa phương
          </span>
        </div> */}

        {/* Grid 7 Ngày */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
          {value.map((item, idx) => {
            const dayMeta = getDayLabel(item.day);
            const isToday =
              item.day === todayKey || getDayLabel(item.day).full === getDayLabel(todayKey).full;
            const openVal = getOpenVal(item);
            const closeVal = getCloseVal(item);

            return (
              <div
                key={idx}
                className={`flex flex-col items-center justify-between p-3.5 rounded-2xl transition-all duration-200 border ${
                  isToday
                    ? 'bg-[#FFF8F3] border-[#E89B5A] shadow-md shadow-[#E89B5A]/10 scale-[1.02]'
                    : item.isOpen
                    ? 'bg-white border-gray-100 hover:border-gray-200'
                    : 'bg-gray-50/60 border-transparent opacity-60'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <span
                    className={`text-[12px] font-bold ${
                      isToday ? 'text-[#E89B5A]' : 'text-gray-700'
                    }`}
                  >
                    {dayMeta.short}
                  </span>
                  {isToday && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E89B5A] animate-pulse"></span>
                  )}
                </div>

                {item.isOpen ? (
                  <div className="flex flex-col items-center text-center">
                    <span className="text-[13px] font-bold text-gray-900">{openVal}</span>
                    <span className="text-[10px] text-gray-400 font-medium my-0.5">đến</span>
                    <span className="text-[13px] font-bold text-gray-900">{closeVal}</span>
                  </div>
                ) : (
                  <span className="text-[12px] font-medium text-gray-400 my-auto py-2">
                    Nghỉ
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // --- CHẾ ĐỘ CHỈNH SỬA (EDIT MODE) ---
  return (
    <div className="w-full flex flex-col gap-5">
      {/* Thanh Quick Presets */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white rounded-xl border border-gray-200/80 shadow-2xs">
        <div className="flex items-center gap-1.5 text-[12px] font-bold text-gray-600">
          <Sparkles size={14} className="text-[#E89B5A]" />
          <span>Cài đặt nhanh:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => applyPreset('standard')}
            className="text-[12px] font-medium px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-[#FFF8F3] hover:text-[#E89B5A] text-gray-600 border border-gray-200/60 transition-all cursor-pointer"
          >
            T2-T6 (8h-17h), T7-CN (8h-12h)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('allWeek')}
            className="text-[12px] font-medium px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-[#FFF8F3] hover:text-[#E89B5A] text-gray-600 border border-gray-200/60 transition-all cursor-pointer"
          >
            Cả tuần (8h-18h)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('weekdaysOnly')}
            className="text-[12px] font-medium px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-[#FFF8F3] hover:text-[#E89B5A] text-gray-600 border border-gray-200/60 transition-all cursor-pointer"
          >
            Chỉ ngày tuần (T2-T6)
          </button>
          <button
            type="button"
            onClick={copyToAll}
            className="flex items-center gap-1 text-[12px] font-medium px-3 py-1.5 rounded-lg bg-[#FFF8F3] text-[#E89B5A] border border-[#FCE8D5] hover:bg-[#FDE3CB] transition-all cursor-pointer"
          >
            <Copy size={12} /> Áp dụng giờ T2 cho tất cả
          </button>
        </div>
      </div>

      {/* Danh sách ngày chỉnh sửa */}
      <div className="flex flex-col gap-2.5">
        {value.map((item, idx) => {
          const dayMeta = getDayLabel(item.day);
          const openVal = getOpenVal(item);
          const closeVal = getCloseVal(item);

          return (
            <div
              key={idx}
              className={`flex items-center justify-between p-3.5 px-4 rounded-xl border transition-all ${
                item.isOpen
                  ? 'bg-white border-gray-200/90 shadow-2xs'
                  : 'bg-gray-50/70 border-gray-200/50 opacity-70'
              }`}
            >
              {/* Tên ngày & Công tắc Switch iOS */}
              <div className="flex items-center gap-3 min-w-[140px]">
                <button
                  type="button"
                  onClick={() => toggleDay(idx)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    item.isOpen ? 'bg-[#E89B5A]' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      item.isOpen ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <div className="flex flex-col">
                  <span className="text-[14px] font-bold text-gray-900">{dayMeta.full}</span>
                  <span className="text-[11px] font-medium text-gray-400">
                    {item.isOpen ? 'Mở cửa' : 'Nghỉ làm việc'}
                  </span>
                </div>
              </div>

              {/* Input Thời Gian */}
              {item.isOpen ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-[#F9FAFB] border border-gray-200 rounded-lg px-2.5 py-1.5 focus-within:border-[#E89B5A] transition-colors">
                    <Sun size={14} className="text-amber-500 shrink-0" />
                    <input
                      type="time"
                      value={openVal}
                      onChange={(e) => updateTime(idx, 'openTime', e.target.value)}
                      className="bg-transparent text-[13px] font-semibold text-gray-800 outline-none w-[75px]"
                    />
                  </div>

                  <span className="text-[12px] font-bold text-gray-400">-</span>

                  <div className="flex items-center gap-1.5 bg-[#F9FAFB] border border-gray-200 rounded-lg px-2.5 py-1.5 focus-within:border-[#E89B5A] transition-colors">
                    <Moon size={14} className="text-indigo-400 shrink-0" />
                    <input
                      type="time"
                      value={closeVal}
                      onChange={(e) => updateTime(idx, 'closeTime', e.target.value)}
                      className="bg-transparent text-[13px] font-semibold text-gray-800 outline-none w-[75px]"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-[12px] font-medium text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg">
                  Đóng cửa cả ngày
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};