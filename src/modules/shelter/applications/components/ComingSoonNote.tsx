'use client';
import React from 'react';
import { Sparkles } from 'lucide-react';

export const ComingSoonNote: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex items-center gap-2 rounded-[10px] bg-gray-50 border border-dashed border-gray-200 px-3.5 py-2.5 text-[12px] text-gray-400">
    <Sparkles size={14} />
    <span>{label} — tính năng đang được phát triển.</span>
  </div>
);