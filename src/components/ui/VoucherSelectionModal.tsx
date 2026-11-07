// src/components/ui/VoucherSelectionModal.tsx
"use client";
import React, { useEffect, useState } from 'react';
import CloseIcon from '@/icons/close.svg';

// ... (Giữ nguyên interfaces)
interface Voucher {
    id: string;
    code: string;
    description: string;
    discount: string;
  }
  
  interface VoucherSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    vouchers: Voucher[];
    selectedId: string | null;
    onSelect: (id: string) => void;
  }

const VoucherSelectionModal: React.FC<VoucherSelectionModalProps> = ({
  isOpen,
  onClose,
  vouchers,
  selectedId,
  onSelect,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // Xử lý mount/unmount animation
  useEffect(() => {
    if (isOpen) setIsVisible(true);
    else setTimeout(() => setIsVisible(false), 200); // Đợi đóng xong mới unmount
  }, [isOpen]);

  if (!isVisible && !isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-300 ease-out
        ${isOpen ? "bg-black/60 backdrop-blur-sm opacity-100" : "bg-black/0 backdrop-blur-none opacity-0"}
      `}
    >
      <div 
        className={`bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[85vh] transform transition-all duration-300 cubic-bezier(0.175, 0.885, 0.32, 1.275)
          ${isOpen ? "scale-100 translate-y-0 opacity-100" : "scale-95 translate-y-8 opacity-0"}
        `}
      >
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-3xl z-10">
          <h3 className="text-xl font-bold text-gray-900 tracking-tight">Chọn Voucher</h3>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-full transition-colors active:scale-90"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-gray-50 space-y-4">
          {vouchers.map((voucher) => {
            const isSelected = selectedId === voucher.id;
            return (
              <div
                key={voucher.id}
                onClick={() => onSelect(voucher.id)}
                className={`
                  relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 group
                  flex justify-between items-center select-none
                  ${isSelected 
                    ? 'border-brand-orange bg-orange-50/50 shadow-md shadow-orange-100 scale-[1.02]' 
                    : 'border-white bg-white hover:border-gray-200 hover:shadow-sm active:scale-[0.98]'}
                `}
              >
                <div className="flex items-center gap-4">
                  {/* Left Ticket Stub */}
                  <div className={`
                    w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 transition-colors
                    ${isSelected ? 'bg-brand-orange text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'}
                  `}>
                    %
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-800 text-lg">{voucher.code}</span>
                    <span className="text-xs text-gray-500 line-clamp-1">{voucher.description}</span>
                    <span className="text-sm font-bold text-brand-orange mt-0.5">{voucher.discount}</span>
                  </div>
                </div>
                
                {/* Custom Radio Button */}
                <div className={`
                    w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200
                    ${isSelected ? 'border-brand-orange bg-brand-orange' : 'border-gray-300 group-hover:border-gray-400'}
                `}>
                   <div className={`w-2.5 h-2.5 bg-white rounded-full transition-transform duration-200 ${isSelected ? 'scale-100' : 'scale-0'}`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-white rounded-b-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-10">
          <button 
            onClick={onClose}
            className="w-full py-3.5 bg-brand-orange text-white font-bold rounded-xl 
            hover:bg-brand-orange-dark transition-all shadow-lg shadow-orange-200 active:scale-[0.98]"
          >
            Áp dụng ngay
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoucherSelectionModal;