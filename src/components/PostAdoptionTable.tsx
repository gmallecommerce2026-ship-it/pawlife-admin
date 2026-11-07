'use client';

import React from 'react';
import Image from 'next/image';
import { Mars, Venus, PawPrint, ChevronRight, CalendarClock } from 'lucide-react';
import { PostAdoptionRecord, getDaysSince, fmtDate } from '@/types/postAdoption';

interface PostAdoptionTableProps {
  records: PostAdoptionRecord[];
  onView?: (record: PostAdoptionRecord) => void;
}

const COLUMNS_CLASS =
  'grid grid-cols-[minmax(200px,2fr)_minmax(180px,1.5fr)_minmax(180px,1.5fr)_minmax(140px,1fr)_minmax(120px,1fr)_minmax(140px,1fr)] items-center gap-4';

const GenderIcon = ({ isFemale, size }: { isFemale: boolean; size: number }) =>
  isFemale ? (
    <Venus size={size} strokeWidth={2.5} className="shrink-0 text-[#FF6B93]" aria-label="Cái" />
  ) : (
    <Mars size={size} strokeWidth={2.5} className="shrink-0 text-[#3DB2FF]" aria-label="Đực" />
  );

export const PostAdoptionTable: React.FC<PostAdoptionTableProps> = ({ records, onView }) => {
  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-[20px] border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF4EC]">
          <PawPrint size={22} className="text-[#E89B5A]" />
        </span>
        <p className="text-[16px] font-semibold text-gray-900">Chưa có bé nào được nhận nuôi</p>
        <p className="mt-1 max-w-[260px] text-[14px] text-gray-500">
          Khi một đơn hoàn tất, bé sẽ xuất hiện ở đây để bạn theo dõi sau nhận nuôi.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* =========== MOBILE + TABLET (< lg): danh sách nhóm kiểu iOS =========== */}
      <ul className="divide-y divide-black/[0.06] overflow-hidden rounded-[20px] border border-black/[0.06] bg-white lg:hidden">
        {records.map((record) => {
          const isFemale = record.petGender === 'FEMALE';
          const imageUrl = record.petImage || null;
          const days = getDaysSince(record.adoptionDate);

          return (
            <li key={record.id}>
              <button
                type="button"
                onClick={() => onView?.(record)}
                className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors active:bg-black/[0.04]"
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-gray-100 bg-gray-100">
                  {imageUrl ? (
                    <Image src={imageUrl} alt={record.petName} fill sizes="56px" className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-300">
                      <PawPrint size={22} />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[17px] font-semibold tracking-[-0.01em] text-gray-900">
                      {record.petName}
                    </span>
                    <GenderIcon isFemale={isFemale} size={15} />
                  </div>
                  <p className="truncate text-[14px] text-gray-500">{record.breed}</p>
                  <p className="truncate text-[13px] text-gray-400">Người nhận nuôi: {record.adopterName}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-gray-400">
                    <CalendarClock size={13} className="shrink-0" />
                    <span className="truncate">Theo dõi tiếp {fmtDate(record.nextFollowUpDate)}</span>
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className="rounded-full bg-[#FFF4EC] px-2.5 py-1 text-[12px] font-semibold text-[#C9772F]">
                    {days} ngày
                  </span>
                  <span className="text-[11.5px] text-gray-400">{fmtDate(record.adoptionDate)}</span>
                </div>

                <ChevronRight size={18} className="shrink-0 text-gray-300" />
              </button>
            </li>
          );
        })}
      </ul>

      {/* =========== DESKTOP (≥ lg): bảng đầy đủ như cũ =========== */}
      <div className="hidden w-full overflow-hidden rounded-[16px] border border-gray-200 bg-white lg:block">
        <div className={`${COLUMNS_CLASS} border-b border-gray-200 bg-[#F9FAFB] px-6 py-4`}>
          <span className="text-[14px] font-medium text-gray-500">Pet Name</span>
          <span className="text-[14px] font-medium text-gray-500">Breed</span>
          <span className="text-[14px] font-medium text-gray-500">Adopter Name</span>
          <span className="text-[14px] font-medium text-gray-500">Adoption Date</span>
          <span className="text-[14px] font-medium text-gray-500">Days Since</span>
          <span className="text-[14px] font-medium text-gray-500">Next Follow-up</span>
        </div>

        {records.map((record) => {
          const isFemale = record.petGender === 'FEMALE';
          const imageUrl = record.petImage || null;

          return (
            <div
              key={record.id}
              onClick={() => onView?.(record)}
              className={`group ${COLUMNS_CLASS} cursor-pointer border-b border-gray-100/80 px-6 py-4 transition-colors last:border-0 hover:bg-gray-50/50`}
            >
              <div className="flex min-w-0 items-center gap-4">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-gray-50 bg-gray-100">
                  {imageUrl ? (
                    <Image src={imageUrl} alt={record.petName} fill sizes="48px" className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-300">
                      <PawPrint size={20} />
                    </div>
                  )}
                </div>

                <div className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate text-[16px] font-bold text-gray-900">{record.petName}</span>
                  <GenderIcon isFemale={isFemale} size={16} />
                </div>
              </div>

              <span className="truncate text-[15px] font-normal text-gray-500">{record.breed}</span>
              <span className="truncate text-[15px] font-normal text-gray-500">{record.adopterName}</span>
              <span className="truncate text-[15px] font-normal text-gray-500">{fmtDate(record.adoptionDate)}</span>
              <span className="truncate text-[15px] font-normal text-gray-500">{getDaysSince(record.adoptionDate)} days</span>
              <span className="truncate text-[15px] font-normal text-gray-500">{fmtDate(record.nextFollowUpDate)}</span>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default PostAdoptionTable;