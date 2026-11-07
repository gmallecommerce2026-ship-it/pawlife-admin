'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Pencil,
  X,
  Check,
  Lock,
  Cake,
  QrCode,
  Home,
  Syringe,
  Stethoscope,
  Smile,
  User,
  HeartHandshake,
  Camera,
  FileText,
  Clock,
  SparklesIcon,
  Send,
  MoreVertical,
  Upload,
  Calendar,
  Eye,
  Download,
  HomeIcon,
  Footprints,
  UserCheck,
  Ban,
  DoorClosed,
  Maximize2,
  VolumeX,
  RefreshCw,
} from 'lucide-react';
import { usePetActions } from '@/stores/usePetStore';
import { PetSpecies, PetGender, PetStatus } from '@/types/pet';
import axiosClient from '@/lib/api/axiosClient';
import { PetPublic3DModal } from '@/components/PetPublic3DModal';
import { FiTrash2, FiPhone, FiMail, FiCalendar } from 'react-icons/fi';
import { ApplicationDetailModal } from '../../applications/components/ApplicationDetailModal';
import { AdoptionApplication } from '@/types/application';
import { PetStatusDropdown } from '@/components/PetStatusBadge';
import { CustomSelect, SelectOption } from '@/components/ui/CustomSelect';
import { BREED_DATA } from '@/constants/breedData';
import {
  localizeHistoryDescription,
  localizeHistoryTitle,
  formatAgeFromDob,
} from '@/utils/pawHistoryLocalize';
import { PetImageManager } from '@/modules/shelter/pets/components/PetImageManager';
export interface Bilingual {
  vi: string;
  en: string;
}

export type TagValue = Bilingual & { isCustom?: boolean };

const SUGGESTED_TAGS = [
  'Hiền lành',
  'Năng động',
  'Nhút nhát',
  'Thông minh',
  'Quấn chủ',
  'Thích chơi đùa',
  'Cảnh giác',
  'Dễ huấn luyện',
];


const HISTORY_TYPE_CONFIG: Record<string, { Icon: React.ElementType; bg: string; color: string }> = {
  BIRTH: { Icon: Cake, bg: '#FFF4EC', color: '#F2A465' },
  CREATED: { Icon: QrCode, bg: '#EAE7FB', color: '#885BF2' },
  QR_LINKED: { Icon: QrCode, bg: '#EAE7FB', color: '#885BF2' },
  TRANSFER: { Icon: Home, bg: '#EBFFE2', color: '#77C582' },
  VACCINE: { Icon: Syringe, bg: '#E3F0FF', color: '#5A90DA' },
  DENTAL_CARE: { Icon: Smile, bg: '#E8FFD8', color: '#5FA83D' },
  ANNUAL_CHECKUP: { Icon: Stethoscope, bg: '#E8FFD8', color: '#5FA83D' },
  CURRENT_OWNER: { Icon: User, bg: '#FFE9B8', color: '#CF7900' },
  PREVIOUS_OWNER: { Icon: User, bg: '#FFE9B8', color: '#CF7900' },
  UNDER_SHELTER_CARE: { Icon: HeartHandshake, bg: '#FFE4F0', color: '#D6447A' },
};

const DEFAULT_HISTORY_CONFIG = { Icon: Cake, bg: '#F5F5F5', color: '#8E8E93' };

const TAG_COLOR_STYLES = [
  { bg: '#FBF7EB', border: '#E8A53C', color: '#E8A53C' },
  { bg: '#E8F1FF', border: '#5A90DA', color: '#5A90DA' },
  { bg: '#EBFFE2', border: '#77C852', color: '#77C852' },
];

interface NoteItem { id: string; author: string; avatar: string | null; content: string; date: string; }



type MedicalRecordType = 'VACCINATION' | 'ANNUAL_CHECKUP' | 'DENTAL_CARE' | 'OTHER';
type VaccineCategory = 'RABIES' | 'CORE' | 'OTHER';

const MEDICAL_TYPE_OPTIONS: { value: MedicalRecordType; label: string }[] = [
  { value: 'VACCINATION', label: 'Tiêm chủng' },
  { value: 'ANNUAL_CHECKUP', label: 'Khám tổng quát' },
  { value: 'DENTAL_CARE', label: 'Khám răng miệng' },
  { value: 'OTHER', label: 'Khác' },
];

const CORE_VACCINE_IDS = ['DOG_DHP', 'DOG_DHPP', 'CAT_FVRCP'];

const getVaccineCategory = (id: string): VaccineCategory => {
  if (id.endsWith('_RABIES')) return 'RABIES';
  if (CORE_VACCINE_IDS.includes(id)) return 'CORE';
  return 'OTHER';
};

interface MedicalRecordItem {
  id?: string;                 // có id = record đã tồn tại trên DB
  type: MedicalRecordType;
  vaccineCategory?: VaccineCategory; // chỉ có khi type === 'VACCINATION'
  recordName: string;          // lưu tiếng Việt, gửi lên backend backend tự nhân bản vi/en
  recordDate: string;          // ISO string
  images: string[];
  hasNextDueDate: boolean;
  nextDueName?: string;
  isPublic?: boolean;
  nextDueDate?: string | null;
  verificationStatus?: 'PENDING' | 'VERIFIED' | 'DISPUTED';
}

const MEDICAL_STATUS_STYLE: Record<string, { label: string; className: string; icon: string }> = {
  PENDING: { label: 'Đang xác minh', className: 'bg-[#FFF8E5] text-[#E8A53C] border-[#FFE1C2]', icon: '⏱' },
  VERIFIED: { label: 'Đã xác minh', className: 'bg-[#EBFFE2] text-[#77C852] border-[#D1F5BF]', icon: '✓' },
  DISPUTED: { label: 'Đang tranh chấp', className: 'bg-[#FFE2E2] text-[#FF5A5A] border-[#FFB4B4]', icon: '⚠' },
};
interface AdoptionApplicationItem {
  id: string;
  applicantName: string;
  applicantAvatar?: string | null;
  applicantPhone?: string;
  applicantEmail?: string;
  status: 'SUBMITTED' | 'PENDING' | 'NEED_MORE_INFO' | 'INTERVIEW_SCHEDULED' | 'APPROVED' | 'ADOPTION_COMPLETED' | 'CLOSED';
  submittedAt?: string;
}

const APPLICATION_STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  SUBMITTED: { bg: '#E8F1FF', color: '#5A90DA', label: 'Đã nộp' },
  PENDING: { bg: '#E8F1FF', color: '#5A90DA', label: 'Chờ xử lý' },
  NEED_MORE_INFO: { bg: '#FFF8E5', color: '#E8A53C', label: 'Cần bổ sung' },
  INTERVIEW_SCHEDULED: { bg: '#F3E8FF', color: '#9333EA', label: 'Đã hẹn phỏng vấn' },
  APPROVED: { bg: '#EBFFE2', color: '#77C852', label: 'Đã duyệt' },
  ADOPTION_COMPLETED: { bg: '#DEFFDF', color: '#00AC47', label: 'Đã nhận nuôi' },
  CLOSED: { bg: '#F0F0F0', color: '#757575', label: 'Đã đóng' },
};

const fmtAppDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString('vi-VN') : 'Chưa rõ');
const mapInitialMedicalRecords = (raw: any[]): MedicalRecordItem[] =>
  (Array.isArray(raw) ? raw : []).map((r) => ({
    id: r.id,
    type: (r.type || 'OTHER') as MedicalRecordType,
    vaccineCategory: r.vaccineCategory || undefined,
    recordName: typeof r.recordName === 'object' ? (r.recordName?.vi || r.recordName?.en || '') : (r.recordName || ''),
    recordDate: r.recordDate ? String(r.recordDate).slice(0, 10) : '',
    images: sanitizeImageArray(r.images),   // ← sửa dòng này
    hasNextDueDate: !!r.hasNextDueDate,
    nextDueName: typeof r.nextDueName === 'object' ? (r.nextDueName?.vi || r.nextDueName?.en || '') : (r.nextDueName || ''),
    isPublic: r.isPublic ?? true,
    nextDueDate: r.nextDueDate ? String(r.nextDueDate).slice(0, 10) : null,
    verificationStatus: r.verificationStatus || 'PENDING',
  }));
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
async function uploadPetImage(file: File): Promise<string> {
  const { data } = await axiosClient.post('/storage/presigned-url', {
    fileName: file.name,
    fileType: file.type || 'image/jpeg',
    folder: 'pet-images',
  });
  const res = await fetch(data.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!res.ok) throw new Error('Upload ảnh pet thất bại');
  return data.fileUrl;
}
const SPECIES_LABEL: Record<PetSpecies, string> = { DOG: 'Chó', CAT: 'Mèo' };
const findBreedBilingual = (breedValue: string, speciesKey: 'Dog' | 'Cat') => {
  const match = BREED_DATA[speciesKey].find((b) => b.value === breedValue);
  return match ? { en: match.en, vi: match.vi } : { en: breedValue, vi: breedValue };
};
const toISODate = (dateStr?: string): string | undefined => {
  if (!dateStr) return undefined;
  // Nếu đã là ISO (từ <input type="date">) thì giữ nguyên
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr;
  // Parse định dạng "D/M/YYYY" hoặc "DD/MM/YYYY"
  const parts = dateStr.split('/');
  if (parts.length !== 3) return undefined;
  const [d, m, y] = parts;
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
};
const toUrlString = (item: unknown): string | null => {
  if (typeof item === 'string') return item.startsWith('blob:') ? null : item; // loại bỏ blob preview
  if (item && typeof item === 'object') {
    const obj = item as any;
    return obj.url || obj.fileUrl || null;
  }
  return null;
};

const sanitizeImageArray = (arr: unknown): string[] =>
  (Array.isArray(arr) ? arr : [])
    .map(toUrlString)
    .filter((x): x is string => Boolean(x));

