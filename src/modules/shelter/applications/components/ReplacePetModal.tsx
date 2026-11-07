'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { X, Search, Mars, Venus, Loader2 } from 'lucide-react';
import { AdoptionApplication } from '@/types/application';
import { applicationService } from '@/services/applicationService';
import { formatBreed, MaybeBilingual } from '@/utils/bilingualField';
import { formatPetAge } from '@/utils/petAge';
import { getPetCode } from './PetIdBadge';

interface ReplacementPet {
  id: string;
  name: string;
  gender?: string | null;
  dob?: string | null;
  breed?: unknown;
  status: 'AVAILABLE' | 'PENDING';
  shelterInternalId?: string | null;
  microchipNumber?: string | null;
  images?: { url: string }[];
  activeApplications: number;
}

interface Props {
  application: AdoptionApplication;
  onClose: () => void;
  onDone: () => void | Promise<void>;
}

// Chuẩn hoá để tìm không phân biệt dấu, hoa/thường: "Bấc" ↔ "bac", "Bé Bự" ↔ "be bu", "Đốm" ↔ "dom"
const normalizeText = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();

export const ReplacePetModal: React.FC<Props> = ({ application, onClose, onDone }) => {
  const [search, setSearch] = useState('');
  const [allPets, setAllPets] = useState<ReplacementPet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<ReplacementPet | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tải toàn bộ bé một lần khi mở modal
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    applicationService
      .getReplacementPets(application.id)
      .then((list) => {
        if (!cancelled) setAllPets(list as ReplacementPet[]);
      })
      .catch((e: any) => {
        if (!cancelled) {
          setError(e?.response?.data?.message || e?.message || 'Không tải được danh sách bé.');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [application.id]);

  // Lọc phía client, không gọi lại server khi gõ
  const filteredPets = useMemo(() => {
    const q = normalizeText(search);
    if (!q) return allPets;
    return allPets.filter((p) => normalizeText(p.name).includes(q));
  }, [allPets, search]);

  const handleConfirm = async () => {
    if (!selected || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await applicationService.replacePet(application.id, selected.id);
      await onDone();
      onClose();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Không thể đổi bé.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasAppointment = !!application.appointment;
  const isApproved = application.status === 'APPROVED';
  const willNotify = application.status !== 'CLOSED';

  return (
    <div
      className="m-overlay fixed inset-0 bg-black/50 z-[120] flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="m-sheet bg-white w-full max-w-[460px] max-h-[88vh] rounded-[22px] shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <h2 className="text-[17px] font-bold text-gray-900">Đổi bé nhận nuôi</h2>
            <p className="text-[12px] text-gray-500 mt-0.5">
              Đơn của <b>{application.fullName || application.user?.name}</b> hiện đang xin nhận nuôi{' '}
              <b>{application.pet?.name}</b>.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 pb-3 shrink-0">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên bé..."
              className="w-full bg-[#F6F6F6] rounded-[12px] pl-9 pr-3 py-2.5 text-[13px] outline-none border border-transparent focus:border-[#E89B5A]"
            />
          </div>
          {!isLoading && allPets.length > 0 && (
            <p className="text-[11px] text-gray-400 mt-2">
              {search.trim()
                ? `Tìm thấy ${filteredPets.length}/${allPets.length} bé`
                : `Tổng ${allPets.length} bé có thể đổi`}
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-3 flex flex-col gap-2 min-h-[160px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-gray-400">
              <Loader2 size={18} className="animate-spin" />
            </div>
          ) : allPets.length === 0 ? (
            <p className="text-center text-[12.5px] text-gray-400 italic py-10">
              Không có bé nào phù hợp (người này đã có đơn cho các bé còn lại).
            </p>
          ) : filteredPets.length === 0 ? (
            <p className="text-center text-[12.5px] text-gray-400 italic py-10">
              Không tìm thấy bé nào có tên "{search.trim()}".
            </p>
          ) : (
            filteredPets.map((p) => {
              const code = getPetCode(p);
              const sub = [p.dob ? formatPetAge(p.dob) : '', p.breed ? formatBreed(p.breed as MaybeBilingual) : '']
                .filter(Boolean)
                .join(' • ');
              const active = selected?.id === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelected(p)}
                  className={`text-left border rounded-[14px] p-2.5 flex items-center gap-3 transition-colors cursor-pointer ${
                    active ? 'border-[#E89B5A] bg-[#FFF8F3]' : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  {p.images?.[0]?.url ? (
                    <img src={p.images[0].url} alt={p.name} className="w-11 h-11 rounded-[10px] object-cover shrink-0" />
                  ) : (
                    <div className="w-11 h-11 rounded-[10px] bg-gray-100 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[13.5px] text-gray-900 truncate">{p.name}</span>
                      {p.gender === 'FEMALE' && <Venus size={13} strokeWidth={2.5} className="text-[#FF6B93] shrink-0" />}
                      {p.gender === 'MALE' && <Mars size={13} strokeWidth={2.5} className="text-[#3DB2FF] shrink-0" />}
                    </div>
                    {sub && <div className="text-[11.5px] text-gray-400 truncate">{sub}</div>}
                    {code && <div className="text-[11px] text-gray-400 truncate">ID: {code}</div>}
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <span
                      className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${
                        p.status === 'PENDING' ? 'bg-[#FFF8E6] text-[#B45309]' : 'bg-[#E7F8ED] text-[#16A34A]'
                      }`}
                    >
                      {p.status === 'PENDING' ? 'Đang giữ chỗ' : 'Còn nhận nuôi'}
                    </span>
                    {p.activeApplications > 0 && (
                      <span className="text-[10.5px] text-gray-400">{p.activeApplications} đơn đang xử lý</span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {selected && (
          <div className="mx-5 mb-3 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2.5 text-[11.5px] text-[#92400E] leading-relaxed shrink-0">
            <p className="font-bold mb-1">
              Đổi {application.pet?.name} → {selected.name}
            </p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Thông tin đơn, thẻ, ghi chú, tài liệu được giữ nguyên.</li>
              {hasAppointment && <li>Lịch phỏng vấn gắn sang bé mới; tiêu đề mặc định đổi theo tên bé mới.</li>}
              {isApproved && (
                <li>
                  Bé mới chuyển sang "Đang giữ chỗ" nếu đang trống; {application.pet?.name} được trả về "Còn nhận
                  nuôi" nếu không còn đơn đã duyệt nào khác.
                </li>
              )}
              {willNotify && <li>Người nộp đơn sẽ nhận thông báo.</li>}
            </ul>
          </div>
        )}

        {error && (
          <p className="mx-5 mb-3 text-[12px] text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 shrink-0">
            {error}
          </p>
        )}

        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-[12px] border border-gray-200 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selected || isSubmitting}
            className="px-5 py-2 rounded-[12px] bg-[#E89B5A] hover:bg-[#D68B4E] text-white text-[13px] font-bold disabled:opacity-50"
          >
            {isSubmitting ? 'Đang xử lý...' : 'Xác nhận đổi'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReplacePetModal;