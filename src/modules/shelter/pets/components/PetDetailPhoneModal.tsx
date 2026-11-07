'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  X,
  ChevronLeft,
  Wifi,
  BatteryFull,
  MoreVertical,
  PawPrint,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  Lock,
  Cake,
  QrCode,
  Home,
  Syringe,
  Stethoscope,
  Smile,
  FileText,
  User,
  HeartHandshake,
} from 'lucide-react';
import { Pet } from '@/types/pet';

// =============================================================================
// PORT TỪ app/pet-profile-detail.tsx (mobile, React Native) SANG WEB.
// Đây là bản xem trước (preview) hiển thị trong khung điện thoại, KHÔNG gọi API
// thật — mọi thao tác (bật/tắt Lost Mode, sửa/xoá hồ sơ y tế...) chỉ đổi state
// cục bộ trong modal này. Nếu muốn các hành động này chạy thật (gọi petService),
// truyền thêm các callback tương ứng qua props (đã chừa sẵn onEditPress,
// onEditMedicalRecord, onDeleteMedicalRecord, onReportMedicalRecord) và tự nối
// vào petService/axiosClient phía component cha.
//
// Vì Pet type hiện tại (types/pet.ts) chưa chắc đã có đủ field mobile đang dùng
// (pawHistory, qrCodeUrl, qrVerificationStatus, needsQrReplacement, contactName...),
// các field này được đọc qua `(pet as any)` và có fallback hợp lý. Khi backend/
// type đã thống nhất, có thể xoá bớt các "as any" này.
// =============================================================================

type MaybeBilingual = string | { vi?: string; en?: string } | null | undefined;
const showText = (val: MaybeBilingual): string => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  return val.vi || val.en || '';
};

const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString('vi-VN') : '');

// ---------------------------------------------------------------------------
// PAWHISTORY — cấu hình icon/màu theo loại sự kiện, mirror PAW_HISTORY_UI_CONFIG
// bên mobile (thay icon PNG bằng icon lucide tương đương vì web không có sẵn
// bộ asset PNG đó).
// ---------------------------------------------------------------------------
const HISTORY_TYPE_CONFIG: Record<string, { Icon: React.ElementType; bg: string; color: string; line: string }> = {
  BIRTH: { Icon: Cake, bg: '#FFF4EC', color: '#F2A465', line: '#FFE0C2' },
  CREATED: { Icon: QrCode, bg: '#EAE7FB', color: '#885BF2', line: '#D3CCFF' },
  QR_LINKED: { Icon: QrCode, bg: '#EAE7FB', color: '#885BF2', line: '#D3CCFF' },
  TRANSFER: { Icon: Home, bg: '#EBFFE2', color: '#77C582', line: '#D5F5C6' },
  VACCINE: { Icon: Syringe, bg: '#E3F0FF', color: '#5A90DA', line: '#BFD9FF' },
  DENTAL_CARE: { Icon: Smile, bg: '#E8FFD8', color: '#5FA83D', line: '#D5F5C6' },
  ANNUAL_CHECKUP: { Icon: Stethoscope, bg: '#E8FFD8', color: '#5FA83D', line: '#D5F5C6' },
  CURRENT_OWNER: { Icon: User, bg: '#FFE9B8', color: '#CF7900', line: '#FFD88A' },
  PREVIOUS_OWNER: { Icon: User, bg: '#FFE9B8', color: '#CF7900', line: '#FFD88A' },
  UNDER_SHELTER_CARE: { Icon: HeartHandshake, bg: '#FFE4F0', color: '#D6447A', line: '#F8BBD0' },
  WAS_UNDER_SHELTER_CARE: { Icon: HeartHandshake, bg: '#FFE4F0', color: '#D6447A', line: '#F8BBD0' },
};
const DEFAULT_HISTORY_CONFIG = { Icon: Cake, bg: '#F5F5F5', color: '#8E8E93', line: '#E0E0E0' };

// Nhãn mặc định theo loại, dùng khi item không có sẵn title/description (mobile
// dùng bảng i18n phức tạp hơn nhiều — bản rút gọn này chỉ đủ để preview UI).
const HISTORY_TYPE_LABEL: Record<string, string> = {
  BIRTH: 'Ngày sinh',
  TRANSFER: 'Chuyển giao quyền sở hữu',
  VACCINE: 'Tiêm phòng',
  DENTAL_CARE: 'Khám răng miệng',
  ANNUAL_CHECKUP: 'Khám tổng quát định kỳ',
  CURRENT_OWNER: 'Chủ sở hữu hiện tại',
  PREVIOUS_OWNER: 'Chủ trước',
  UNDER_SHELTER_CARE: 'Đang ở trạm cứu hộ',
  WAS_UNDER_SHELTER_CARE: 'Từng ở trạm cứu hộ',
  QR_LINKED: 'Kích hoạt thẻ QR',
};

const MEDICAL_TYPE_ICON: Record<string, React.ElementType> = {
  VACCINE: Syringe,
  VACCINATION: Syringe,
  CHECKUP: Stethoscope,
  ANNUAL_CHECKUP: Stethoscope,
  EXAMINATION: Stethoscope,
  DENTAL: Smile,
  DENTAL_CARE: Smile,
};

const MEDICAL_BADGE: Record<string, { bg: string; border: string; color: string; label: string; Icon: React.ElementType }> = {
  DISPUTED: { bg: '#FFEAF2', border: '#F7BFD8', color: '#D6447A', label: 'Cần xem xét', Icon: AlertTriangle },
  VERIFIED: { bg: '#EBFFE2', border: '#D1F5BF', color: '#77C852', label: 'Đã xác minh', Icon: CheckCircle2 },
  PENDING: { bg: '#FBF7EB', border: '#F3E1AE', color: '#E8A53C', label: 'Đang xác minh', Icon: Info },
};

interface PetDetailPhoneModalProps {
  pet: (Pet & Record<string, any>) | null;
  onClose: () => void;
  onEditPress?: () => void;
  onEditMedicalRecord?: (record: any) => void;
  onDeleteMedicalRecord?: (record: any) => void;
  onReportMedicalRecord?: (record: any) => void;
}