// Dịch tự động Tiếng Việt -> Tiếng Anh cho thẻ tuỳ chỉnh (dùng MyMemory, miễn phí, không cần API key)
async function translateViToEn(text: string): Promise<string> {
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=vi|en`
    );
    if (!res.ok) throw new Error('Translate request failed');
    const data = await res.json();
    const translated = data?.responseData?.translatedText;
    return typeof translated === 'string' && translated.trim() ? translated.trim() : text;
  } catch (err) {
    console.error('[PetForm] Dịch thẻ thất bại, giữ nguyên tiếng Việt:', err);
    return text; // fallback: dùng lại tiếng Việt nếu dịch lỗi
  }
}
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
type VaccinationStatusKey = 'NOT_VACCINATED' | 'IN_PROGRESS' | 'VACCINATED';

type VaccinationStatusStyle = {
  label: string;
  color: string;
  bgIcon: string;
};

const VACCINATION_STATUS_CONFIG: Record<VaccinationStatusKey, VaccinationStatusStyle> = {
  NOT_VACCINATED: { label: 'Chưa tiêm', color: '#8E8E93', bgIcon: '#F0F0F0' },
  IN_PROGRESS: { label: 'Đang tiêm', color: '#E8A53C', bgIcon: '#FFF4DE' },
  VACCINATED: { label: 'Đầy đủ', color: '#E89B5A', bgIcon: '#FFF4EC' },
};
const SPECIES_OPTIONS: SelectOption[] = [
  { value: 'DOG', label: 'Chó' },
  { value: 'CAT', label: 'Mèo' },
];

const GENDER_OPTIONS: SelectOption[] = [
  { value: 'FEMALE', label: 'FEMALE' },
  { value: 'MALE', label: 'MALE' },
];
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
const REQUIREMENT_OPTIONS: { key: string; label: string; icon: React.ElementType }[] = [
  { key: 'house_with_yard', label: 'Có sân vườn', icon: HomeIcon },
  { key: 'daily_walk', label: 'Đi dạo thường xuyên', icon: Footprints },
  { key: 'advance_experience', label: 'Chủ có kinh nghiệm', icon: UserCheck },
  { key: 'no_cat', label: 'Không có chó khác', icon: Ban },
  { key: 'no_dog', label: 'Không có mèo khác', icon: Ban },
  { key: 'no_other_pet', label: 'Không pet khác', icon: Ban },
  { key: 'no_small_animal', label: 'Không động vật nhỏ', icon: Ban },
  { key: 'indoor_raise', label: 'Nuôi trong nhà', icon: DoorClosed },
  { key: 'spacious_living', label: 'Không gian rộng', icon: Maximize2 },
  { key: 'quiet_home', label: 'Nhà yên tĩnh', icon: VolumeX },
  { key: 'often_at_home', label: 'Có thời gian ở nhà', icon: Clock },
  { key: 'stable_routine', label: 'Lịch sinh hoạt ổn định', icon: RefreshCw },
];

export const PetForm: React.FC<{ mode: 'create' | 'edit'; initialPet?: any }> = ({ mode, initialPet }) => {
  const router = useRouter();
  const { createPet, updatePet, isSubmitting } = usePetActions();
  const [medicalFile, setMedicalFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'applications' | 'documents'>('info');
  const [isEditing, setIsEditing] = useState(true); // Cho phép nhập liệu ngay
  const [show3DModal, setShow3DModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [gender, setGender] = useState<PetGender>('FEMALE');
  const [species, setSpecies] = useState<PetSpecies>('DOG');
  const safeSpecies = resolveSpeciesKey(species);
  const [color, setColor] = useState('');
  const [dob, setDob] = useState('');
  const [weight, setWeight] = useState<number | undefined>(undefined);
  const [pawLifeId, setPawLifeId] = useState('');
  const [status, setStatus] = useState<PetStatus>('AVAILABLE');
  const [dobMode, setDobMode] = useState<'date' | 'age'>('age');
  const [ageYears, setAgeYears] = useState<number | undefined>(undefined);

  const [description, setDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState<TagValue[]>([]);
  const [showAddTagInput, setShowAddTagInput] = useState(false);
  const [newTagVi, setNewTagVi] = useState('');
  const [isTranslatingTag, setIsTranslatingTag] = useState(false);
  const [goodWith, setGoodWith] = useState('');
  const [badWith, setBadWith] = useState('');
  const [selectedRequirements, setSelectedRequirements] = useState<string[]>([]);
  const [vaccinationStatus, setVaccinationStatus] = useState<VaccinationStatusKey>('VACCINATED');
  const [shelterInternalId, setShelterInternalId] = useState('');
  const [isSpayedNeutered, setIsSpayedNeutered] = useState(true);

  const [images, setImages] = useState<string[]>([]);
  const blobFileMap = useRef<Map<string, File>>(new Map());
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  // Ghi chú State
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [newNoteInput, setNewNoteInput] = useState('');

  // Hồ sơ y tế State
  const [medicalList, setMedicalList] = useState<MedicalRecordItem[]>([]);
  const [applications, setApplications] = useState<AdoptionApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<AdoptionApplication | null>(null);
  const [isUploadingMedicalFile, setIsUploadingMedicalFile] = useState(false);
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
  const prevSafeSpeciesRef = useRef(safeSpecies);
  useEffect(() => {
    if (prevSafeSpeciesRef.current === safeSpecies) return;
    prevSafeSpeciesRef.current = safeSpecies;
    const stillValid = BREED_DATA[safeSpecies].some((b) => b.value === breed);
    if (!stillValid) setBreed('');
  }, [safeSpecies]);
  const cycleVaccinationStatus = () => {
    setVaccinationStatus((prev) =>
      prev === 'NOT_VACCINATED'
        ? 'IN_PROGRESS'
        : prev === 'IN_PROGRESS'
          ? 'VACCINATED'
          : 'NOT_VACCINATED'
    );
  };
  useEffect(() => {
    if (initialPet) {
      setName(initialPet.name || '');
      setBreed(
        typeof initialPet.breed === 'object'
          ? initialPet.breed?.en || initialPet.breed?.vi || ''
          : initialPet.breed || ''
      );
      setGender(initialPet.gender || 'FEMALE');

      // ✅ THÊM DÒNG NÀY: nạp đúng species từ pet đang edit, thay vì luôn giữ default 'DOG'
      setSpecies(
        typeof initialPet.species === 'object'
          ? (initialPet.species?.en === 'CAT' || initialPet.species?.vi === 'Mèo' ? 'CAT' : 'DOG')
          : (String(initialPet.species || '').toUpperCase() === 'CAT' ? 'CAT' : 'DOG')
      );

      setColor(
        typeof initialPet.color === 'object'
          ? initialPet.color?.en || initialPet.color?.vi || ''
          : initialPet.color || ''
      );

      const initialDob = initialPet.dob ? String(initialPet.dob).slice(0, 10) : '';
      setDob(initialDob);
      if (initialDob) {
        const age = new Date().getFullYear() - new Date(initialDob).getFullYear();
        setAgeYears(age >= 0 ? age : 0);
      }
      setWeight(initialPet.weight ?? initialPet.weightKg ?? undefined);
      setPawLifeId(initialPet.code || initialPet.tags?.[0]?.id || '');
      setStatus(initialPet.status || 'AVAILABLE');
      setDescription(
        typeof initialPet.description === 'object'
          ? initialPet.description?.vi || initialPet.description?.en || ''
          : initialPet.description || ''
      );
      setVaccinationStatus(
        initialPet.vaccinationStatus
          ? initialPet.vaccinationStatus
          : initialPet.isVaccinated === false
            ? 'NOT_VACCINATED'
            : 'VACCINATED'
      );
      setShelterInternalId(initialPet.shelterInternalId || '');
      setIsSpayedNeutered(initialPet.isSpayedNeutered ?? initialPet.isSterilized ?? true);
      // 🆕 Nạp requirement key đã lưu — theo PetsService.getPetById, mỗi item có id = requirement.key
      setSelectedRequirements(
        Array.isArray(initialPet.adoptionRequirements)
          ? initialPet.adoptionRequirements.map((r: any) => r.id).filter(Boolean)
          : []
      );
      const normalizedImages = Array.isArray(initialPet.images)
        ? initialPet.images.map((img: any) => (typeof img === 'string' ? img : img.url)).filter(Boolean)
        : [];
      setImages(Array.from(new Set(normalizedImages)));
      setSelectedTags(
        Array.isArray(initialPet.traits)
          ? initialPet.traits
            .map((t: any): TagValue | null => {
              if (typeof t === 'string') return { vi: t, en: t };
              const vi = t?.name?.vi || t?.vi || '';
              const en = t?.name?.en || t?.en || vi;
              if (!vi) return null;
              return { vi, en, isCustom: t?.isCustom };
            })
            .filter((t: TagValue | null): t is TagValue => Boolean(t))
          : []
      );
      setGoodWith(
        Array.isArray(initialPet.goodWith)
          ? initialPet.goodWith.map((x: any) => (typeof x === 'string' ? x : x?.vi || x?.en || '')).filter(Boolean).join(', ')
          : ''
      );
      setBadWith(
        Array.isArray(initialPet.badWith)
          ? initialPet.badWith.map((x: any) => (typeof x === 'string' ? x : x?.vi || x?.en || '')).filter(Boolean).join(', ')
          : ''
      );
      setMedicalList(mapInitialMedicalRecords(initialPet.medicalRecords));
      setApplications(Array.isArray(initialPet.applications) ? initialPet.applications : []);

    }
  }, [initialPet]);
  useEffect(() => {
    if (initialPet?.id) {
      axiosClient.get(`/pets/${initialPet.id}/notes`)
        .then((res) => setNotes(res.data))
        .catch((err) => console.error('[PetForm] Lỗi tải ghi chú:', err));
    }
  }, [initialPet?.id]);
  const handleSwitchToAgeMode = () => {
    if (dob) {
      const year = new Date(dob).getFullYear();
      const age = new Date().getFullYear() - year;
      setAgeYears(age >= 0 ? age : 0);
    }
    setDobMode('age');
  };

  // Khi nhập tuổi -> auto set dob = 1/1 của năm tương ứng
  useEffect(() => {
    if (dobMode === 'age' && ageYears !== undefined && ageYears >= 0) {
      const year = new Date().getFullYear() - ageYears;
      setDob(`${year}-01-01`);
    }
  }, [ageYears, dobMode]);
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = newNoteInput.trim();
    if (!content || !initialPet?.id) return;
    try {
      setIsSubmittingNote(true);
      const res = await axiosClient.post(`/pets/${initialPet.id}/notes`, { content });
      setNotes((prev) => [res.data, ...prev]);
      setNewNoteInput('');
    } catch (err) {
      console.error('[PetForm] Gửi ghi chú thất bại:', err);
      alert('Gửi ghi chú thất bại.');
    } finally {
      setIsSubmittingNote(false);
    }
  };
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const previews = files.map((f) => {
      const url = URL.createObjectURL(f);
      blobFileMap.current.set(url, f);
      return url;
    });
    setCurrentImageIndex(images.length);
    setImages((prev) => [...prev, ...previews]);
    e.target.value = ''; // cho phép chọn lại cùng 1 file
  };

  // Dùng cho PetImageManager (xóa / đặt ảnh chính)
  const handleImagesChange = (next: string[]) => {
    const unique = Array.from(new Set(next));
    // dọn blob của ảnh đã bị xóa
    images.forEach((u) => {
      if (u.startsWith('blob:') && !unique.includes(u)) {
        blobFileMap.current.delete(u);
        URL.revokeObjectURL(u);
      }
    });
    setImages(unique);
    setCurrentImageIndex(0); // preview nhảy về ảnh chính
  };
  const refetchApplications = async () => {
    if (!initialPet?.id) return;
    try {
      const res = await axiosClient.get(`/shelter-dashboard/pets/${initialPet.id}`);
      setApplications(Array.isArray(res.data?.applications) ? res.data.applications : []);
    } catch (err) {
      console.error('[PetForm] Lỗi tải lại đơn nhận nuôi:', err);
    }
  };
  const goPrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (images.length <= 1) return;
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (images.length <= 1) return;
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  // Bấm vào thẻ gợi ý sẵn (SUGGESTED_TAGS) để thêm/bỏ chọn
  const toggleTag = (tagVi: string) => {
    setSelectedTags((prev) =>
      prev.some((t) => t.vi === tagVi)
        ? prev.filter((t) => t.vi !== tagVi)
        : [...prev, { vi: tagVi, en: tagVi }]
    );
  };

  // Xoá 1 thẻ đã chọn (gợi ý hoặc tự thêm) theo index
  const removeTag = (index: number) => {
    setSelectedTags((prev) => prev.filter((_, i) => i !== index));
  };

  // Thêm thẻ tuỳ chỉnh: chỉ cần nhập tiếng Việt, tiếng Anh tự động dịch
  const handleAddCustomTag = async () => {
    const vi = newTagVi.trim();
    if (!vi) return;
    const alreadyExists = selectedTags.some((t) => t.vi.toLowerCase() === vi.toLowerCase());
    if (alreadyExists) {
      alert('Thẻ này đã được chọn.');
      return;
    }
    try {
      setIsTranslatingTag(true);
      const en = await translateViToEn(vi);
      setSelectedTags((prev) => [...prev, { vi, en, isCustom: true }]);
      setNewTagVi('');
      setShowAddTagInput(false);
    } finally {
      setIsTranslatingTag(false);
    }
  };

  const toggleRequirement = (req: string) => {
    setSelectedRequirements((prev) =>
      prev.includes(req) ? prev.filter((r) => r !== req) : [...prev, req]
    );
  };
  const isRabies = medicalDetail.toLowerCase().includes('rabies') || medicalDetail.toLowerCase().includes('dại');

  const prevMedicalTypeRef = useRef(medicalType);
  useEffect(() => {
    if (prevMedicalTypeRef.current === medicalType) return;
    prevMedicalTypeRef.current = medicalType;
    setMedicalDetail('');
    setVaccineId('');
    setDoseNumber(1);
  }, [medicalType]);

  // Effect 2: tính lại Nhắc lịch mỗi khi Chi tiết / Ngày / Mũi tiêm đổi — KHÔNG đụng medicalDetail
  useEffect(() => {
    if (!medicalType) return;

    if (medicalType === 'OTHER') {
      setMedicalHasReminder(false);
      setMedicalNextDueDetail('');
      setMedicalNextDueDate('');
      return;
    }
    if (medicalType === 'VACCINATION' && !vaccineId) {
      // Chưa chọn vaccine cụ thể → chưa đủ dữ liệu để tính lịch nhắc
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
  const handleSaveMedical = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicalType) return;
    if (!medicalFile) {
      alert('Vui lòng tải lên ít nhất 1 ảnh/hồ sơ trước khi lưu.');
      return;
    }


    try {
      setIsUploadingMedicalFile(true);
      const images = medicalFile ? [await uploadMedicalFile(medicalFile)] : [];

      const newRecord: MedicalRecordItem = {
        type: medicalType,
        vaccineCategory: medicalType === 'VACCINATION' ? getVaccineCategory(vaccineId) : undefined,
        recordName: medicalDetail || medicalType,
        recordDate: medicalDate ? new Date(medicalDate).toISOString() : new Date().toISOString(),
        images,
        hasNextDueDate: medicalHasReminder,
        nextDueDate: medicalHasReminder && medicalNextDueDate ? new Date(medicalNextDueDate).toISOString() : null,
        nextDueName: medicalHasReminder ? (medicalNextDueDetail || undefined) : undefined,
        isPublic: medicalIsPublic,
        verificationStatus: 'PENDING', // record mới luôn chờ xác minh
      };

      setMedicalList((prev) => [...prev, newRecord]);
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
      console.error('[PetForm] Upload hồ sơ y tế thất bại:', err);
      alert('Tải hồ sơ y tế thất bại. Vui lòng thử lại.');
    } finally {
      setIsUploadingMedicalFile(false);
    }
  };

  const handleRemoveMedical = (index: number) => {
    setMedicalList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const payload: any = {
      name,
      species: { en: species, vi: SPECIES_LABEL[species] },
      breed: findBreedBilingual(breed, safeSpecies),
      gender,
      color: { en: color, vi: color },
      dob,
      weight,
      status,
      description: { en: description, vi: description },
      vaccinationStatus,
      isSpayedNeutered,
      code: pawLifeId,
      shelterInternalId,
      traits: selectedTags.map((t) => ({ vi: t.vi, en: t.en, isCustom: !!t.isCustom })),
      adoptionRequirementKeys: selectedRequirements,
      goodWith: goodWith.split(',').map((s) => s.trim()).filter(Boolean),
      badWith: badWith.split(',').map((s) => s.trim()).filter(Boolean),
      medicalRecords: medicalList.map((r) => ({
        ...(r.id ? { id: r.id } : {}),
        type: r.type,
        ...(r.vaccineCategory ? { vaccineCategory: r.vaccineCategory } : {}),
        recordName: r.recordName,
        recordDate: r.recordDate,
        images: sanitizeImageArray(r.images),   // ← chặn lần cuối
        hasNextDueDate: r.hasNextDueDate,
        ...(r.hasNextDueDate && r.nextDueDate ? { nextDueDate: r.nextDueDate } : {}),
        ...(r.hasNextDueDate && r.nextDueName ? { nextDueName: r.nextDueName } : {}),
        isPublic: r.isPublic ?? true,
      })),
    };

    // images pet: loại bỏ blob preview, chỉ giữ URL thật đã upload/tồn tại
    let finalImages: string[] = [];
    try {
      finalImages = await Promise.all(
        images.map(async (url) => {
          if (!url.startsWith('blob:')) return url;
          const file = blobFileMap.current.get(url);
          if (!file) return null;
          return uploadPetImage(file);
        }),
      ).then((arr) => arr.filter((x): x is string => Boolean(x)));
    } catch (err) {
      console.error('[PetForm] Upload ảnh pet thất bại:', err);
      alert('Tải ảnh lên thất bại. Vui lòng thử lại.');
      return;
    }

    if (finalImages.length === 0) {
      alert('Pet cần có ít nhất 1 ảnh.');
      return;
    }

    let success = false;
    if (mode === 'create') {
      // create: giữ API cũ (gửi File), nhưng sắp theo đúng thứ tự đang hiển thị
      const orderedFiles = images
        .filter((u) => u.startsWith('blob:'))
        .map((u) => blobFileMap.current.get(u))
        .filter((f): f is File => Boolean(f));
      success = await createPet(payload, orderedFiles);
    } else if (initialPet) {
      // edit: ảnh đã upload hết, gửi mảng URL đúng thứ tự, không gửi file nữa
      success = await updatePet(initialPet.id, payload, [], finalImages);
    }

    if (success) {
      router.push('/shelter/pets');
    }
  };

  const pawHistory =
    Array.isArray(initialPet?.pawHistory) && initialPet.pawHistory.length > 0
      ? initialPet.pawHistory
      : [
        { id: '1', type: 'TRANSFER', title: 'Curren Owner', description: 'Ownership transferred to Jane Doe', date: '2026-01-01' },
        { id: '2', type: 'ANNUAL_CHECKUP', title: 'Annual Checkup', description: 'Health examination completed', date: '2026-01-01' },
        { id: '3', type: 'VACCINE', title: 'DHPP Vaccination', description: 'Vaccinated: hepatitis, rabies, parvo, and parainfluenza', date: '2026-01-01' },
        { id: '4', type: 'QR_LINKED', title: 'QR Code Registered', description: 'PawLife QR tag activated and linked to Luna', date: '2025-01-01' },
        { id: '5', type: 'BIRTH', title: 'Sinh nhật', description: 'Sinh nhật của Luna', date: '2026-01-01' },
      ];
  const sortedHistory = [...pawHistory].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const approvedApplication = applications.find(
    (a) => a.status === 'APPROVED' || a.status === 'ADOPTION_COMPLETED'
  );

  const isAdoptedByApplication = !!approvedApplication;
  const livePreviewPet = {
    id: initialPet?.id || 'preview_pet',
    name: name || 'Luna',
    breed: breed || 'Golden British',
    gender: gender || 'FEMALE',
    color: color || 'GOLDEN',
    dob: dob || '2020-07-12',
    weight: weight ?? 12,
    code: pawLifeId || 'PL-00000',
    status: status || 'AVAILABLE',
    description: description || '',
    vaccinationStatus,        // ← thay isVaccinated
    isSpayedNeutered,
    images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=400'],
    pawHistory: sortedHistory,
    shelter: initialPet?.shelter || { name: 'PawLife Shelter', shelterType: 'Trạm cứu hộ' },
  };

  return (
    <div className="w-full max-w-[1280px] mx-auto flex flex-col font-sans pb-44 md:pb-20">
      <div className="flex flex-col lg:flex-row gap-5 lg:gap-7 items-start px-0 md:px-2 py-1">

        {/* ================= CỘT TRÁI: ÁNH + THÔNG TIN CƠ BẢN ================= */}
        <div className="w-full lg:w-[400px] xl:w-[440px] shrink-0 flex flex-col gap-5 p-1">
          <div className="ml-auto md:ml-0 flex items-center gap-4 md:gap-3">
            <button
              type="button"
              onClick={() => router.push('/shelter/pets')}
              className="text-gray-400 hover:text-[#123832] transition-colors shrink-0"
            >
              <ChevronLeft size={26} />
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-[#0D062D] truncate">{name || 'Thêm Pet'}</h1>
            <span className="hidden sm:inline text-lg text-[#8E8E93] truncate">({breed || 'Giống loài'})</span>
          </div>

          <div className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col bg-white">
            {/* Main Pet Image / Slider */}
            <div
              className={`relative w-full h-[260px] sm:h-[320px] xl:h-[340px] bg-gray-100 group overflow-hidden ${images.length === 0 ? 'cursor-pointer' : ''}`}
              onClick={() => isEditing && images.length === 0 && fileInputRef.current?.click()}
            >
              {images.length > 0 ? (
                <Image
                  src={images[Math.min(currentImageIndex, images.length - 1)]}
                  alt={name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-2">
                  <Camera size={32} />
                  <span className="text-xs font-medium">Thêm ảnh Pet</span>
                </div>
              )}

              {images.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={goPrevImage}
                    disabled={images.length <= 1}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/85 backdrop-blur flex items-center justify-center shadow-sm transition-colors hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} className="text-gray-700" />
                  </button>
                  <button
                    type="button"
                    onClick={goNextImage}
                    disabled={images.length <= 1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/85 backdrop-blur flex items-center justify-center shadow-sm transition-colors hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={16} className="text-gray-700" />
                  </button>

                  {images.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                      {images.map((_, i) => (
                        <span
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full transition-colors ${i === Math.min(currentImageIndex, images.length - 1) ? 'bg-white' : 'bg-white/50'
                            }`}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Status badge dropdown */}
              <div className="absolute top-4 right-4 z-20">
                <PetStatusDropdown
                  status={status}
                  onChange={(v) => setStatus(v)}
                  disabled={!isEditing}
                />
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
            </div>

            <div className="p-5 flex flex-col gap-4">
              {images.length > 0 && (
                <PetImageManager
                  images={images}
                  onChange={handleImagesChange}
                  onAdd={() => fileInputRef.current?.click()}
                  disabled={!isEditing || isSubmitting}
                />
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-[#F9F9F9] border border-gray-200 rounded-2xl px-4 py-3">
                  <label className="text-[11px] text-[#8E8E93] block mb-1">Tên</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!isEditing}
                    placeholder="Tên Pet"
                    className="w-full bg-transparent text-[14px] font-semibold text-black outline-none uppercase tracking-wide disabled:text-black"
                  />
                </div>
                <div className="bg-[#F9F9F9] border border-gray-200 rounded-2xl px-4 py-3">
                  <label className="text-[11px] text-[#8E8E93] block mb-1">Loại</label>
                  <CustomSelect
                    options={SPECIES_OPTIONS}
                    value={species}
                    onChange={(v) => setSpecies(v as PetSpecies)}
                    disabled={!isEditing}
                    searchable={false}
                  />
                </div>
                <div className="bg-[#F9F9F9] border border-gray-200 rounded-2xl px-4 py-3">
                  <label className="text-[11px] text-[#8E8E93] block mb-1">Giống</label>
                  <CustomSelect
                    options={BREED_DATA[safeSpecies].map((b) => ({ value: b.value, label: b.vi }))}
                    value={breed}
                    onChange={setBreed}
                    disabled={!isEditing}
                    allowCustom
                    placeholder="Chọn giống"
                    customPlaceholder="Nhập tên giống..."
                  />
                </div>

                <div className="bg-[#F9F9F9] border border-gray-200 rounded-2xl px-4 py-3">
                  <label className="text-[11px] text-[#8E8E93] block mb-1">Giới tính</label>
                  <CustomSelect
                    options={GENDER_OPTIONS}
                    value={gender}
                    onChange={(v) => setGender(v as PetGender)}
                    disabled={!isEditing}
                    searchable={false}
                  />
                </div>

                <div className="bg-[#F9F9F9] border border-gray-200 rounded-2xl px-4 py-3">
                  <label className="text-[11px] text-[#8E8E93] block mb-1">Màu sắc</label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    disabled={!isEditing}
                    placeholder="Màu sắc"
                    className="w-full bg-transparent text-[14px] font-semibold text-black outline-none uppercase tracking-wide disabled:text-black"
                  />
                </div>

                <div className="bg-[#F9F9F9] border border-gray-200 rounded-2xl px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] text-[#8E8E93]">Sinh nhật</label>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() =>
                          dobMode === 'date' ? handleSwitchToAgeMode() : setDobMode('date')
                        }
                        className="text-[10px] font-semibold text-[#E89B5A] hover:underline"
                      >
                        {dobMode === 'date' ? 'Theo năm tuổi' : 'Theo ngày sinh'}
                      </button>
                    )}
                  </div>

                  {dobMode === 'date' ? (
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      disabled={!isEditing}
                      className="w-full bg-transparent text-[14px] font-semibold text-black outline-none tracking-wide disabled:text-black"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={40}
                        value={ageYears ?? ''}
                        onChange={(e) =>
                          setAgeYears(e.target.value ? Number(e.target.value) : undefined)
                        }
                        disabled={!isEditing}
                        placeholder="VD: 3"
                        className="w-20 bg-transparent text-[14px] font-semibold text-black outline-none disabled:text-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0"
                      />
                      <span className="text-[12px] text-[#8E8E93]">
                        tuổi
                      </span>
                    </div>
                  )}
                </div>

                <div className="bg-[#F9F9F9] border border-gray-200 rounded-2xl px-4 py-3">
                  <label className="text-[11px] text-[#8E8E93] block mb-1">Cân nặng (kg)</label>
                  <input
                    type="number"
                    value={weight ?? ''}
                    onChange={(e) => setWeight(e.target.value ? Number(e.target.value) : undefined)}
                    disabled={!isEditing}
                    placeholder="VD: 12"
                    className="w-full bg-transparent text-[14px] font-semibold text-black outline-none disabled:text-black"
                  />
                </div>

                {/* <div className="bg-[#F9F9F9] border border-gray-200 rounded-2xl px-4 py-3">
                  <label className="text-[11px] text-[#8E8E93] block mb-1">PawLife ID</label>
                  <input
                    type="text"
                    value={pawLifeId}
                    onChange={(e) => setPawLifeId(e.target.value)}
                    disabled={!isEditing}
                    placeholder="VD: PL-00000"
                    className="w-full bg-transparent text-[14px] font-semibold text-black outline-none uppercase tracking-wide disabled:text-black"
                  />
                </div> */}

                <div className="bg-[#F9F9F9] border border-gray-200 rounded-2xl px-4 py-3">
                  <label className="text-[11px] text-[#8E8E93] block mb-1">Pet ID</label>
                  <input
                    type="text"
                    value={shelterInternalId}
                    onChange={(e) => setShelterInternalId(e.target.value)}
                    disabled={!isEditing}
                    placeholder="VD: SHL-00123"
                    className="w-full bg-transparent text-[14px] font-semibold text-black outline-none uppercase tracking-wide disabled:text-black"
                  />
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* ================= CỘT PHẢI: ACTIONS + TABS + NỘI DUNG ================= */}
        <div className="flex-1 min-w-0 flex flex-col gap-5 px-2 py-1">
          {/* Actions */}
          <div className="fixed inset-x-0 bottom-[calc(var(--tabbar-h)+env(safe-area-inset-bottom))] z-40 flex items-center gap-3 border-t border-black/5 bg-white/85 px-4 py-3 backdrop-blur-xl md:static md:z-auto md:justify-end md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
            {/* <button
              type="button"
              onClick={() => setShow3DModal(true)}
              className="h-11 flex-1 md:h-[38px] md:flex-none px-4 rounded-lg border border-orange-200 text-[#E89B5A] bg-white text-sm font-semibold flex items-center gap-2 hover:bg-orange-50 transition-colors cursor-pointer"
            >
              <SparklesIcon size={14} /> Live Preview (3D)
            </button> */}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="h-11 flex-[1.4] md:h-[38px] md:flex-none px-5 rounded-lg bg-[#E89B5A] text-white text-sm font-bold hover:bg-[#D68B4E] transition-colors disabled:opacity-70"
            >
              {isSubmitting ? 'Đang lưu...' : mode === 'create' ? 'Tạo mới' : 'Lưu Thay Đổi'}
            </button>
          </div>

          {/* Tab bar */}
          <div className="flex w-full bg-[#76768014] rounded-full p-1 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('info')}
              className={`flex-1 px-2 sm:px-6 py-2 sm:py-1.5 rounded-full text-[13px] sm:text-sm transition-colors ${activeTab === 'info' ? 'bg-white text-black font-semibold shadow-sm' : 'text-gray-500 font-medium'
                }`}
            >
              Thông tin
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('applications')}
              className={`flex-1 px-2 sm:px-6 py-2 sm:py-1.5 rounded-full text-[13px] sm:text-sm transition-colors ${activeTab === 'applications' ? 'bg-white text-black font-semibold shadow-sm' : 'text-gray-500 font-medium'
                }`}
            >
              Đơn nhận nuôi
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('documents')}
              className={`flex-1 px-2 sm:px-6 py-2 sm:py-1.5 rounded-full text-[13px] sm:text-sm transition-colors ${activeTab === 'documents' ? 'bg-white text-black font-semibold shadow-sm' : 'text-gray-500 font-medium'
                }`}
            >
              Tài liệu
            </button>
          </div>

          {/* TAB: THÔNG TIN */}
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
              {/* Sub-card trái */}
              <div className="flex flex-col gap-4">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-6">
                  {/* Giới thiệu */}
                  <div>
                    <h3 className="text-sm font-medium text-black mb-2">Giới thiệu</h3>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={!isEditing}
                      placeholder="Mô tả chi tiết về thú cưng..."
                      className="w-full bg-[#F9FAFB] border border-gray-200 rounded-xl p-3 text-xs text-[#8E8E93] leading-relaxed outline-none resize-none"
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-medium text-black">Thẻ</h3>
                      <span className="text-xs text-gray-400">Đã chọn {selectedTags.length}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedTags.map((tag, idx) => {
                        const style = TAG_COLOR_STYLES[idx % TAG_COLOR_STYLES.length];
                        return (
                          <span
                            key={`${tag.vi}_${idx}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
                            style={{ backgroundColor: style.bg, borderColor: style.border, color: style.color }}
                          >
                            {tag.vi}
                            {isEditing && (
                              <button type="button" onClick={() => removeTag(idx)}>
                                <X size={12} className="hover:text-red-500" />
                              </button>
                            )}
                          </span>
                        );
                      })}
                    </div>
                    {isEditing && (
                      <div className="flex flex-wrap gap-1.5 items-center text-xs text-gray-500">
                        {SUGGESTED_TAGS.filter((t) => !selectedTags.some((s) => s.vi === t)).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => toggleTag(t)}
                            className="hover:text-gray-800 transition-colors"
                          >
                            + {t}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setShowAddTagInput((v) => !v)}
                          className="font-semibold text-[#E89B5A] hover:text-[#D68B4E] transition-colors"
                        >
                          + Thêm thẻ mới
                        </button>
                      </div>
                    )}
                    {isEditing && showAddTagInput && (
                      <div className="flex flex-col gap-2 mt-3 p-3 bg-[#F9FAFB] border border-gray-200 rounded-xl">
                        <div>
                          <label className="text-[10px] text-gray-400 block mb-1">Tên thẻ (Tiếng Việt) *</label>
                          <input
                            type="text"
                            value={newTagVi}
                            onChange={(e) => setNewTagVi(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddCustomTag();
                              }
                            }}
                            placeholder="VD: Hay sủa"
                            disabled={isTranslatingTag}
                            className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-[#E89B5A] disabled:opacity-60"
                          />
                          <p className="text-[10px] text-gray-400 mt-1">Tiếng Anh sẽ được tự động dịch khi bạn bấm "Thêm thẻ"</p>
                        </div>
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => { setShowAddTagInput(false); setNewTagVi(''); }}
                            disabled={isTranslatingTag}
                            className="px-3 py-1.5 rounded-full text-xs font-semibold text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50"
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            onClick={handleAddCustomTag}
                            disabled={!newTagVi.trim() || isTranslatingTag}
                            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#E89B5A] text-white hover:bg-[#D68B4E] disabled:opacity-50 transition-colors"
                          >
                            {isTranslatingTag ? 'Đang dịch...' : 'Thêm thẻ'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tính cách */}
                  <div>
                    <h3 className="text-sm font-medium text-black mb-2">Tính cách</h3>
                    <div className="flex flex-col gap-2">
                      <div>
                        <label className="text-[11px] font-semibold text-[#00AC47] flex items-center gap-1 mb-1">
                          <Check size={12} /> Thân thiện với (phân tách bằng dấu phẩy)
                        </label>
                        <input
                          type="text"
                          value={goodWith}
                          onChange={(e) => setGoodWith(e.target.value)}
                          disabled={!isEditing}
                          placeholder="VD: Trẻ em, Người già, Chó, Mèo"
                          className="w-full bg-[#F9FAFB] border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 outline-none focus:border-[#E89B5A]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-red-500 flex items-center gap-1 mb-1">
                          <X size={12} /> Nên cân nhắc với
                        </label>
                        <input
                          type="text"
                          value={badWith}
                          onChange={(e) => setBadWith(e.target.value)}
                          disabled={!isEditing}
                          placeholder="VD: Mèo khác, Trẻ nhỏ"
                          className="w-full bg-[#F9FAFB] border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 outline-none focus:border-[#E89B5A]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Yêu cầu */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-medium text-black">Yêu cầu</h3>
                      <span className="text-xs text-gray-400">Đã chọn {selectedRequirements.length}/5</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {REQUIREMENT_OPTIONS.map((opt) => {
                        const isSelected = selectedRequirements.includes(opt.key);
                        const Icon = opt.icon;
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            disabled={!isEditing}
                            onClick={() => toggleRequirement(opt.key)}
                            className={`inline-flex items-center gap-2 px-3.5 py-2.5 md:py-2 rounded-full border text-[12px] md:text-[10px] font-medium transition-colors ${isSelected
                              ? 'border-[#E89B5A] bg-[#FFF8F0] text-[#E89B5A]'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                              } disabled:cursor-not-allowed disabled:opacity-60`}
                          >
                            <Icon size={16} className={isSelected ? 'text-[#E89B5A]' : 'text-gray-400'} />
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sức khỏe */}
                  <div>
                    <h3 className="text-sm font-medium text-black mb-3">Sức khỏe</h3>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => isEditing && cycleVaccinationStatus()}
                        className="flex-1 flex items-center gap-3 bg-[#F7F7F7] rounded-full h-[50px] px-2 text-left"
                      >
                        <div
                          className="w-[42px] h-[42px] rounded-full flex items-center justify-center shrink-0"
                          style={{ backgroundColor: VACCINATION_STATUS_CONFIG[vaccinationStatus].bgIcon }}
                        >
                          <Syringe size={18} style={{ color: VACCINATION_STATUS_CONFIG[vaccinationStatus].color }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12px] text-[#8E8E93]">Tiêm chủng</p>
                          <p
                            className="text-[13px] font-medium truncate"
                            style={{ color: VACCINATION_STATUS_CONFIG[vaccinationStatus].color }}
                          >
                            {VACCINATION_STATUS_CONFIG[vaccinationStatus].label}
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => isEditing && setIsSpayedNeutered((v) => !v)}
                        className="flex-1 flex items-center gap-3 bg-[#F7F7F7] rounded-full h-[50px] px-2 text-left"
                      >
                        <div className="bg-white w-[42px] h-[42px] rounded-full flex items-center justify-center shrink-0">
                          {isSpayedNeutered ? (
                            <Check size={18} className="text-[#E89B5A]" />
                          ) : (
                            <X size={18} className="text-red-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12px] text-[#8E8E93]">Trạng thái</p>
                          <p className={`text-[13px] font-medium truncate ${isSpayedNeutered ? 'text-black' : 'text-black'}`}>
                            {isSpayedNeutered ? 'Đã triệt sản' : 'Chưa triệt sản'}
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* KHỐI GHI CHÚ */}
                {mode === 'edit' && initialPet?.id && (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4">
                    <h3 className="text-sm font-bold text-gray-900">Ghi chú</h3>

                    <div className="flex flex-col gap-4">
                      {notes.length === 0 && (
                        <p className="text-xs text-gray-400 italic">Chưa có ghi chú nào.</p>
                      )}
                      {notes.map((note) => (
                        <div key={note.id} className="flex gap-3 items-start">
                          <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 mt-0.5 border border-gray-100 bg-gray-100">
                            {note.avatar ? (
                              <Image src={note.avatar} alt={note.author} fill className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-bold">
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

                    {/* Input Thêm ghi chú mới */}
                    <form onSubmit={handleAddNote} className="relative mt-2 w-full">
                      <input
                        type="text"
                        value={newNoteInput}
                        onChange={(e) => setNewNoteInput(e.target.value)}
                        placeholder="Thêm ghi chú dưới tên Julia Nguyễn"
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
                )}
              </div>

              {/* Sub-card phải */}
              <div className="flex flex-col gap-4">
                {/* PawHistory */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <p className="text-sm font-medium text-black mb-4">PawHistory | Hành trình</p>
                  <div className="flex flex-col">
                    {sortedHistory.map((item, index) => {
                      const isLastItem = index === sortedHistory.length - 1;
                      const cfg = HISTORY_TYPE_CONFIG[item.type] ?? DEFAULT_HISTORY_CONFIG;
                      const Icon = cfg.Icon;
                      return (
                        <div key={item.id ?? index} className="flex min-h-[48px]">
                          <div className="w-6 relative mr-2.5 shrink-0">
                            {!isLastItem && (
                              <div className="absolute w-[1px] bg-gray-200" style={{ top: 26, bottom: -4, left: 11.5 }} />
                            )}
                            <div className="w-6 h-6 rounded-full flex items-center justify-center relative z-10" style={{ backgroundColor: cfg.bg }}>
                              <Icon size={12} style={{ color: cfg.color }} />
                            </div>
                          </div>
                          <div className={`flex-1 ${!isLastItem ? 'pb-3' : ''}`}>
                            <div className="flex justify-between items-start gap-2">
                              <p className="text-[12px] font-medium text-black">{localizeHistoryTitle(item)}</p>
                              <span className="text-[10px] text-[#8E8E93] shrink-0">
                                {item.type === 'BIRTH'
                                  ? formatAgeFromDob(item.date) || new Date(item.date).toLocaleDateString('vi-VN')
                                  : new Date(item.date).toLocaleDateString('vi-VN')}
                              </span>
                            </div>
                            {item.description && (
                              <p className="text-[10px] text-[#8E8E93] mt-0.5 line-clamp-2">{localizeHistoryDescription(item.description)}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2 bg-[#F5F5F5] rounded-lg py-2 px-3 mt-2">
                    <Lock size={11} className="text-[#8E8E93] shrink-0" />
                    <span className="text-[10px] text-[#8E8E93]">Hành trình không thể bị xóa hay chỉnh sửa</span>
                  </div>
                </div>

                {/* KHỐI HỒ SƠ Y TẾ */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4">
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
                    {medicalList.map((item, index) => {
                      const style = MEDICAL_STATUS_STYLE[item.verificationStatus || 'PENDING'];
                      return (
                        <div key={item.id ?? `new_${index}`} className="border border-gray-200 rounded-2xl p-3.5 flex flex-col gap-1 bg-white relative">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Syringe size={14} className="text-gray-400 shrink-0" />
                              <span className="text-xs font-bold text-gray-900">{item.recordName || item.type}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${style.className}`}>
                                {style.icon} {style.label}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveMedical(index)}
                              title="Xoá hồ sơ"
                              className="text-gray-400 hover:text-red-500"
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                          <p className="text-[11px] text-gray-400 pl-5">
                            Loại: {item.type} | Ngày: {item.recordDate ? new Date(item.recordDate).toLocaleDateString('vi-VN') : 'Chưa rõ'}
                          </p>
                          {item.hasNextDueDate && item.nextDueDate && (
                            <p className="text-[11px] text-[#E89B5A] font-semibold pl-5">
                              Lịch tiếp theo: {new Date(item.nextDueDate).toLocaleDateString('vi-VN')}
                            </p>
                          )}
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
                            {MEDICAL_TYPE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
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
                            {/* Nếu đã chọn file -> hiển thị tên file, ngược lại hiển thị chữ mặc định */}
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
                      {/* Hiện công khai trên PawLife app */}
                      <div className="flex items-center justify-between">
                        <label className="text-[13px] font-medium text-black">Hiện công khai trên PawLife app</label>
                        <ToggleSwitch checked={medicalIsPublic} onChange={setMedicalIsPublic} />
                      </div>
                      {/* Nút bấm Form */}
                      <div className="flex items-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowMedicalForm(false)}
                          className="flex-1 border border-gray-200 bg-white text-gray-600 font-semibold py-2 rounded-full text-xs hover:bg-gray-50 transition-colors"
                        >
                          Hủy
                        </button>
                        <button
                          type="submit"
                          disabled={!medicalType || !medicalFile || isUploadingMedicalFile}
                          className="flex-1 bg-[#E89B5A] hover:bg-[#D68B4E] disabled:opacity-50 text-white font-bold py-2 rounded-full text-xs shadow-sm transition-colors"
                        >
                          {isUploadingMedicalFile ? 'Đang tải...' : 'Lưu hồ sơ'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: ĐƠN NHẬN NUÔI */}
          {activeTab === 'applications' && (
            <div className="flex flex-col gap-4">
              {isAdoptedByApplication && (
                <div className="flex items-center gap-3 bg-[#EBFFE2] border border-[#D1F5BF] rounded-2xl px-5 py-4">
                  <span className="text-2xl">🎉</span>
                  <div>
                    <p className="text-sm font-bold text-[#2F7A1F]">
                      {name || 'Pet này'} đã được nhận nuôi
                    </p>
                    <p className="text-xs text-[#4B7A3D]">
                      Đơn của <span className="font-semibold">{approvedApplication?.applicantName}</span> đã được duyệt trên trang Quản lý hồ sơ nhận nuôi.
                      {status !== 'ADOPTED' && (
                        <> Hãy cập nhật trạng thái pet sang <span className="font-semibold">"Đã nhận nuôi"</span> để đồng bộ.</>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {applications.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {applications.map((app) => {
                    const badge = APPLICATION_STATUS_STYLE[app.status] || APPLICATION_STATUS_STYLE.PENDING;
                    return (
                      <div
                        key={app.id}
                        className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-start gap-3.5"
                      >
                        <div className="w-[48px] h-[48px] rounded-full overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center text-gray-300">
                          {app.applicantAvatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={app.applicantAvatar} alt={app.applicantName} className="w-full h-full object-cover" />
                          ) : (
                            <User size={20} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[14px] font-semibold text-black truncate">{app.applicantName}</p>
                            <span
                              className="text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0"
                              style={{ backgroundColor: badge.bg, color: badge.color }}
                            >
                              {badge.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[12px] text-gray-600">
                            <FiPhone size={12} className="text-gray-400 shrink-0" />
                            <span className="truncate">{app.applicantPhone || 'Chưa có SĐT'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[12px] text-gray-600">
                            <FiMail size={12} className="text-gray-400 shrink-0" />
                            <span className="truncate">{app.applicantEmail || 'Chưa có email'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[12px] text-gray-600">
                            <FiCalendar size={12} className="text-gray-400 shrink-0" />
                            <span className="truncate">Nộp ngày: {fmtAppDate(app.submittedAt)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 flex flex-col items-center text-center">
                  <FileText size={22} className="text-gray-300 mb-2" />
                  <p className="text-sm font-medium text-black mb-1">Chưa có đơn đăng ký nhận nuôi</p>
                  <p className="text-[12px] text-gray-400 max-w-sm">
                    Các đơn đăng ký nhận nuôi {name || 'thú cưng này'} sẽ hiển thị ở đây khi có người nộp.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB: DOCUMENT */}
          {activeTab === 'documents' && (
            <div className="bg-white rounded-[20px] border border-gray-200 shadow-sm overflow-hidden w-full">
              {/* Table Header */}
              <div className="hidden md:grid grid-cols-[2.5fr_1fr_1.5fr_1.2fr_1.2fr] px-6 py-4 border-b border-gray-100 bg-[#FAFAFA] text-[13px] font-medium text-gray-500">
                <span>Tên tài liệu</span>
                <span>Ngày</span>
                <span>Người đăng</span>
                <span>Trạng thái</span>
                <span>Thao tác</span>
              </div>

              <div className="flex flex-col divide-y divide-gray-100">
                {medicalList.map((item, idx) => {
                  const style = MEDICAL_STATUS_STYLE[item.verificationStatus || 'PENDING'];
                  const firstImage = item.images?.[0] || null;
                  return (
                    <div
                      key={item.id ?? `doc_${idx}`} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 md:grid md:grid-cols-[2.5fr_1fr_1.5fr_1.2fr_1.2fr] px-4 md:px-6 py-4 hover:bg-gray-50/50 transition-colors"
                    >
                      <span className="w-full md:w-auto font-bold text-gray-900 text-sm truncate">{item.recordName || item.type}</span>
                      <span className="text-sm text-gray-600 font-medium">
                        {item.recordDate ? new Date(item.recordDate).toLocaleDateString('vi-VN') : 'Chưa rõ'}
                      </span>
                      <span className="text-sm text-gray-600 font-medium">Bạn</span>
                      <div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold border ${style.className}`}>
                          {style.icon} {style.label}
                        </span>
                      </div>
                      <div className="ml-auto md:ml-0 flex items-center gap-4 md:gap-3">
                        <button
                          type="button"
                          title={firstImage ? 'Xem' : 'Chưa có file'}
                          disabled={!firstImage}
                          onClick={() => firstImage && window.open(firstImage, '_blank')}
                          className="text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed p-1.5 -m-1.5"
                        >
                          <Eye size={20} />
                        </button>
                        <button
                          type="button"
                          title={firstImage ? 'Tải xuống' : 'Chưa có file'}
                          disabled={!firstImage}
                          onClick={() => firstImage && window.open(firstImage, '_blank')}
                          className="text-gray-400 hover:text-[#3B6BE3] transition-colors disabled:opacity-30 disabled:cursor-not-allowed p-1.5 -m-1.5"
                        >
                          <Download size={20} />
                        </button>
                        <button
                          type="button"
                          title="Xóa"
                          onClick={() => handleRemoveMedical(idx)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1.5 -m-1.5"
                        >
                          <FiTrash2 size={20} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Live Preview 3D */}
      {show3DModal && (
        <PetPublic3DModal
          pet={livePreviewPet}
          onClose={() => setShow3DModal(false)}
        />
      )}
      {selectedApplication && (
        <ApplicationDetailModal
          application={selectedApplication}
          onClose={() => {
            setSelectedApplication(null);
            refetchApplications(); // đồng bộ lại status mới nhất sau khi đóng modal
          }}
        />
      )}
    </div>
  );
};