'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FiChevronLeft,
  FiChevronDown,
  FiEdit2,
  FiTrash2,
  FiCheck,
  FiX,
  FiLock,
  FiFileText,
  FiClock,
  FiPhone,
  FiMail,
  FiCalendar,
} from 'react-icons/fi';
import {
  PawPrint,
  Cake,
  QrCode,
  Home,
  Syringe,
  Stethoscope,
  Smile,
  User as UserIcon,
  HeartHandshake,
  SparklesIcon,
  Send,
  MoreVertical,
  Upload,
  Calendar,
  Eye,
  Pencil,
  Download,
  ChevronDown,
} from 'lucide-react';
import axiosClient from '@/lib/api/axiosClient';
import { usePetActions } from '@/stores/usePetStore';
import { PetPublic3DModal } from '@/components/PetPublic3DModal';
import { AdoptionApplication } from '@/types/application';
import { ApplicationDetailModal } from '@/modules/shelter/applications/components/ApplicationDetailModal';
import { useApplicationActions } from '@/stores/useApplicationStore';
import { MoveToPendingModal } from '@/modules/shelter/applications/components/MoveToPendingModal';
import { NeedMoreInfoModal } from '@/modules/shelter/applications/components/NeedMoreInfoModal';
import { InterviewScheduleModal } from '@/modules/shelter/applications/components/InterviewScheduleModal';
import { ApproveApplicationModal } from '@/modules/shelter/applications/components/ApproveApplicationModal';
import { applicationService } from '@/services/applicationService';
import {
  localizeHistoryDescription,
  localizeHistoryTitle,
  formatAgeFromDob,
} from '@/utils/pawHistoryLocalize';
import { PET_STATUS_CONFIG, getPetStatusMeta } from '@/constants/petStatus';
import type { PetStatus } from '@/types/pet';
import { PetStatusDropdown } from '@/components/PetStatusBadge';

const STATUS_BADGE: Record<string, { label: string; bg: string; border: string; text: string }> = {
  SUBMITTED: { label: 'Mới', bg: '#F3F4F6', border: '#E5E7EB', text: '#6B7280' },
  PENDING: { label: 'Đang xem xét', bg: '#EFF6FF', border: '#BFDBFE', text: '#3B82F6' },
  NEED_MORE_INFO: { label: 'Cần bổ sung', bg: '#FFF8F0', border: '#FFE1C2', text: '#E89B5A' },
  INTERVIEW_SCHEDULED: { label: 'Hẹn phỏng vấn', bg: '#F4E8FF', border: '#E9D5FF', text: '#8A38D4' },
  APPROVED: { label: 'Đã duyệt', bg: '#EFF6FF', border: '#BFDBFE', text: '#2563EB' },
  ADOPTION_COMPLETED: { label: 'Đã nhận nuôi', bg: '#F2FCF5', border: '#D1F2D9', text: '#1B8A44' },
  CLOSED: { label: 'Đóng', bg: '#F3F4F6', border: '#E5E7EB', text: '#6B7280' },
};

const isValidImageUrl = (url: unknown): url is string => typeof url === 'string' && url.trim().length > 0;
const getImageUrl = (img: unknown): string | null => {
  if (typeof img === 'string') return isValidImageUrl(img) ? img : null;
  if (img && typeof img === 'object' && 'url' in (img as any)) {
    const u = (img as any).url;
    return isValidImageUrl(u) ? u : null;
  }
  return null;
};
type MaybeBilingual = string | { vi?: string; en?: string } | null | undefined;
const showText = (val: MaybeBilingual): string => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  return val.vi || val.en || '';
};

const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString('vi-VN') : '');
const isAgeOnlyDob = (dob?: string | null): boolean => {
  if (!dob) return false;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return false;
  return d.getUTCMonth() === 0 && d.getUTCDate() === 1;
};
const getAgeLabel = (dob?: string | null): string => {
  if (!dob) return 'Chưa rõ';
  const dobDate = new Date(dob);
  if (Number.isNaN(dobDate.getTime())) return 'Chưa rõ';
  const diffMs = Date.now() - dobDate.getTime();
  const ageDate = new Date(diffMs);
  const years = Math.abs(ageDate.getUTCFullYear() - 1970);
  const months = ageDate.getUTCMonth();
  if (years > 0) return `${years} tuổi`;
  if (months > 0) return `${months} tháng tuổi`;
  return 'Sơ sinh';
};


const TRAIT_STYLES = [
  { bg: '#FBF7EB', border: '#E8A53C', color: '#E8A53C' },
  { bg: '#E8F1FF', border: '#5A90DA', color: '#5A90DA' },
  { bg: '#EBFFE2', border: '#77C852', color: '#77C852' },
];

const HISTORY_TYPE_CONFIG: Record<string, { Icon: React.ElementType; bg: string; color: string }> = {
  BIRTH: { Icon: Cake, bg: '#FFF4EC', color: '#F2A465' },
  CREATED: { Icon: QrCode, bg: '#EAE7FB', color: '#885BF2' },
  QR_LINKED: { Icon: QrCode, bg: '#EAE7FB', color: '#885BF2' },
  TRANSFER: { Icon: Home, bg: '#EBFFE2', color: '#77C582' },
  VACCINE: { Icon: Syringe, bg: '#E3F0FF', color: '#5A90DA' },
  DENTAL_CARE: { Icon: Smile, bg: '#E8FFD8', color: '#5FA83D' },
  ANNUAL_CHECKUP: { Icon: Stethoscope, bg: '#E8FFD8', color: '#5FA83D' },
  CURRENT_OWNER: { Icon: UserIcon, bg: '#FFE9B8', color: '#CF7900' },
  PREVIOUS_OWNER: { Icon: UserIcon, bg: '#FFE9B8', color: '#CF7900' },
  UNDER_SHELTER_CARE: { Icon: HeartHandshake, bg: '#FFE4F0', color: '#D6447A' },
};

const DEFAULT_HISTORY_CONFIG = { Icon: Cake, bg: '#F5F5F5', color: '#8E8E93' };

const HISTORY_TYPE_LABEL: Record<string, string> = {
  BIRTH: 'Date of Birth',
  TRANSFER: 'Curren Owner',
  VACCINE: 'DHPP Vaccination',
  ANNUAL_CHECKUP: 'Annual Checkup',
  QR_LINKED: 'QR Code Registered',
};

interface NoteItem {
  id: string;
  author: string;
  avatar: string | null;
  content: string;
  date: string;
}

const MEDICAL_STATUS_STYLE: Record<string, { label: string; className: string; icon: string }> = {
  PENDING: { label: 'Đang xác minh', className: 'bg-[#FFF8E5] text-[#E8A53C] border-[#FFE1C2]', icon: '⏱' },
  VERIFIED: { label: 'Đã xác minh', className: 'bg-[#EBFFE2] text-[#77C852] border-[#D1F5BF]', icon: '✓' },
  DISPUTED: { label: 'Đang tranh chấp', className: 'bg-[#FFE2E2] text-[#FF5A5A] border-[#FFB4B4]', icon: '⚠' },
};

