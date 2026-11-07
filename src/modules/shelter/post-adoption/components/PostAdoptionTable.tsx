'use client';

import React from 'react';
import Image from 'next/image';
import { Mars, Venus, PawPrint } from 'lucide-react';
import { PostAdoptionRecord, getDaysSince, fmtDate } from '@/types/postAdoption';

interface PostAdoptionTableProps {
  records: PostAdoptionRecord[];
  onView?: (record: PostAdoptionRecord) => void;
}

// Cập nhật lại tỷ lệ Grid để giống với khoảng cách trong ảnh
const COLUMNS_CLASS =
  'grid grid-cols-[minmax(200px,2fr)_minmax(180px,1.5fr)_minmax(180px,1.5fr)_minmax(140px,1fr)_minmax(120px,1fr)_minmax(140px,1fr)] items-center gap-4';

export const PostAdoptionTable: React.FC<PostAdoptionTableProps> = ({ records, onView }) => {
  return (
    <div className="w-full bg-white border border-gray-200 rounded-[16px] overflow-hidden">
      {/* Header */}
      <div className={`${COLUMNS_CLASS} px-6 py-4 bg-[#F9FAFB] border-b border-gray-200`}>
        <span className="text-[14px] font-medium text-gray-500">Pet Name</span>
        <span className="text-[14px] font-medium text-gray-500">Breed</span>
        <span className="text-[14px] font-medium text-gray-500">Adopter Name</span>
        <span className="text-[14px] font-medium text-gray-500">Adoption Date</span>
        <span className="text-[14px] font-medium text-gray-500">Days Since</span>
        <span className="text-[14px] font-medium text-gray-500">Next Follow-up</span>
      </div>

      {/* Rows */}
      {records.map((record) => {
        const isFemale = record.petGender === 'FEMALE';
        const imageUrl = record.petImage || null;

        return (
          <div
            key={record.id}
            onClick={() => onView?.(record)}
            className={`group ${COLUMNS_CLASS} px-6 py-4 border-b border-gray-100/80 last:border-0 cursor-pointer hover:bg-gray-50/50 transition-colors`}
          >
            {/* Pet Name & Avatar */}
            <div className="flex items-center gap-4 min-w-0">
              {/* Avatar tròn hoàn hảo 48x48 */}
              <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-100 shrink-0 border border-gray-50">
                {imageUrl ? (
                  <Image src={imageUrl} alt={record.petName} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <PawPrint size={20} />
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-1.5 min-w-0">
                {/* Tên in đậm, màu đen sắc nét */}
                <span className="font-bold text-gray-900 text-[16px] truncate">
                  {record.petName}
                </span>
                {isFemale ? (
                  <Venus size={16} strokeWidth={2.5} className="text-[#FF6B93] shrink-0" />
                ) : (
                  <Mars size={16} strokeWidth={2.5} className="text-[#3DB2FF] shrink-0" />
                )}
              </div>
            </div>

            {/* Các trường thông tin - Màu xám trung tính, font 15px to rõ */}
            <span className="text-[15px] font-normal text-gray-500 truncate">
              {record.breed}
            </span>
            <span className="text-[15px] font-normal text-gray-500 truncate">
              {record.adopterName}
            </span>
            <span className="text-[15px] font-normal text-gray-500 truncate">
              {fmtDate(record.adoptionDate)}
            </span>
            <span className="text-[15px] font-normal text-gray-500 truncate">
              {getDaysSince(record.adoptionDate)} days
            </span>
            <span className="text-[15px] font-normal text-gray-500 truncate">
              {fmtDate(record.nextFollowUpDate)}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default PostAdoptionTable;