import React from 'react';
import { ApplicationNote, ROLE_BADGE_STYLE } from '@/types/application';
import { STAFF_ROLE_LABEL, ShelterStaffRole } from '@/types/shelterTeam';

export const resolveNoteRole = (note: any): ShelterStaffRole | undefined => {
  const raw = note?.authorRole ?? note?.author?.shelterRole;
  if (!raw) return undefined;
  const normalized = String(raw).toUpperCase();
  return normalized in STAFF_ROLE_LABEL ? (normalized as ShelterStaffRole) : undefined;
};
export const unwrapNote = (res: any) => res?.data?.data ?? res?.data ?? res;    
export const formatNoteTime = (value?: string | Date | null): string => {
  if (!value) return 'Vừa xong';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return typeof value === 'string' ? value : 'Vừa xong';
  const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  return `${Math.floor(diffHour / 24)} ngày trước`;
};

const getInitials = (name?: string | null) =>
  (name || 'Nhân viên')
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

export const NoteItem: React.FC<{ note: ApplicationNote }> = ({ note }) => {
  const name = note.authorName || (note as any).author?.name || 'Nhân viên trạm';
  const avatar = note.authorAvatar || (note as any).author?.avatarUrl;
  const role = resolveNoteRole(note);

  return (
    <div className="flex gap-2.5 items-start">
      {avatar ? (
        <img src={avatar} alt={name} className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5" />
      ) : (
        <div className="w-8 h-8 rounded-full bg-[#E59858] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
          {getInitials(name)}
        </div>
      )}

      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-bold text-[13px] text-gray-900">{name}</span>
          {role && (
            <span
              className={`px-2.5 py-[2px] rounded-full text-[10.5px] font-semibold tracking-tight ${ROLE_BADGE_STYLE[role]}`}
            >
              {STAFF_ROLE_LABEL[role]}
            </span>
          )}
          <span className="text-[11px] text-gray-400 ml-auto">{formatNoteTime(note.createdAt)}</span>
        </div>
        <p className="text-[12.5px] text-gray-600 leading-snug mt-0.5 break-words">{note.content}</p>
      </div>
    </div>
  );
};