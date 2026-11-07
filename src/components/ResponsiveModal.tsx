'use client';

import React from 'react';

interface ResponsiveModalProps {
  onClose: () => void;
  children: React.ReactNode;
  /** Chỉ áp dụng từ màn hình sm trở lên. Truyền nguyên chuỗi class, vd "max-w-[420px]" */
  maxWidth?: string;
  zIndex?: string;
}

/**
 * Modal 2 mặt:
 *  - Mobile  : bottom sheet bo góc 28px, có grab handle, tôn trọng safe-area
 *  - ≥ sm    : dialog căn giữa như cũ
 * Dùng để bọc nội dung của mọi modal hiện có (Invite, Flag, Password, Close...).
 */
export const ResponsiveModal: React.FC<ResponsiveModalProps> = ({
  onClose,
  children,
  maxWidth = 'max-w-[480px]',
  zIndex = 'z-[110]',
}) => (
  <div
    className={`fixed inset-0 ${zIndex} flex items-end justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-150 sm:items-center sm:p-4`}
    onClick={onClose}
  >
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.stopPropagation()}
      className={`relative w-full ${maxWidth} max-h-[92dvh] overflow-y-auto overscroll-contain rounded-t-[28px] bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl animate-in slide-in-from-bottom-8 duration-200 sm:rounded-[20px] sm:pb-0 sm:zoom-in-95 sm:slide-in-from-bottom-0`}
    >
      <div className="sticky top-0 z-10 flex justify-center bg-white/90 pb-1 pt-2.5 backdrop-blur sm:hidden">
        <span className="h-1.5 w-10 rounded-full bg-gray-300" />
      </div>
      {children}
    </div>
  </div>
);

export default ResponsiveModal;