export const PetDetailPhoneModal: React.FC<PetDetailPhoneModalProps> = ({
  pet,
  onClose,
  onEditPress,
  onEditMedicalRecord,
  onDeleteMedicalRecord,
  onReportMedicalRecord,
}) => {
  const [showHistory, setShowHistory] = useState(true);
  const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);
  const [openMenuRecordId, setOpenMenuRecordId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Preview-only: chỉ đổi state cục bộ, KHÔNG gọi petService.toggleLostMode.
  const [isLostModePreview, setIsLostModePreview] = useState(false);

  if (!pet) return null;

  const displayAvatar = pet.avatarUrl || pet.images?.[0] || null;
  const hasValidQRCode = !!pet.qrCodeUrl && pet.qrVerificationStatus === 'VERIFIED';
  const displayId =
    pet.tags?.[0]?.id?.toString()?.slice(0, 8)?.toUpperCase() ||
    pet.code ||
    pet.id?.toString()?.slice(0, 8)?.toUpperCase();

  const genderLower = String(pet.gender || '').toLowerCase();
  const genderLabel = ['nam', 'male'].includes(genderLower)
    ? 'Đực'
    : ['nữ', 'nu', 'female'].includes(genderLower)
      ? 'Cái'
      : pet.gender || 'Chưa cập nhật';

  const sterilizedLabel =
    pet.isSpayedNeutered === true ? 'Có' : pet.isSpayedNeutered === false ? 'Không' : 'Chưa cập nhật';

  const displayContactName = pet.contactName || pet.shelter?.name || 'Chưa cập nhật';
  const displayContactPhone = pet.contactPhone || 'Chưa cập nhật';
  const displayContactAddress = pet.contactAddress || 'Chưa cập nhật';

  const pawHistory: any[] = Array.isArray(pet.pawHistory) ? pet.pawHistory : [];
  const medicalRecords: any[] = Array.isArray(pet.medicalRecords) ? pet.medicalRecords : [];

  const sortedHistory = [...pawHistory].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const InfoRow = ({ label1, value1, label2, value2 }: any) => (
    <div className="flex justify-between mb-3">
      <div className="flex-1">
        <p className="text-black text-[12px] font-medium mb-0.5">{label1}</p>
        <p className="text-[#8E8E93] text-[12px]">{value1}</p>
      </div>
      <div className="flex-1">
        <p className="text-black text-[12px] font-medium mb-0.5">{label2}</p>
        <p className="text-[#8E8E93] text-[12px]">{value2}</p>
      </div>
    </div>
  );

  const OwnerRow = ({ label, value, isLast = false }: any) => (
    <div className={`flex justify-between items-center py-2.5 ${!isLast ? 'border-b border-gray-100' : ''}`}>
      <p className="text-black text-[12px] font-medium">{label}</p>
      <p className="text-[#8E8E93] text-[12px] text-right ml-3 truncate">{value}</p>
    </div>
  );

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4"
      onClick={onClose}
    >
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center text-gray-600 hover:text-black z-10"
        >
          <X size={16} />
        </button>

        {/* Bezel — cùng phong cách với PhonePreview trong ShelterProfileForm */}
        <div className="w-[320px] bg-[#111] rounded-[42px] p-2.5 shadow-2xl">
          <div className="relative w-full h-[660px] bg-white rounded-[34px] overflow-hidden">
            {/* Dynamic Island */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[84px] h-[22px] bg-black rounded-full z-30" />

            {/* Status bar */}
            <div className="absolute top-2.5 left-5 right-5 z-20 flex items-center justify-between text-[11px] font-medium text-black/80">
              <span>9:41</span>
              <span className="flex items-center gap-1">
                <Wifi size={12} />
                <BatteryFull size={14} />
              </span>
            </div>

            {/* Header */}
            <div className="absolute top-9 left-0 right-0 z-20 flex items-center justify-between px-4">
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white shadow flex items-center justify-center"
              >
                <ChevronLeft size={16} />
              </button>
              <p className="text-[14px] font-semibold text-black truncate max-w-[180px]">
                {`Hồ sơ của ${pet.name}`}
              </p>
              <div className="w-8" />
            </div>

            {/* Scrollable content */}
            <div
              className="absolute inset-0 overflow-y-auto pt-[70px] pb-8"
              onClick={() => setActiveTooltipId(null)}
            >
              {pet.needsQrReplacement && (
                <div className="mx-4 mb-3 bg-[#FDF5E8] rounded-lg py-1.5 text-center">
                  <span className="text-[11px] font-semibold text-[#CF7900] underline">
                    Thẻ này cần thay thế ngay!
                  </span>
                </div>
              )}

              {/* Avatar + ID */}
              <div className="flex flex-col items-center mb-4">
                <div className="w-20 h-20 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden shadow-sm relative">
                  {displayAvatar ? (
                    <Image src={displayAvatar} alt={pet.name} fill className="object-cover" />
                  ) : (
                    <PawPrint size={26} className="text-gray-300" />
                  )}
                </div>
                <p className="text-[15px] font-semibold text-gray-900 mt-2.5 mb-1.5">{pet.name}</p>
                {hasValidQRCode && displayId && (
                  <span className="bg-[#F3F4F6] px-2.5 py-0.5 rounded-full border border-[#E5E7EB] text-[#6B7280] font-medium text-[11px] tracking-wide">
                    ID: {displayId}
                  </span>
                )}
              </div>

              {/* Lost mode / QR required */}
              <div className="px-4 mb-5">
                {hasValidQRCode ? (
                  <div
                    className={`rounded-[16px] p-4 flex items-center justify-between border ${
                      isLostModePreview ? 'bg-[#FEF2F2] border-[#FFE5E5]' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-start flex-1 mr-3">
                      {isLostModePreview && <AlertCircle size={16} className="text-[#8B3A3A] mt-0.5 mr-2 shrink-0" />}
                      <div>
                        <p className={`font-medium text-[13px] ${isLostModePreview ? 'text-[#8B3A3A]' : 'text-black'}`}>
                          Lost Pet Mode
                        </p>
                        <p className={`text-[11px] mt-0.5 ${isLostModePreview ? 'text-[#8B3A3A]/80' : 'text-gray-400'}`}>
                          {isLostModePreview ? 'Bật · Bé đang được tìm kiếm' : 'Tắt · Bé đang an toàn'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsLostModePreview((v) => !v)}
                      className={`w-10 h-6 rounded-full relative transition-colors shrink-0 ${
                        isLostModePreview ? 'bg-[#8B3A3A]' : 'bg-gray-200'
                      }`}
                      title="Chỉ đổi trạng thái xem trước, không gọi API thật"
                    >
                      <span
                        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                          isLostModePreview ? 'translate-x-4' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                ) : (
                  <div className="bg-[#FDFCE8] border border-[#FDF094] rounded-[16px] p-4">
                    <p className="text-[13px] font-bold text-[#AC8530] mb-0.5">Cần quét thẻ QR</p>
                    <p className="text-[11px] text-[#AC8530] leading-4">
                      Quét thẻ QR để bật PawHistory & tính năng báo mất.
                    </p>
                  </div>
                )}
              </div>

              {/* Pet Information */}
              <div className="px-4 mb-5">
                <p className="font-semibold text-[13px] text-black mb-2.5">Thông tin Pet</p>
                <div className="bg-white rounded-[18px] p-4 border border-gray-200">
                  <InfoRow label1="Giới tính" value1={genderLabel} label2="Triệt sản" value2={sterilizedLabel} />
                  <InfoRow
                    label1="Giống"
                    value1={showText(pet.breed) || 'Chưa cập nhật'}
                    label2="Màu sắc"
                    value2={showText(pet.color) || 'Chưa cập nhật'}
                  />
                  <InfoRow
                    label1="Ngày sinh"
                    value1={pet.dob ? new Date(pet.dob).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                    label2="Cân nặng"
                    value2={pet.weight != null ? `${pet.weight} kg` : 'Chưa cập nhật'}
                  />
                  <div className="h-px bg-gray-100 w-full my-2.5" />
                  <p className="text-black text-[12px] font-medium mb-1.5">Ghi chú</p>
                  <p className="text-[#8E8E93] text-[12px] leading-4">
                    {showText(pet.description) || 'Chưa cập nhật'}
                  </p>
                </div>
              </div>

              {/* Owner / Shelter info */}
              <div className="px-4 mb-5">
                <p className="font-semibold text-[13px] text-black mb-2.5">Thông tin liên hệ</p>
                <div className="bg-white rounded-[16px] border border-gray-200 px-4">
                  <OwnerRow label="Họ tên" value={displayContactName} />
                  <OwnerRow label="SĐT" value={displayContactPhone} />
                  <OwnerRow label="Địa chỉ" value={displayContactAddress} isLast />
                </div>
              </div>

              {/* PawHistory */}
              <div className="px-4 mb-5">
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-[13px] font-semibold text-black">PawHistory · Hành trình</p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowHistory((v) => !v);
                    }}
                    className="text-[11px] text-[#F2A465] font-medium"
                  >
                    {showHistory ? 'Ẩn' : 'Xem'}
                  </button>
                </div>

                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    showHistory ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="py-4 px-3 border border-gray-200 rounded-[18px] bg-white">
                    {sortedHistory.length > 0 ? (
                      sortedHistory.map((item, index) => {
                        const isLastItem = index === sortedHistory.length - 1;
                        const cfg = HISTORY_TYPE_CONFIG[item.type] ?? DEFAULT_HISTORY_CONFIG;
                        const Icon = cfg.Icon;
                        const title = item.title || HISTORY_TYPE_LABEL[item.type] || item.type;
                        const tooltipId = item.id ?? index;

                        return (
                          <div key={tooltipId} className="flex min-h-[48px]">
                            <div className="w-8 relative mr-2 shrink-0">
                              {!isLastItem && (
                                <div
                                  className="absolute w-[1.5px]"
                                  style={{
                                    top: 26,
                                    bottom: -4,
                                    left: 13,
                                    backgroundColor: cfg.line,
                                    backgroundImage: item.isPending
                                      ? `linear-gradient(${cfg.line} 60%, transparent 40%)`
                                      : undefined,
                                    backgroundSize: item.isPending ? '1.5px 8px' : undefined,
                                  }}
                                />
                              )}
                              <div
                                className="w-[28px] h-[28px] rounded-full flex items-center justify-center relative z-10"
                                style={{ backgroundColor: cfg.bg }}
                              >
                                <Icon size={14} style={{ color: cfg.color }} />
                              </div>
                            </div>

                            <div className={`flex-1 ${!isLastItem ? 'pb-3' : ''}`}>
                              <div className="flex justify-between items-start">
                                <div className="flex-1 flex flex-wrap items-center pr-2 relative">
                                  <p className="text-[12px] font-medium text-black leading-[16px] truncate">{title}</p>
                                  {item.isPending && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveTooltipId((cur) => (cur === tooltipId ? null : tooltipId));
                                      }}
                                      className="ml-1"
                                    >
                                      <AlertCircle size={12} className="text-gray-300" />
                                    </button>
                                  )}
                                  {activeTooltipId === tooltipId && (
                                    <div className="absolute bottom-full left-0 mb-2 w-[160px] bg-white rounded-lg shadow-lg border border-gray-100 p-2.5 z-30">
                                      <p className="text-[10px] text-gray-600 leading-[14px]">
                                        Hồ sơ sẽ được thêm vào hành trình sau khi xác minh hoàn tất.
                                      </p>
                                    </div>
                                  )}
                                </div>
                                <p className="text-[10px] text-[#8E8E93] shrink-0 pt-0.5">{fmtDate(item.date)}</p>
                              </div>
                              <p className="text-[11px] text-[#9B9B9B] mt-0.5 leading-[14px]">
                                {item.description || ''}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-center text-[#8E8E93] py-3 text-[12px] italic">
                        Chưa có lịch sử hoạt động.
                      </p>
                    )}

                    <div className="flex items-center justify-center gap-1.5 mt-3 bg-[#F5F5F5] rounded-lg py-2 mx-1">
                      <Lock size={11} className="text-[#8E8E93]" />
                      <span className="text-[10px] text-[#8E8E93]">
                        Hành trình không thể bị xoá hay chỉnh sửa.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Medical records */}
              <div className="px-4 mb-6">
                <p className="text-[13px] font-semibold text-[#111827] mb-2.5">Hồ sơ y tế</p>

                {medicalRecords.length > 0 ? (
                  <div className="flex flex-col gap-2.5">
                    {medicalRecords.map((record, index) => {
                      const Icon = MEDICAL_TYPE_ICON[String(record.type).toUpperCase()] || FileText;
                      const badge = MEDICAL_BADGE[record.verificationStatus] || MEDICAL_BADGE.PENDING;
                      const BadgeIcon = badge.Icon;
                      const recordId = record.id ?? `tmp_${index}`;
                      const isMenuOpen = openMenuRecordId === recordId;
                      const isPending = record.verificationStatus === 'PENDING' || !record.verificationStatus;
                      const isVerified = record.verificationStatus === 'VERIFIED';
                      const isDisputed = record.verificationStatus === 'DISPUTED';

                      return (
                        <div
                          key={recordId}
                          className="relative border border-gray-200 rounded-[14px] p-2.5 flex items-start bg-white"
                        >
                          <div className="w-[26px] h-[26px] rounded-full bg-[#EDEDED] flex items-center justify-center shrink-0">
                            <Icon size={13} className="text-[#999999]" />
                          </div>

                          <div className="flex-1 mx-2.5 min-w-0">
                            <div className="flex justify-between items-center gap-2">
                              <div className="flex-1 flex flex-wrap items-center gap-1.5 min-w-0">
                                <p className="text-[12px] text-black font-medium truncate">
                                  {showText(record.recordName)}
                                </p>
                                <span
                                  className="flex items-center gap-1 px-1.5 py-[2px] rounded-full border text-[9px] font-medium shrink-0"
                                  style={{ backgroundColor: badge.bg, borderColor: badge.border, color: badge.color }}
                                >
                                  <BadgeIcon size={9} />
                                  {badge.label}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuRecordId((cur) => (cur === recordId ? null : recordId));
                                }}
                                className="shrink-0 text-gray-400 hover:text-gray-600"
                              >
                                <MoreVertical size={13} />
                              </button>
                            </div>
                            <p className="text-[10px] text-[#8E8E93] mt-0.5">
                              Loại: {record.type || '—'} · Ngày: {fmtDate(record.recordDate)}
                            </p>
                            {record.hasNextDueDate && record.nextDueDate && (
                              <p className="text-[10px] font-medium text-[#E89B5A] mt-0.5">
                                Lịch tiếp theo: {fmtDate(record.nextDueDate)}
                              </p>
                            )}
                          </div>

                          {isMenuOpen && (
                            <div
                              className="absolute right-2 top-9 w-36 bg-white rounded-xl border border-gray-100 shadow-lg z-20 overflow-hidden"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                className="w-full text-left px-3 py-2 text-[11px] text-gray-700 hover:bg-gray-50"
                                onClick={() => {
                                  setOpenMenuRecordId(null);
                                  if (record.images?.[0]) setLightboxImage(record.images[0]);
                                }}
                              >
                                Xem hồ sơ
                              </button>
                              {isVerified && (
                                <button
                                  type="button"
                                  className="w-full text-left px-3 py-2 text-[11px] text-red-600 border-t border-gray-50 hover:bg-red-50"
                                  onClick={() => {
                                    setOpenMenuRecordId(null);
                                    onReportMedicalRecord?.(record);
                                  }}
                                >
                                  Báo cáo
                                </button>
                              )}
                              {isPending && (
                                <>
                                  <button
                                    type="button"
                                    className="w-full text-left px-3 py-2 text-[11px] text-gray-700 border-t border-gray-50 hover:bg-gray-50"
                                    onClick={() => {
                                      setOpenMenuRecordId(null);
                                      onEditMedicalRecord?.(record);
                                    }}
                                  >
                                    Sửa hồ sơ
                                  </button>
                                  <button
                                    type="button"
                                    className="w-full text-left px-3 py-2 text-[11px] text-red-600 border-t border-gray-50 hover:bg-red-50"
                                    onClick={() => {
                                      setOpenMenuRecordId(null);
                                      onDeleteMedicalRecord?.(record);
                                    }}
                                  >
                                    Xoá
                                  </button>
                                </>
                              )}
                              {isDisputed && (
                                <div className="px-3 py-2 border-t border-gray-50">
                                  <p className="text-[10px] text-[#8E8E93] italic leading-[14px]">
                                    Hồ sơ đang được xem xét lại sau báo cáo của bạn.
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white border border-dashed border-gray-200 rounded-xl py-5 flex flex-col items-center">
                    <FileText size={18} className="text-gray-300 mb-1.5" />
                    <p className="text-[13px] text-black font-medium mb-1">Chưa có hồ sơ y tế</p>
                    <p className="text-[11px] text-[#A9ACB4] text-center px-6">
                      Các hồ sơ được thêm vào sẽ hiển thị ở đây.
                    </p>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="px-4 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => onEditPress?.()}
                  className="w-full bg-[#E89B5A] py-3.5 rounded-2xl text-white font-semibold text-[14px] shadow-sm"
                >
                  Sửa hồ sơ
                </button>
                <button
                  type="button"
                  className="w-full py-3.5 rounded-2xl border border-[#FF9C56] text-[#E89B5A] font-medium text-[14px] bg-white"
                >
                  {hasValidQRCode ? 'Xem mã QR' : 'Quét mã QR'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox ảnh hồ sơ y tế — bản rút gọn của Fullscreen Image Viewer bên mobile */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60]"
          onClick={() => setLightboxImage(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute top-6 right-6 w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white"
          >
            <X size={18} />
          </button>
          <div className="relative w-[90%] max-w-[500px] h-[70%]">
            <Image src={lightboxImage} alt="Hồ sơ y tế" fill className="object-contain" />
          </div>
        </div>
      )}
    </div>
  );
};

export default PetDetailPhoneModal;