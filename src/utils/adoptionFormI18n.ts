import { AdoptionApplication, localizedText } from '@/types/application';
import type { PdfTranslated } from '@/components/pdf/ApplicationPdfTemplate';

// ===== Copy từ app/adoption-form.tsx =====
const HOUSING_EN = ['House', 'House with a garden', 'Apartment (allows pet ownership)', 'Apartment (pets not allowed, but willing to keep a pet discreetly)', 'Rented house', 'Other'];
const HOUSING_VI = ['Nhà riêng', 'Nhà có sân vườn', 'Căn hộ (cho phép nuôi thú cưng)', 'Căn hộ (không cho phép nhưng vẫn muốn nuôi)', 'Nhà thuê', 'Khác'];

const EXP_EN = ['Yes, I used to have one', 'My pet is still living with me now', "No, I haven't"];
const EXP_VI = ['Có, tôi đã từng nuôi', 'Thú cưng vẫn đang sống cùng tôi', 'Chưa bao giờ'];

const JOB_EN = ['Currently employed', 'Currently employed (occasionally travels for work)', 'Currently employed (frequently travels for work)', 'Self-employed', 'Student (without a stable income)', 'Pupil'];
const JOB_VI = ['Đang đi làm', 'Đang đi làm (thỉnh thoảng công tác)', 'Đang đi làm (thường xuyên công tác)', 'Tự kinh doanh', 'Sinh viên (chưa có thu nhập ổn định)', 'Học sinh'];

const REASON_EN = ['Garden guarding', 'Parking lot guarding', 'Breeding', 'Gift for children', 'Because I want to give them a forever home', 'Other'];
const REASON_VI = ['Trông coi nhà/sân vườn', 'Giữ xe/bãi đỗ', 'Nhân giống', 'Quà tặng cho trẻ em', 'Vì tôi muốn cho chúng một mái ấm mãi mãi', 'Khác'];

const YNS_EN = ['Yes', 'No', 'Sometimes'];
const YNS_VI = ['Có', 'Không', 'Đôi khi'];

const FOR_EN = ['Myself', 'Someone else'];
const FOR_VI = ['Cho bản thân', 'Cho người khác'];

// ===== Helper =====
const norm = (s: string) => s.trim().toLowerCase();

const makeMap = (en: string[], vi: string[], extra: Record<string, string> = {}) => {
  const m = new Map<string, string>();
  en.forEach((e, i) => {
    m.set(norm(e), vi[i]);
    m.set(norm(vi[i]), vi[i]);
  });
  Object.entries(extra).forEach(([k, v]) => m.set(norm(k), v));
  return m;
};

const HOUSING = makeMap(HOUSING_EN, HOUSING_VI, {
  apartment: 'Căn hộ', townhouse: 'Nhà phố', villa: 'Biệt thự', dormitory: 'Ký túc xá',
});
const EXP = makeMap(EXP_EN, EXP_VI);
const JOB = makeMap(JOB_EN, JOB_VI, {
  employed: 'Đang đi làm', 'full-time': 'Toàn thời gian', 'part-time': 'Bán thời gian',
  student: 'Học sinh / Sinh viên', unemployed: 'Đang tìm việc', retired: 'Đã nghỉ hưu',
});
const REASON = makeMap(REASON_EN, REASON_VI);
const YNS = makeMap(YNS_EN, YNS_VI, { true: 'Có', false: 'Không' });
const FOR = makeMap(FOR_EN, FOR_VI);

const EMPTY = 'Chưa cập nhật';
const lookup = (map: Map<string, string>, v?: string | null) =>
  !v || !v.trim() ? EMPTY : map.get(norm(v)) ?? v.trim(); // text tự nhập thì giữ nguyên

/** Dịch tức thì, không gọi API */
export const buildPdfTranslated = (a: AdoptionApplication): PdfTranslated => ({
  adoptFor: lookup(FOR, a.adoptFor),
  housing: lookup(HOUSING, a.housing),
  children: lookup(YNS, a.children),
  cage: lookup(YNS, a.cage),
  petExperience: lookup(EXP, a.petExperience),
  prevPetHistory: a.prevPetHistory?.trim() || EMPTY,
  employmentStatus: lookup(JOB, a.employmentStatus),
  adoptionReason: lookup(REASON, a.adoptionReason),
  petBreed: localizedText(a.pet?.breed, 'vi') || 'Giống lai',
});