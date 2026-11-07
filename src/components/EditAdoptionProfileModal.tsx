'use client';

import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { useUserAdoptionStore } from '@/stores/useUserAdoptionStore';
import { AdoptionApplication } from '@/types/application';

interface Props {
  isOpen: boolean;
  initialData: AdoptionApplication | null;
  onClose: () => void;
}

export default function EditAdoptionProfileModal({ isOpen, initialData, onClose }: Props) {
  const { updateProfile, isSubmitting } = useUserAdoptionStore();

  const [fullName, setFullName] = useState(initialData?.fullName || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [zalo, setZalo] = useState(initialData?.zalo || '');
  const [location, setLocation] = useState(initialData?.location || '');
  const [housing, setHousing] = useState(initialData?.housing || '');
  const [children, setChildren] = useState(initialData?.children || '');
  const [cage, setCage] = useState(initialData?.cage || 'No');
  const [petExperience, setPetExperience] = useState(initialData?.petExperience || '');
  const [employmentStatus, setEmploymentStatus] = useState(initialData?.employmentStatus || '');
  const [adoptionReason, setAdoptionReason] = useState(initialData?.adoptionReason || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await updateProfile({
      fullName,
      phone,
      zalo,
      location,
      housing,
      children,
      cage,
      petExperience,
      employmentStatus,
      adoptionReason,
    });

    if (success) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Chỉnh sửa hồ sơ nhận nuôi</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#E89B5A]">A - Thông tin liên hệ</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Họ và tên *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm outline-none focus:border-[#E89B5A]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Số điện thoại *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm outline-none focus:border-[#E89B5A]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Zalo / Email phụ</label>
                <input
                  type="text"
                  value={zalo}
                  onChange={(e) => setZalo(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm outline-none focus:border-[#E89B5A]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Khu vực sinh sống</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm outline-none focus:border-[#E89B5A]"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-gray-100">
            <h3 className="text-sm font-bold text-[#E89B5A]">B - Điều kiện nhà ở</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Loại nhà ở</label>

                <input
                  type="text"
                  placeholder="Chung cư / Nhà riêng..."
                  value={housing}
                  onChange={(e) => setHousing(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm outline-none focus:border-[#E89B5A]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Tình trạng công việc</label>

                <input
                  type="text"
                  placeholder="Đang đi làm full-time..."
                  value={employmentStatus}
                  onChange={(e) => setEmploymentStatus(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm outline-none focus:border-[#E89B5A]"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-gray-100">
            <h3 className="text-sm font-bold text-[#E89B5A]">C - Kinh nghiệm & Lý do</h3>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Lý do muốn nhận nuôi</label>

              <textarea
                rows={2}
                value={adoptionReason}
                onChange={(e) => setAdoptionReason(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-[#E89B5A] resize-none"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#E89B5A] text-white text-sm font-bold hover:bg-[#D68B4E] transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}