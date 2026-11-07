'use client';

import React, { useState } from 'react';
import { X, Mail, User as UserIcon, ChevronDown } from 'lucide-react';
import { useShelterTeamActions } from '@/store/useShelterTeamStore';
import { STAFF_ROLE_LABEL, ShelterStaffRole } from '@/types/shelterTeam';

const ROLE_OPTIONS: ShelterStaffRole[] = ['ADMIN', 'MEMBER', 'VOLUNTEER', 'VETERINARIAN'];

interface InviteMemberModalProps {
  onClose: () => void;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({ onClose }) => {
  const { inviteMember, isSubmitting } = useShelterTeamActions();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<ShelterStaffRole>('MEMBER');
  const [isRoleOpen, setIsRoleOpen] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) return;
    const ok = await inviteMember(email.trim(), role, name.trim() || undefined);
    if (ok) onClose();
  };

  return (
    <div className="m-overlay fixed inset-0 bg-black/40 z-[120] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="m-sheet bg-white w-full max-w-[420px] rounded-[20px] shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-5 right-5 text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>

        <h3 className="text-[18px] font-bold text-gray-900 mb-1">Mời thành viên mới</h3>
        <p className="text-[13px] text-gray-500 mb-5">Người được mời sẽ nhận email để tự đặt mật khẩu và kích hoạt tài khoản.</p>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-[12px] font-bold text-gray-500 mb-1.5 block">Email</label>
            <div className="flex items-center gap-2.5 bg-[#F9FAFB] rounded-[10px] px-3.5 py-2.5 border border-transparent focus-within:border-[#E89B5A]">
              <Mail size={16} className="text-gray-400 shrink-0" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ten@email.com"
                className="w-full bg-transparent outline-none text-[14px] text-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="text-[12px] font-bold text-gray-500 mb-1.5 block">Tên (tuỳ chọn)</label>
            <div className="flex items-center gap-2.5 bg-[#F9FAFB] rounded-[10px] px-3.5 py-2.5 border border-transparent focus-within:border-[#E89B5A]">
              <UserIcon size={16} className="text-gray-400 shrink-0" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full bg-transparent outline-none text-[14px] text-gray-900"
              />
            </div>
          </div>

          <div className="relative">
            <label className="text-[12px] font-bold text-gray-500 mb-1.5 block">Vai trò</label>
            <button
              type="button"
              onClick={() => setIsRoleOpen((v) => !v)}
              className={`w-full bg-[#F9FAFB] border rounded-[10px] px-3.5 py-2.5 flex justify-between items-center text-left ${
                isRoleOpen ? 'border-[#E89B5A]' : 'border-transparent'
              }`}
            >
              <span className="text-[14px] font-medium text-gray-900">{STAFF_ROLE_LABEL[role]}</span>
              <ChevronDown size={16} className={`text-gray-400 transition-transform ${isRoleOpen ? 'rotate-180' : ''}`} />
            </button>
            {isRoleOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-[10px] shadow-lg overflow-hidden">
                {ROLE_OPTIONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => { setRole(r); setIsRoleOpen(false); }}
                    className={`w-full text-left px-3.5 py-2.5 text-[14px] ${
                      role === r ? 'bg-[#FFF8F0] text-[#E89B5A] font-bold' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {STAFF_ROLE_LABEL[r]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 text-[13px] font-semibold rounded-md hover:bg-gray-100">
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !email.trim()}
            className="px-5 py-2 bg-[#E89B5A] hover:bg-[#D68B4E] text-white text-[13px] font-bold rounded-md disabled:opacity-60"
          >
            {isSubmitting ? 'Đang gửi...' : 'Gửi lời mời'}
          </button>
        </div>
      </div>
    </div>
  );
};