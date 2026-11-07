'use client';
import React from 'react';
import { getInitials } from '@/types/application';

export const Avatar: React.FC<{
  avatarUrl?: string | null;
  name?: string | null;
  size?: number;
  roundedClassName?: string;
}> = ({ avatarUrl, name, size = 100, roundedClassName = 'rounded-full' }) => {
  const style = { width: size, height: size };
  if (avatarUrl) {
    return <img src={avatarUrl} style={style} className={`${roundedClassName} object-cover border border-gray-100 shrink-0`} alt={name || 'avatar'} />;
  }
  return (
    <div style={style} className={`${roundedClassName} border border-gray-100 shrink-0 bg-[#FFF1E4] text-[#E89B5A] flex items-center justify-center font-bold`}>
      <span style={{ fontSize: Math.max(11, size * 0.32) }}>{getInitials(name)}</span>
    </div>
  );
};