async function uploadMedicalFile(file: File): Promise<string> {
  const { data } = await axiosClient.post('/storage/presigned-url', {
    fileName: file.name,
    fileType: file.type || 'application/octet-stream',
    folder: 'medical-records',
  });
  const res = await fetch(data.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!res.ok) throw new Error('Upload hồ sơ y tế thất bại');
  return data.fileUrl;
}

type TabKey = 'detail' | 'application' | 'document';
const TABS: { key: TabKey; label: string }[] = [
  { key: 'detail', label: 'Chi tiết' },
  { key: 'application', label: 'Đơn xin nhận nuôi' },
  { key: 'document', label: 'Tài liệu' },
];
const ToggleSwitch: React.FC<{ checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }> = ({
  checked,
  onChange,
  disabled,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${checked ? 'bg-[#22C55E]' : 'bg-gray-300'} disabled:opacity-50 disabled:cursor-not-allowed`}
  >
    <span
      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
    />
  </button>
);
const VACCINE_OPTIONS: Record<'Dog' | 'Cat', { id: string; label: string }[]> = {
  Dog: [
    { id: 'DOG_DHP', label: 'DHP (3in1)' },
    { id: 'DOG_DHPP', label: 'DHPP (5/7in1)' },
    { id: 'DOG_RABIES', label: 'Rabies (Dại)' },
    { id: 'DOG_LEPTO', label: 'Lepto' },
    { id: 'DOG_BORDETELLA', label: 'Bordetella' },
    { id: 'DOG_CIV', label: 'CIV' },
  ],
  Cat: [
    { id: 'CAT_FVRCP', label: 'FVRCP (3/4in1)' },
    { id: 'CAT_RABIES', label: 'Rabies (Dại)' },
    { id: 'CAT_FELV', label: 'FeLV' },
  ],
};

function resolveSpeciesKey(species: any): 'Dog' | 'Cat' {
  if (!species) return 'Dog';
  let raw = species;
  if (typeof raw === 'object') raw = raw.en || raw.vi || '';
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        raw = parsed.en || parsed.vi || '';
      } catch {
        // giữ raw gốc nếu parse lỗi
      }
    }
  }
  const normalized = String(raw).toLowerCase();
  if (normalized.includes('cat') || normalized.includes('mèo') || normalized.includes('meo')) return 'Cat';
  return 'Dog';
}
const NEXT_STATUS_MAP: Partial<Record<AdoptionApplication['status'], ApplicationStatus>> = {
  SUBMITTED: 'PENDING',
  PENDING: 'INTERVIEW_SCHEDULED',
  INTERVIEW_SCHEDULED: 'APPROVED',
};
type VaccineCategory = 'RABIES' | 'CORE' | 'OTHER';
const CORE_VACCINE_IDS = ['DOG_DHP', 'DOG_DHPP', 'CAT_FVRCP'];

const getVaccineCategory = (id: string): VaccineCategory => {
  if (id.endsWith('_RABIES')) return 'RABIES';
  if (CORE_VACCINE_IDS.includes(id)) return 'CORE';
  return 'OTHER';
};
const MEDICAL_TYPE_LABEL: Record<string, string> = {
  VACCINATION: 'Tiêm chủng',
  ANNUAL_CHECKUP: 'Khám tổng quát',
  DENTAL_CARE: 'Khám răng miệng',
  OTHER: 'Khác',
  'Tiêm chủng': 'Tiêm chủng',
  'Khám tổng quát': 'Khám tổng quát',
  'Khám răng miệng': 'Khám răng miệng',
  'Khác': 'Khác',
};
type VaccinationStatusKey = 'NOT_VACCINATED' | 'IN_PROGRESS' | 'VACCINATED';

const VACCINATION_STATUS_CONFIG: Record<VaccinationStatusKey, { label: string; color: string; bgIcon: string }> = {
  NOT_VACCINATED: { label: 'Chưa tiêm', color: '#8E8E93', bgIcon: '#F0F0F0' },
  IN_PROGRESS: { label: 'Đang tiêm', color: '#E8A53C', bgIcon: '#FFF4DE' },
  VACCINATED: { label: 'Đầy đủ', color: '#E89B5A', bgIcon: '#FFF4EC' },
};

const getVaccinationStatusKey = (pet: Record<string, any>): VaccinationStatusKey => {
  if (pet?.vaccinationStatus) return pet.vaccinationStatus as VaccinationStatusKey;
  return pet?.isVaccinated === false ? 'NOT_VACCINATED' : 'VACCINATED';
};

export default function PetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const { deletePet } = usePetActions() as ReturnType<typeof usePetActions> & {
    deletePet?: (id: string) => Promise<boolean | void>;
  };
  const { moveApplication } = useApplicationActions();
  const [pendingApp, setPendingApp] = useState<AdoptionApplication | null>(null);
  const [needInfoApp, setNeedInfoApp] = useState<AdoptionApplication | null>(null);
  const [interviewApp, setInterviewApp] = useState<AdoptionApplication | null>(null);
  const [approveApp, setApproveApp] = useState<AdoptionApplication | null>(null);
  const [pet, setPet] = useState<Record<string, any> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('detail');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [show3DModal, setShow3DModal] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<AdoptionApplication | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [newNoteInput, setNewNoteInput] = useState('');
  const [applications, setApplications] = useState<AdoptionApplication[]>([]);

  const [medicalFile, setMedicalFile] = useState<File | null>(null);
  const [isSavingMedical, setIsSavingMedical] = useState(false);

  const [showMedicalForm, setShowMedicalForm] = useState(true);
  const [medicalType, setMedicalType] = useState('');
  const [medicalDetail, setMedicalDetail] = useState('');
  const [medicalDate, setMedicalDate] = useState('');
  const [medicalHasReminder, setMedicalHasReminder] = useState(false);
  const [medicalNextDueDetail, setMedicalNextDueDetail] = useState('');
  const [medicalNextDueDate, setMedicalNextDueDate] = useState('');
  const [medicalIsPublic, setMedicalIsPublic] = useState(true);
  const [doseNumber, setDoseNumber] = useState<1 | 2 | 3>(1);
  const [vaccineId, setVaccineId] = useState('');
  const medicalFileInputRef = useRef<HTMLInputElement>(null);
  const medicalList: any[] = Array.isArray(pet?.medicalRecords) ? pet.medicalRecords : [];

  const prevMedicalTypeRef = useRef(medicalType);
  useEffect(() => {
    if (prevMedicalTypeRef.current === medicalType) return;
    prevMedicalTypeRef.current = medicalType;
    setMedicalDetail('');
    setVaccineId('');
    setDoseNumber(1);
  }, [medicalType]);
  const safeSpecies = resolveSpeciesKey(pet?.species);

  useEffect(() => {
    if (!medicalType) return;

    if (medicalType === 'OTHER') {
      setMedicalHasReminder(false);
      setMedicalNextDueDetail('');
      setMedicalNextDueDate('');
      return;
    }
    if (medicalType === 'VACCINATION' && !vaccineId) {
      setMedicalHasReminder(false);
      setMedicalNextDueDetail('');
      setMedicalNextDueDate('');
      return;
    }

    setMedicalHasReminder(true);
    const base = medicalDate ? new Date(medicalDate) : new Date();
    const next = new Date(base);

    if (medicalType === 'VACCINATION') {
      if (vaccineId === 'DOG_RABIES' || vaccineId === 'CAT_RABIES') {
        next.setDate(next.getDate() + 365);
      } else if (vaccineId === 'DOG_BORDETELLA') {
        next.setDate(next.getDate() + 180);
      } else if (doseNumber === 3) {
        next.setDate(next.getDate() + 365);
      } else {
        next.setDate(next.getDate() + 28);
      }
    } else if (medicalType === 'ANNUAL_CHECKUP') {
      next.setFullYear(next.getFullYear() + 1);
    } else if (medicalType === 'DENTAL_CARE') {
      next.setMonth(next.getMonth() + 6);
    }

    setMedicalNextDueDetail(medicalDetail || medicalType);
    setMedicalNextDueDate(next.toISOString().slice(0, 10));
  }, [medicalType, medicalDetail, medicalDate, doseNumber, vaccineId]);

  useEffect(() => {
    if (!pet?.id) return;
    axiosClient
      .get(`/pets/${pet.id}/notes`)
      .then((res) => setNotes(res.data))
      .catch((err) => console.error('[PetDetailPage] Lỗi tải ghi chú:', err));
  }, [pet?.id]);

  useEffect(() => {
    if (pet?.applications && Array.isArray(pet.applications)) {
      setApplications(pet.applications);
    }
  }, [pet?.id]);

  useEffect(() => {
    let active = true;
    (async () => {
      setIsLoading(true);
      setLoadError(false);
      try {
        // 👇 SỬA LẠI ĐỂ GỌI ĐÚNG API CỦA SHELTER (Tránh bị thiếu data hay dính Cache Public)
        const res = await axiosClient.get(`/shelter-dashboard/pets/${id}`);
        if (active) {
          setPet(res.data);
          const firstAppId = Array.isArray(res.data?.applications) ? res.data.applications[0]?.id : undefined;
          if (firstAppId) setSelectedApplicationId(firstAppId);
        }
      } catch (err) {
        console.warn('[PetDetailPage] API error:', err);
        if (active) setLoadError(true);
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  // 👇 SỬA LẠI HÀM NÀY ĐỂ BẮT ĐÚNG TRẠNG THÁI MỞ MODAL NHƯ BÊN KANBAN BOARD
  const handleOpenApplication = (app: AdoptionApplication) => {
    if (app.status === 'NEED_MORE_INFO') {
      setNeedInfoApp(app);
      return;
    }
    if (app.status === 'SUBMITTED' || app.status === 'PENDING') {
      setPendingApp(app);
      return;
    }

    const nextStatus = NEXT_STATUS_MAP[app.status];
    switch (nextStatus) {
      case 'INTERVIEW_SCHEDULED':
        setInterviewApp(app);
        return;
      case 'APPROVED':
        setApproveApp(app);
        return;
      default:
        // APPROVED, ADOPTION_COMPLETED, CLOSED -> xem chi tiết
        setSelectedApplication(app);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!pet || pet.status === newStatus) return;

    const prevStatus = pet.status;
    setPet((prev) => (prev ? { ...prev, status: newStatus } : prev));

    try {
      setIsUpdatingStatus(true);
      await axiosClient.patch(`/pets/${pet.id}`, { status: newStatus });
    } catch (err) {
      console.error('[PetDetailPage] Cập nhật trạng thái thất bại:', err);
      setPet((prev) => (prev ? { ...prev, status: prevStatus } : prev));
      alert('Cập nhật trạng thái thất bại. Vui lòng thử lại.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!pet) return;
    const confirmed = window.confirm(`Bạn có chắc muốn xóa "${pet.name}"? Hành động này không thể hoàn tác.`);
    if (!confirmed) return;
    try {
      if (deletePet) await deletePet(pet.id);
      router.push('/shelter/pets');
    } catch (err) {
      console.error('[PetDetailPage] Xóa pet thất bại:', err);
      alert('Không thể xóa pet này, vui lòng thử lại.');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = newNoteInput.trim();
    if (!content || !pet?.id) return;
    try {
      setIsSubmittingNote(true);
      const res = await axiosClient.post(`/pets/${pet.id}/notes`, { content });
      setNotes((prev) => [res.data, ...prev]);
      setNewNoteInput('');
    } catch (err) {
      console.error('[PetDetailPage] Gửi ghi chú thất bại:', err);
      alert('Gửi ghi chú thất bại.');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleSaveMedical = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicalType || !pet?.id) return;
    if (!medicalFile) {
      alert('Vui lòng tải lên ít nhất 1 ảnh/hồ sơ trước khi lưu.');
      return;
    }

    try {
      setIsSavingMedical(true);
      const uploadedImages = medicalFile ? [await uploadMedicalFile(medicalFile)] : [];

      const existingRecords = (pet.medicalRecords || []).map((r: any) => ({
        id: r.id,
        type: r.type,
        recordName: typeof r.recordName === 'object' ? (r.recordName?.vi || r.recordName?.en || '') : r.recordName,
        recordDate: r.recordDate,
        images: Array.isArray(r.images) ? r.images : [],
        hasNextDueDate: !!r.hasNextDueDate,
        nextDueDate: r.nextDueDate || null,
        nextDueName: typeof r.nextDueName === 'object' ? (r.nextDueName?.vi || r.nextDueName?.en || '') : (r.nextDueName || undefined),
        isPublic: r.isPublic ?? true,
      }));

      const newRecord = {
        type: medicalType,
        vaccineCategory: medicalType === 'VACCINATION' ? getVaccineCategory(vaccineId) : undefined,
        recordName: medicalDetail || medicalType,
        recordDate: medicalDate ? new Date(medicalDate).toISOString() : new Date().toISOString(),
        images: uploadedImages,
        hasNextDueDate: medicalHasReminder,
        ...(medicalHasReminder && medicalNextDueDate ? { nextDueDate: new Date(medicalNextDueDate).toISOString() } : {}),
        ...(medicalHasReminder && medicalNextDueDetail ? { nextDueName: medicalNextDueDetail } : {}),
        isPublic: medicalIsPublic,
      };

      const res = await axiosClient.patch(`/pets/${pet.id}`, {
        medicalRecords: [...existingRecords, newRecord],
      });

      setPet((prev) =>
        prev ? { ...prev, medicalRecords: res.data?.data?.medicalRecords ?? prev.medicalRecords } : prev
      );

      setMedicalType('');
      setMedicalDetail('');
      setMedicalDate('');
      setMedicalFile(null);
      setMedicalHasReminder(false);
      setMedicalNextDueDetail('');
      setMedicalNextDueDate('');
      setMedicalIsPublic(true);
      setDoseNumber(1);
      setVaccineId('');
    } catch (err) {
      console.error('[PetDetailPage] Lưu hồ sơ y tế thất bại:', err);
      alert('Lưu hồ sơ y tế thất bại. Vui lòng thử lại.');
    } finally {
      setIsSavingMedical(false);
    }
  };

  const handleDeleteDocument = async (recordId: string) => {
    if (!pet) return;
    const confirmed = window.confirm('Bạn có chắc muốn xóa hồ sơ y tế này?');
    if (!confirmed) return;
    try {
      await axiosClient.delete(`/pets/${pet.id}/medical-records/${recordId}`);
      setPet((prev) =>
        prev ? { ...prev, medicalRecords: (prev.medicalRecords || []).filter((r: any) => r.id !== recordId) } : prev
      );
    } catch (err) {
      console.error('[PetDetailPage] Xóa hồ sơ y tế thất bại:', err);
      alert('Không thể xóa hồ sơ này, vui lòng thử lại.');
    }
  };

  const refetchApplications = async () => {
    if (!pet?.id) return;
    try {
      const res = await axiosClient.get(`/shelter-dashboard/pets/${pet.id}`);
      setApplications(Array.isArray(res.data?.applications) ? res.data.applications : []);
    } catch (err) {
      console.error('[PetDetailPage] Lỗi tải lại đơn nhận nuôi:', err);
    }
  };

  const handleCompleteAdoption = async (applicationId: string) => {
    try {
      await applicationService.updateStatus(applicationId, 'ADOPTION_COMPLETED');
      setApproveApp(null);
      refetchApplications();
    } catch (error) {
      console.error('Lỗi khi hoàn tất nhận nuôi:', error);
      alert('Không thể hoàn tất nhận nuôi. Vui lòng thử lại.');
    }
  };

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-[400px] shrink-0 flex flex-col gap-4">
            <div className="h-8 w-52 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-[520px] bg-gray-100 rounded-2xl animate-pulse" />
          </div>
          <div className="flex-1 flex flex-col gap-4">
            <div className="h-9 w-64 bg-gray-100 rounded-lg animate-pulse self-end" />
            <div className="h-[440px] bg-gray-100 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (loadError || !pet) {
    return (
      <div className="w-full max-w-2xl mx-auto text-center py-24">
        <p className="text-gray-500 mb-4">Không tìm thấy thông tin pet này, hoặc có lỗi xảy ra.</p>
        <Link href="/shelter/pets" className="text-[#E89B5A] font-medium hover:underline">
          Quay về danh sách Pets
        </Link>
      </div>
    );
  }

  const images: string[] = Array.isArray(pet.images)
    ? pet.images.map(getImageUrl).filter((x): x is string => Boolean(x))
    : [];
  const primaryImage = images[0] || pet.avatarUrl || null;
  const genderLower = String(pet.gender || '').toLowerCase();
  const genderLabel = ['male', 'nam'].includes(genderLower) ? 'đực' : ['female', 'nữ', 'nu'].includes(genderLower) ? 'cái' : 'không rõ';
  const shelterDisplayId = pet.shelterInternalId ? String(pet.shelterInternalId).toUpperCase() : 'N/A';
  const vaccinationStatusKey = getVaccinationStatusKey(pet);
  const traits: MaybeBilingual[] = Array.isArray(pet.traitsList) ? pet.traitsList.map((t: any) => t?.name ?? t) : Array.isArray(pet.traits) ? pet.traits : [];
  const goodWith: MaybeBilingual[] = Array.isArray(pet.goodWith) ? pet.goodWith : [];
  const badWith: MaybeBilingual[] = Array.isArray(pet.badWith) ? pet.badWith : [];
  const adoptionRequirements: any[] = Array.isArray(pet.adoptionRequirements) ? pet.adoptionRequirements : [];
  const pawHistory: any[] = Array.isArray(pet.pawHistory) ? pet.pawHistory : [];
  const sortedHistory = [...pawHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const documentRecords: any[] = Array.isArray(pet.medicalRecords) ? pet.medicalRecords : [];

  return (
    <div className="w-full">
      <div className="flex flex-col lg:flex-row gap-7 items-start px-2 py-1">
        {/* ================= CỘT TRÁI: ẢNH + THÔNG TIN NHANH ================= */}
        <div className="w-full lg:w-[400px] xl:w-[440px] shrink-0 flex flex-col gap-5 p-1">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/shelter/pets')}
              className="text-gray-400 hover:text-[#123832] transition-colors shrink-0"
            >
              <FiChevronLeft size={26} />
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0D062D] truncate">{pet.name}</h1>
            <span className="hidden sm:inline text-lg text-[#8E8E93] truncate">({showText(pet.breed) || 'Chưa rõ'})</span>
          </div>

          <div className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="relative w-full h-[260px] sm:h-[300px] xl:h-[340px] bg-gray-100">
              {primaryImage ? (
                <Image src={primaryImage} alt={pet.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <PawPrint size={40} />
                </div>
              )}

              {/* DROPDOWN TRẠNG THÁI TRÊN ẢNH */}
              <div className="absolute top-4 right-4 z-20">
                <PetStatusDropdown
                  status={pet.status as PetStatus}
                  onChange={handleStatusChange}
                  loading={isUpdatingStatus}
                />
              </div>
            </div>

            <div className="p-5 flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-2.5">
                <div className="rounded-2xl bg-[#E2EFF8] py-3.5 flex flex-col items-center gap-1.5">
                  <span className="text-[13px] text-gray-500">Giới tính</span>
                  <span className="text-[15px] font-semibold text-black">{genderLabel}</span>
                </div>
                <div className="rounded-2xl bg-[#FEFACA] py-3.5 flex flex-col items-center gap-1.5">
                  <span className="text-[13px] text-gray-500">Tuổi</span>
                  <span className="text-[15px] font-semibold text-black">{getAgeLabel(pet.dob)}</span>
                </div>
                <div className="rounded-2xl bg-[#F9E6EC] py-3.5 flex flex-col items-center gap-1.5">
                  <span className="text-[13px] text-gray-500">Kích cỡ</span>
                  <span className="text-[15px] font-semibold text-black">{pet.weight != null ? `${pet.weight} kg` : ' '}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {(() => {
                  const dobIsAgeOnly = isAgeOnlyDob(pet.dob);
                  const birthdayFieldLabel = dobIsAgeOnly ? 'Tuổi' : 'Sinh nhật';
                  const birthdayFieldValue = pet.dob
                    ? (dobIsAgeOnly ? getAgeLabel(pet.dob) : fmtDate(pet.dob).toUpperCase())
                    : 'N/A';

                  return [
                    ['Màu sắc', (showText(pet.color) || 'N/A')],
                    [birthdayFieldLabel, birthdayFieldValue],
                    ['Shelter ID', shelterDisplayId],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-[#F9F9F9] border border-gray-200 rounded-2xl px-4 py-3.5">
                      <p className="text-[13px] text-[#8E8E93] mb-1">{label}</p>
                      <p className="text-[14px] font-semibold text-black tracking-wide">{value}</p>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* ================= CỘT PHẢI: ACTIONS + TABS + NỘI DUNG ================= */}
        <div className="flex-1 min-w-0 flex flex-col gap-5 px-2 py-1">
          {/* Actions */}
          <div className="flex items-center justify-end gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setShow3DModal(true)}
              className="h-11 sm:h-[38px] flex-1 sm:flex-none px-3 sm:px-4 rounded-xl sm:rounded-lg border border-[#E89B5A] text-[#E89B5A] text-[13px] sm:text-sm font-semibold sm:font-medium flex items-center justify-center gap-2 hover:bg-[#E89B5A]/5 transition-colors cursor-pointer"
            >
              <SparklesIcon size={14} /> <span className="sm:hidden">Xem 3D</span><span className="hidden sm:inline">Xem ở chế độ công khai (3D)</span>
            </button>
            <button
              type="button"
              onClick={() => router.push(`/shelter/pets/${pet.id}/edit`)}
              className="h-11 sm:h-[38px] flex-1 sm:flex-none px-3 sm:px-4 rounded-xl sm:rounded-lg border border-gray-300 text-gray-600 text-[13px] sm:text-sm font-semibold sm:font-medium flex items-center justify-center gap-2 hover:border-gray-400 transition-colors cursor-pointer"
            >
              <FiEdit2 size={13} /> <span className="sm:hidden">Chỉnh sửa</span><span className="hidden sm:inline">Chỉnh sửa hồ sơ</span>
            </button>
            <button
              type="button"
              onClick={handleDelete}
              title="Xóa pet"
              className="h-11 w-11 sm:h-[38px] sm:w-[38px] rounded-xl sm:rounded-lg border border-gray-300 text-red-500 flex items-center justify-center hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
            >
              <FiTrash2 size={14} />
            </button>
          </div>

          {/* Tab bar */}
          <div className="flex w-full bg-[#76768014] rounded-full p-1 gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 px-2 sm:px-6 py-2 sm:py-1.5 rounded-full text-[13px] sm:text-sm transition-colors whitespace-nowrap ${activeTab === tab.key
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-gray-500 font-medium'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB: DETAIL */}
          {activeTab === 'detail' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
              {/* Cột trái trong Tab Detail */}
              <div className="flex flex-col gap-4">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6 flex flex-col gap-6">
                  <div>
                    <p className="text-sm font-medium text-black mb-3">Về {pet.name}</p>
                    <p className="text-sm text-[#8E8E93] leading-relaxed">
                      {showText(pet.description) || 'Chưa có ghi chú cho pet này.'}
                    </p>
                    {traits.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {traits.map((t, i) => {
                          const style = TRAIT_STYLES[i % TRAIT_STYLES.length];
                          return (
                            <span
                              key={`${showText(t)}_${i}`}
                              className="text-[11px] font-medium px-3 py-1 rounded-full border"
                              style={{ backgroundColor: style.bg, borderColor: style.border, color: style.color }}
                            >
                              {showText(t)}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {(goodWith.length > 0 || badWith.length > 0) && (
                    <div>
                      <p className="text-sm font-medium text-black mb-2">Hành vi của {pet.name}</p>
                      {goodWith.length > 0 && (
                        <div className="flex items-start gap-1.5 mb-1">
                          <FiCheck size={13} className="text-[#77C852] mt-0.5 shrink-0" />
                          <p className="text-[12px] leading-5">
                            <span className="font-medium text-[#77C852]">Hợp với: </span>
                            <span className="text-[#8E8E93]">{goodWith.map(showText).join(', ')}</span>
                          </p>
                        </div>
                      )}
                      {badWith.length > 0 && (
                        <div className="flex items-start gap-1.5">
                          <FiX size={13} className="text-[#FE7D66] mt-0.5 shrink-0" />
                          <p className="text-[12px] leading-5">
                            <span className="font-medium text-[#FE7D66]">Không phù hợp: </span>
                            <span className="text-[#8E8E93]">{badWith.map(showText).join(', ')}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-black mb-3">Yêu cầu nhận nuôi</p>
                    {adoptionRequirements.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {adoptionRequirements.map((r, i) => (
                          <span key={r.iconKey ?? i} className="text-[12px] px-3 py-1 rounded-full border border-gray-200 text-gray-600 bg-white">
                            {showText(r.label)}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-[#8E8E93] leading-relaxed">Chưa có yêu cầu nhận nuôi.</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-black mb-3">Chăm sóc sức khỏe</p>
                    <div className="flex flex-col min-[400px]:flex-row gap-2.5 sm:gap-3">
                      <div className="flex-1 flex items-center gap-3 bg-[#F7F7F7] rounded-full h-[50px] px-2">
                        <div
                          className="w-[42px] h-[42px] rounded-full flex items-center justify-center shrink-0"
                          style={{ backgroundColor: VACCINATION_STATUS_CONFIG[vaccinationStatusKey].bgIcon }}
                        >
                          <Syringe size={18} style={{ color: VACCINATION_STATUS_CONFIG[vaccinationStatusKey].color }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12px] text-[#8E8E93]">Tiêm chủng</p>
                          <p
                            className="text-[13px] font-medium truncate"
                            style={{ color: VACCINATION_STATUS_CONFIG[vaccinationStatusKey].color }}
                          >
                            {VACCINATION_STATUS_CONFIG[vaccinationStatusKey].label}
                          </p>
                        </div>
                      </div>
                      <div className="flex-1 flex items-center gap-3 bg-[#F7F7F7] rounded-full h-[50px] px-2">
                        <div className="bg-white w-[42px] h-[42px] rounded-full flex items-center justify-center shrink-0">
                          {pet.isSpayedNeutered ? (
                            <FiCheck size={18} className="text-[#E89B5A]" />
                          ) : (
                            <FiX size={18} className="text-red-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12px] text-[#8E8E93]">Trạng thái</p>
                          <p className={`text-[13px] font-medium truncate ${pet.isSpayedNeutered ? 'text-black' : 'text-black'}`}>
                            {pet.isSpayedNeutered ? 'Đã triệt sản' : 'Chưa triệt sản'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* KHỐI GHI CHÚ */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6 flex flex-col gap-4">
                  <h3 className="text-sm font-bold text-gray-900">Ghi chú</h3>
                  <div className="flex flex-col gap-4">
                    {notes.map((note) => (
                      <div key={note.id} className="flex gap-3 items-start">
                        <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 mt-0.5 border border-gray-100">
                          {note.avatar ? (
                            <Image src={note.avatar} alt={note.author} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-xs font-bold">
                              {note.author?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-gray-900">{note.author}</span>
                            <span className="text-[10px] text-gray-400 ml-auto">
                              {new Date(note.date).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 leading-relaxed">{note.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {notes.length === 0 && (
                    <p className="text-xs text-gray-400 italic">Chưa có ghi chú nào.</p>
                  )}
                  <form onSubmit={handleAddNote} className="relative mt-2 w-full">
                    <input
                      type="text"
                      value={newNoteInput}
                      onChange={(e) => setNewNoteInput(e.target.value)}
                      placeholder="Thêm ghi chú..."
                      className="w-full bg-[#F9FAFB] border border-gray-200 rounded-full pl-4 pr-10 py-2.5 text-xs text-gray-700 outline-none focus:border-[#E89B5A]"
                    />
                    <button
                      type="submit"
                      disabled={!newNoteInput.trim() || isSubmittingNote}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#E89B5A] hover:text-[#D68B4E] disabled:opacity-40 transition-colors"
                    >
                      <Send size={15} />
                    </button>
                  </form>
                </div>
              </div>

              {/* Sub-card phải trong Tab Detail */}
              <div className="flex flex-col gap-4">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
                  <p className="text-sm font-medium text-black mb-4">PawHistory | Hành trình</p>
                  <div className="flex flex-col">
                    {sortedHistory.length > 0 ? (
                      sortedHistory.map((item, index) => {
                        const isLastItem = index === sortedHistory.length - 1;
                        const cfg = HISTORY_TYPE_CONFIG[item.type] ?? DEFAULT_HISTORY_CONFIG;
                        const Icon = cfg.Icon;
                        const title = localizeHistoryTitle(item);
                        return (
                          <div key={item.id ?? index} className="flex min-h-[48px]">
                            <div className="w-6 relative mr-2.5 shrink-0">
                              {!isLastItem && <div className="absolute w-[1px] bg-gray-200" style={{ top: 26, bottom: -4, left: 11.5 }} />}
                              <div className="w-6 h-6 rounded-full flex items-center justify-center relative z-10" style={{ backgroundColor: cfg.bg }}>
                                <Icon size={12} style={{ color: cfg.color }} />
                              </div>
                            </div>
                            <div className={`flex-1 ${!isLastItem ? 'pb-3' : ''}`}>
                              <div className="flex justify-between items-start gap-2">
                                <p className="text-[12px] font-medium text-black">{title}</p>
                                <span className="text-[10px] text-[#8E8E93] shrink-0">
                                  {item.type === 'BIRTH'
                                    ? formatAgeFromDob(item.date) || new Date(item.date).toLocaleDateString('vi-VN')
                                    : new Date(item.date).toLocaleDateString('vi-VN')}
                                </span>
                              </div>
                              {item.description && (
                                <p className="text-[10px] text-[#8E8E93] mt-0.5">{localizeHistoryDescription(item.description)}</p>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-center text-gray-400 py-3 text-[13px] italic">Chưa có lịch sử sống.</p>)}
                  </div>
                  <div className="flex items-center gap-2 bg-[#F5F5F5] rounded-lg py-2 px-3 mt-2">
                    <FiLock size={11} className="text-[#8E8E93] shrink-0" />
                    <span className="text-[10px] text-[#8E8E93]">Hành trình không thể bị xóa hay chỉnh sửa</span>
                  </div>
                </div>

                {/* KHỐI HỒ SƠ Y TẾ */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6 flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-gray-900">Hồ sơ y tế</h3>
                    <button
                      type="button"
                      onClick={() => setShowMedicalForm((v) => !v)}
                      className="text-[#E89B5A] bg-[#FFF8E6] border border-[#FFE1C2] px-3 py-1 rounded-full text-xs font-semibold hover:bg-orange-50 transition-colors"
                    >
                      Thêm hồ sơ
                    </button>
                  </div>

                  {/* Danh sách Hồ sơ y tế */}
                  <div className="flex flex-col gap-2.5">
                    {medicalList.map((item) => {
                      const style = MEDICAL_STATUS_STYLE[item.verificationStatus] || MEDICAL_STATUS_STYLE.PENDING;
                      const recordTitle = typeof item.recordName === 'object' ? (item.recordName?.vi || item.recordName?.en) : item.recordName;
                      const nextDueLabel = typeof item.nextDueName === 'object' ? (item.nextDueName?.vi || item.nextDueName?.en) : item.nextDueName;
                      const firstImage = Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : null;

                      return (
                        <div key={item.id} className="border border-gray-200 rounded-2xl p-3.5 flex flex-col gap-1 bg-white relative">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Syringe size={14} className="text-gray-400 shrink-0" />
                              <span className="text-xs font-bold text-gray-900">{recordTitle || item.type}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${style.className}`}>
                                {style.icon} {style.label}
                              </span>
                            </div>
                          </div>
                          <p className="text-[11px] text-gray-400 pl-5 pr-20">
                            Loại: {MEDICAL_TYPE_LABEL[item.type] || item.type} | Ngày: {fmtDate(item.recordDate)}
                          </p>
                          {item.hasNextDueDate && item.nextDueDate && (
                            <p className="text-[11px] text-[#E89B5A] font-semibold pl-5 pr-20">
                              Lịch tiếp theo{nextDueLabel ? ` (${nextDueLabel})` : ''}: {fmtDate(item.nextDueDate)}
                            </p>
                          )}
                          <div className="absolute right-4 bottom-3 flex items-center gap-4">
                            <button
                              type="button" title="Xem" disabled={!firstImage}
                              onClick={() => firstImage && setLightboxImage(firstImage)}
                              className="p-2 -m-2 text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            ><Eye size={18} /></button>
                            <button
                              type="button" title="Xóa"
                              onClick={() => handleDeleteDocument(item.id)}
                              className="p-2 -m-2 text-gray-400 hover:text-red-500 transition-colors"
                            ><FiTrash2 size={18} /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Form Nhập Thêm Hồ Sơ Y Tế */}
                  {showMedicalForm && (
                    <form onSubmit={handleSaveMedical} className="flex flex-col gap-3 pt-2 border-t border-dashed border-gray-200 mt-1">
                      <div>
                        <label className="text-[11px] font-bold text-gray-400 block mb-1">Loại hồ sơ</label>
                        <div className="relative">
                          <select
                            value={medicalType}
                            onChange={(e) => setMedicalType(e.target.value)}
                            className="w-full appearance-none bg-[#F9FAFB] border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 outline-none focus:border-[#E89B5A]"
                          >
                            <option value="">Chọn loại hồ sơ</option>
                            <option value="VACCINATION">Tiêm chủng</option>
                            <option value="ANNUAL_CHECKUP">Khám tổng quát</option>
                            <option value="DENTAL_CARE">Khám răng miệng</option>
                            <option value="OTHER">Khác</option>
                          </select>
                          <FiChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-gray-400 block mb-1">Chi tiết</label>
                          {medicalType === 'VACCINATION' ? (
                            <div className="relative">
                              <select
                                value={vaccineId}
                                onChange={(e) => {
                                  const id = e.target.value;
                                  setVaccineId(id);
                                  const label = VACCINE_OPTIONS[safeSpecies].find((v) => v.id === id)?.label || '';
                                  setMedicalDetail(label);
                                }}
                                className="w-full appearance-none bg-[#F9FAFB] border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 outline-none focus:border-[#E89B5A]"
                              >
                                <option value="">Chọn vắc-xin</option>
                                {VACCINE_OPTIONS[safeSpecies].map((v) => (
                                  <option key={v.id} value={v.id}>{v.label}</option>
                                ))}
                              </select>
                              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={medicalDetail}
                              onChange={(e) => setMedicalDetail(e.target.value)}
                              placeholder="Nhập chi tiết hồ sơ"
                              className="w-full bg-[#F9FAFB] border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 outline-none focus:border-[#E89B5A]"
                            />
                          )}
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-gray-400 block mb-1">Ngày tháng</label>
                          <input
                            type="date"
                            value={medicalDate}
                            onChange={(e) => setMedicalDate(e.target.value)}
                            className="w-full bg-[#F9FAFB] border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 outline-none focus:border-[#E89B5A]"
                          />
                        </div>
                      </div>
                      {medicalType === 'VACCINATION' && vaccineId && vaccineId !== 'DOG_RABIES' && vaccineId !== 'CAT_RABIES' && vaccineId !== 'DOG_BORDETELLA' && (
                        <div className="col-span-2 flex items-center justify-between bg-[#FAFAFA] px-3 py-2.5 rounded-xl border border-gray-200">
                          {[1, 2, 3].map((dose) => (
                            <button
                              key={dose}
                              type="button"
                              onClick={() => setDoseNumber(dose as 1 | 2 | 3)}
                              className="flex items-center gap-1.5"
                            >
                              <span className={`w-4 h-4 rounded-full border-2 ${doseNumber === dose ? 'border-[#E89B5A] bg-[#E89B5A]' : 'border-gray-300'}`} />
                              <span className={`text-xs ${doseNumber === dose ? 'text-[#E89B5A] font-semibold' : 'text-gray-500'}`}>
                                Mũi {dose}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Khung tải file/hình ảnh */}
                      <div>
                        <label className="text-[11px] font-bold text-gray-400 block mb-1">
                          Ảnh hồ sơ <span className="text-red-500">*</span>
                        </label>
                        <div
                          onClick={() => medicalFileInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer bg-[#F9FAFB]/50 transition-colors ${medicalFile ? 'border-[#E89B5A]' : 'border-red-300 hover:border-[#E89B5A]'
                            }`}
                        >
                          <p className="text-xs font-semibold text-[#E89B5A]">
                            {medicalFile ? `Đã chọn: ${medicalFile.name}` : 'Tải hình ảnh hồ sơ y tế'}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-0.5">PDF, JPG, IMG (tối đa 2MB)</p>
                          {!medicalFile && (
                            <p className="text-[10px] text-red-500 mt-1">Bắt buộc phải chọn ít nhất 1 ảnh</p>
                          )}
                        </div>
                        <input
                          ref={medicalFileInputRef}
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setMedicalFile(file);
                          }}
                        />
                      </div>

                      {medicalType !== 'OTHER' && (
                        <>
                          <div className="flex items-center justify-between">
                            <label className="text-[13px] font-medium text-black">Nhắc lịch</label>
                            <ToggleSwitch checked={medicalHasReminder} onChange={setMedicalHasReminder} />
                          </div>
                          {medicalHasReminder && (
                            <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3">
                              <input
                                type="text"
                                value={medicalNextDueDetail}
                                onChange={(e) => setMedicalNextDueDetail(e.target.value)}
                                placeholder="Ghi chú / Tên nhắc lịch"
                                className="w-full bg-[#F9FAFB] border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 outline-none focus:border-[#E89B5A]"
                              />
                              <input
                                type="date"
                                value={medicalNextDueDate}
                                onChange={(e) => setMedicalNextDueDate(e.target.value)}
                                className="w-full bg-[#F9FAFB] border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 outline-none focus:border-[#E89B5A]"
                              />
                            </div>
                          )}
                        </>
                      )}

                      <div className="flex items-center justify-between">
                        <label className="text-[13px] font-medium text-black">Hiện công khai trên PawLife app</label>
                        <ToggleSwitch checked={medicalIsPublic} onChange={setMedicalIsPublic} />
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <button type="button" onClick={() => setShowMedicalForm(false)} className="flex-1 border border-gray-200 bg-white text-gray-600 font-semibold py-2 rounded-full text-xs hover:bg-gray-50 transition-colors">
                          Hủy
                        </button>
                        <button
                          type="submit"
                          disabled={!medicalType || !medicalFile || isSavingMedical}
                          className="flex-1 bg-[#E89B5A] text-white font-semibold py-2 rounded-full text-xs hover:bg-[#D48A4A] transition-colors"
                        >
                          {isSavingMedical ? 'Đang lưu...' : 'Lưu hồ sơ'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: APPLICATION */}
          {activeTab === 'application' && (
            applications.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {applications.map((app: any) => {
                  // 👇 Dùng STATUS_BADGE chuẩn
                  const badge = STATUS_BADGE[app.status] || STATUS_BADGE.PENDING;

                  // 👇 Xử lý an toàn dữ liệu từ backend (ưu tiên trường phẳng -> trường gốc -> mặc định)
                  const applicantName = app.applicantName || app.fullName || app.user?.name || 'Người nhận nuôi';
                  const applicantAvatar = app.applicantAvatar || app.user?.avatarUrl || null;
                  const applicantPhone = app.applicantPhone || app.phone || 'Chưa có SĐT';
                  const applicantEmail = app.applicantEmail || app.user?.email || app.zalo || 'Chưa có email';
                  const submittedDate = app.submittedAt || app.createdAt;

                  return (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => handleOpenApplication(app)}
                      className="text-left bg-white rounded-2xl border border-gray-200 hover:border-[#E89B5A] shadow-sm p-5 flex items-start gap-3.5 transition-colors cursor-pointer"
                    >
                      <div className="relative w-[57px] h-[57px] rounded-full overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                        {isValidImageUrl(applicantAvatar) ? (
                          <Image src={applicantAvatar as string} alt={applicantName} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <UserIcon size={20} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[15px] font-semibold text-black truncate">{applicantName}</p>

                          <span
                            className="text-[11px] font-bold px-[10px] py-[3px] rounded-full border shrink-0"
                            style={{
                              backgroundColor: badge.bg,
                              borderColor: badge.border,
                              color: badge.text
                            }}
                          >
                            {badge.label}
                          </span>

                        </div>
                        <div className="flex items-center gap-2 text-[13px] text-gray-600">
                          <FiPhone size={13} className="text-gray-400 shrink-0" />
                          <span className="truncate">{applicantPhone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[13px] text-gray-600">
                          <FiMail size={13} className="text-gray-400 shrink-0" />
                          <span className="truncate">{applicantEmail}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[13px] text-gray-600">
                          <FiCalendar size={13} className="text-gray-400 shrink-0" />
                          <span className="truncate">Ngày nộp: {fmtDate(submittedDate) || 'Chưa rõ'}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 flex flex-col items-center text-center">
                <FiFileText size={22} className="text-gray-300 mb-2" />
                <p className="text-sm font-medium text-black mb-1">Chưa có đơn đăng ký nhận nuôi</p>
                <p className="text-[12px] text-gray-400 max-w-sm">Các đơn đăng ký nhận nuôi {pet.name} sẽ hiển thị ở đây khi có người nộp.</p>
              </div>
            )
          )}

          {/* TAB: DOCUMENT */}
          {activeTab === 'document' && (
            <div className="bg-white rounded-[20px] border border-gray-200 shadow-sm overflow-hidden w-full">
              <div className="hidden md:grid grid-cols-[2.5fr_1fr_1.5fr_1.2fr_1.2fr] px-6 py-4 border-b border-gray-100 bg-[#FAFAFA] text-[13px] font-medium text-gray-500">
                <span>Tên tài liệu</span>
                <span>Ngày</span>
                <span>Người đăng</span>
                <span>Trạng thái</span>
                <span>Thao tác</span>
              </div>
              <div className="flex flex-col divide-y divide-gray-100">
                {documentRecords.length === 0 ? (
                  <div className="px-6 py-10 text-center text-sm text-gray-400">Chưa có hồ sơ y tế nào.</div>
                ) : documentRecords.map((doc) => {
                  const style = MEDICAL_STATUS_STYLE[doc.verificationStatus] || MEDICAL_STATUS_STYLE.PENDING;
                  const firstImage = Array.isArray(doc.images) && doc.images.length > 0 ? doc.images[0] : null;
                  return (
                    <div key={doc.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 md:grid md:grid-cols-[2.5fr_1fr_1.5fr_1.2fr_1.2fr] px-4 md:px-6 py-4 hover:bg-gray-50/50 transition-colors">
                      <span className="w-full md:w-auto font-bold text-gray-900 text-[15px] md:text-sm truncate">{showText(doc.recordName) || doc.type}</span>
                      <span className="text-[13px] md:text-sm text-gray-500 md:text-gray-600 font-medium">{fmtDate(doc.recordDate)}</span>
                      <span className="hidden md:inline text-sm text-gray-600 font-medium">{pet.shelter?.name || pet.owner?.name || 'N/A'}</span>
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] md:text-xs font-semibold border ${style.className}`}>
                          {style.icon} {style.label}
                        </span>
                      </div>
                      <div className="ml-auto md:ml-0 flex items-center gap-4 md:gap-3">
                        <button type="button" title="Xem" disabled={!firstImage}
                          onClick={() => firstImage && setLightboxImage(firstImage)}
                          className="text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-30 p-1.5 -m-1.5"><Eye size={20} /></button>
                        <button type="button" title="Tải xuống" disabled={!firstImage}
                          onClick={() => firstImage && window.open(firstImage, '_blank')}
                          className="text-gray-400 hover:text-[#3B6BE3] transition-colors disabled:opacity-30 p-1.5 -m-1.5"><Download size={20} /></button>
                        <button type="button" title="Xóa" onClick={() => handleDeleteDocument(doc.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1.5 -m-1.5"><FiTrash2 size={20} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {
        isValidImageUrl(lightboxImage) && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60]" onClick={() => setLightboxImage(null)}>
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute top-[max(1.5rem,env(safe-area-inset-top))] right-4 w-11 h-11 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white"
            >
              <FiX size={18} />
            </button>
            <div className="relative w-[96%] sm:w-[90%] max-w-[500px] h-[75%]" onClick={(e) => e.stopPropagation()}>
              <Image src={lightboxImage} alt="Hồ sơ y tế" fill className="object-contain" />
            </div>
          </div>
        )
      }

      {
        show3DModal && (
          <PetPublic3DModal
            pet={pet}
            onClose={() => setShow3DModal(false)}
          />
        )
      }
      {selectedApplication && (
        <ApplicationDetailModal
          application={selectedApplication}
          onClose={() => {
            setSelectedApplication(null);
            refetchApplications(); // đồng bộ lại status mới nhất sau khi đóng modal
          }}
        />
      )}
      {pendingApp && (
        <MoveToPendingModal
          application={pendingApp}
          onClose={() => { setPendingApp(null); refetchApplications(); }}
          onRefresh={refetchApplications}
          onSubmit={async (data) => {
            await moveApplication(pendingApp.id, 'PENDING', data?.reviewNote);
            await refetchApplications();
            setPendingApp(null);
          }}
        />
      )}
      {needInfoApp && (
        <NeedMoreInfoModal
          application={needInfoApp}
          initialDocuments={[]} // Ở trang detail không có pre-load docs
          socket={null}
          onClose={() => { setNeedInfoApp(null); refetchApplications(); }}
          onRefresh={refetchApplications}
          onSubmit={async (data) => {
            const targetStatus = data.action === 'MOVE_TO_INTERVIEW'
              ? 'INTERVIEW_SCHEDULED'
              : 'NEED_MORE_INFO';

            await moveApplication(needInfoApp.id, targetStatus, data?.reviewNote);
            setNeedInfoApp(null);
            refetchApplications();
          }}
        />
      )}
      {interviewApp && (
        <InterviewScheduleModal
          application={interviewApp}
          onClose={() => { setInterviewApp(null); refetchApplications(); }}
          onRefresh={refetchApplications}
          onSubmit={async (data) => {
            const res = await applicationService.scheduleAppointment(interviewApp.id, data);
            await moveApplication(interviewApp.id, 'INTERVIEW_SCHEDULED');
            setInterviewApp(null);
            refetchApplications();
            return res;
          }}
        />
      )}
      {approveApp && (
        <ApproveApplicationModal
          application={approveApp}
          onClose={() => { setApproveApp(null); refetchApplications(); }}
          onRefresh={refetchApplications}
          onCompleteAdoption={handleCompleteAdoption}
          onScheduleInterview={async (id, d) => {
            const res = await applicationService.scheduleAppointment(id, d);
            refetchApplications();
            return res;
          }}
          onSubmit={async (data) => {
            await moveApplication(approveApp.id, 'APPROVED', data?.reviewNote);
            setApproveApp(null);
            refetchApplications();
          }}
        />
      )}
    </div >
  );
}