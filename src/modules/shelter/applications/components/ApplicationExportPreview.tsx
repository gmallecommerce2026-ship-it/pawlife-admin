import React from 'react';
import {
  ChevronLeft, Calendar, Check, X, MapPin, Home, Heart, Phone, Cat, PawPrint,
  User, ShieldCheck, Info, Send, ChevronDown, Weight, Hash,
} from 'lucide-react';
import { AdoptionApplication, COMMITMENTS_CONFIG } from '@/types/application';
import { formatBreed, MaybeBilingual } from '@/utils/bilingualField';
import { formatPetAge } from '@/utils/petAge';
import {
  translateHousing, translatePetExperience, translateEmploymentStatus,
  translateYesNo, translatePetHistory, translateAdoptionReason, checkCommitmentValue,
} from '@/utils/applicationTranslators';

export const PDF_WIDTH = 794;

const STATUS_LABEL: Record<string, string> = {
  SUBMITTED: 'Mới nộp',
  PENDING: 'Đang xét duyệt',
  NEED_MORE_INFO: 'Cần bổ sung',
  INTERVIEW_SCHEDULED: 'Hẹn phỏng vấn',
  APPROVED: 'Đã duyệt',
  ADOPTION_COMPLETED: 'Đã nhận nuôi',
  CLOSED: 'Đã đóng',
};

const fmtDate = (d?: string | Date | null) => {
  if (!d) return '--/--/----';
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return '--/--/----';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(x.getDate())}/${p(x.getMonth() + 1)}/${x.getFullYear()}`;
};

const initials = (name: string) => {
  const w = name.trim().split(/\s+/).filter(Boolean);
  if (!w.length) return '?';
  if (w.length === 1) return (w[0][0] + (w[0].length > 1 ? w[0][w[0].length - 1] : '')).toUpperCase();
  return (w[0][0] + w[w.length - 1][0]).toUpperCase();
};

const SectionTitle = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="w-9 h-9 rounded-full bg-[#FDEBDD] flex items-center justify-center text-[#E89B5A]">{icon}</div>
    <h3 className="font-bold text-[#1F1F2E] text-[15px]">{children}</h3>
  </div>
);

const F = ({ label, value, span }: { label: string; value?: React.ReactNode; span?: boolean }) => (
  <div className={span ? 'col-span-2' : ''}>
    <div className="text-[11px] text-gray-400 mb-1">{label}</div>
    <div className="font-semibold text-[#1F1F2E] text-[13px] leading-snug">{value || '-'}</div>
  </div>
);

const Divider = () => <div className="h-px bg-gray-100 my-6 ml-12" />;

interface Props {
  application: AdoptionApplication;
  /** data-URL của ảnh (để html2canvas không bị lỗi CORS) */
  petImage?: string;
  avatarImage?: string;
}

export const ApplicationPdfTemplate: React.FC<Props> = ({ application, petImage, avatarImage }) => {
  const a = application as any;
  const pet = a.pet ?? {};
  const name = a.fullName || a.user?.name || 'Người đăng ký';
  const email = a.user?.email || a.zalo || '';
  const isMale = pet.gender !== 'FEMALE';
  const speciesLabel = pet.species === 'DOG' ? 'Chó' : pet.species === 'CAT' ? 'Mèo' : pet.speciesLabel || '';
  const age = formatPetAge(pet.dob) || '-';
  const breed = formatBreed(pet.breed as MaybeBilingual) || 'Giống lai';
  const status = STATUS_LABEL[a.status] ?? 'Đang xét duyệt';
  const color = pet.color || pet.coatColor || '-';
  const weight = pet.weight ? `${pet.weight} kg` : '-';
  const shelterId = pet.petCode || pet.shelterPetId || pet.code || pet.id?.slice(0, 8)?.toUpperCase() || '-';
  const message = a.message || a.note || a.applicantMessage || a.additionalInfo;

  return (
    <div
      style={{ width: PDF_WIDTH, fontFamily: "'Be Vietnam Pro', 'Inter', system-ui, sans-serif" }}
      className="bg-[#FDFDFD] text-gray-800"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3.5 bg-[#F7F7F7] border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <ChevronLeft size={18} className="text-gray-400" />
          <PawPrint size={22} className="text-[#E89B5A]" fill="currentColor" />
          <span className="text-[#E89B5A] font-extrabold text-[19px] leading-none">PawLife</span>
          <span className="text-gray-400 text-[11px] ml-1">Mỗi bé đều xứng đáng có một mái ấm</span>
        </div>
        <div className="px-4 py-1.5 bg-[#FDEBDD] border border-[#F7D3B8] text-[#E89B5A] font-semibold text-[11px] rounded-full">
          Đơn nhận nuôi
        </div>
      </div>

      <div className="px-6 pt-6 pb-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-5">
          <div>
            <h1 className="text-[30px] font-extrabold text-[#14142B] leading-tight mb-2">Đơn đăng ký nhận nuôi</h1>
            <p className="text-gray-400 text-[11.5px] leading-relaxed">
              Cảm ơn bạn đã quan tâm và sẵn sàng mang đến một mái ấm cho các bé.<br />
              Vui lòng kiểm tra thông tin và xác nhận lại trước khi gửi đơn.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-[#FFF3E8] border border-[#F7D9C0] rounded-full pl-1.5 pr-4 py-1.5 mt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-6 h-6 rounded-full bg-[#F3A571] flex items-center justify-center">
                <Calendar size={12} className="text-white" />
              </span>
              <span className="text-[11px] text-gray-500">Ngày nộp: <b className="font-semibold text-gray-700">{fmtDate(a.createdAt)}</b></span>
            </div>
            <div className="w-px h-4 bg-[#F0C9A8]" />
            <div className="flex items-center gap-1.5">
              <Calendar size={13} className="text-[#E89B5A]" />
              <span className="text-[11px] text-gray-500">Cập nhật: <b className="font-semibold text-gray-700">{fmtDate(a.updatedAt)}</b></span>
            </div>
          </div>
        </div>

        <div className="grid gap-4" style={{ gridTemplateColumns: '300px 1fr' }}>
          {/* LEFT */}
          <div className="flex flex-col gap-4">
            <div className="bg-white border border-gray-100 rounded-[18px] p-3 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
              <div className="relative mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={petImage} alt={pet.name} className="w-full h-[250px] object-cover rounded-[12px] bg-gray-100" />
                <div className="absolute top-2.5 right-2.5 bg-[#FFF3E8] text-[#E89B5A] text-[10.5px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 border border-[#F7D9C0]">
                  <Heart size={10} fill="currentColor" /> {status} <ChevronDown size={10} />
                </div>
              </div>

              <div className="flex items-baseline gap-2 mb-3 px-1">
                <span className="text-[24px] font-extrabold text-[#14142B] leading-none">{pet.name || 'Bé'}</span>
                <span className={`text-[15px] ${isMale ? 'text-[#3DB2FF]' : 'text-[#FF6B93]'}`}>{isMale ? '♂' : '♀'}</span>
                {speciesLabel && <span className="text-gray-400 text-[12px]">({speciesLabel})</span>}
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { bg: '#E6F0FF', ic: <Cat size={15} className="text-[#4F75E2]" />, l: 'Giới tính', v: isMale ? 'Đực' : 'Cái' },
                  { bg: '#FFF7D6', ic: <Calendar size={15} className="text-[#E5A124]" />, l: 'Tuổi', v: age },
                  { bg: '#FFE6EC', ic: <Weight size={15} className="text-[#FF6B93]" />, l: 'Kích cỡ', v: weight },
                ].map((t) => (
                  <div key={t.l} className="rounded-[10px] py-2.5 px-1 text-center" style={{ background: t.bg }}>
                    <div className="flex justify-center mb-1">{t.ic}</div>
                    <div className="text-[9.5px] text-gray-400">{t.l}</div>
                    <div className="font-bold text-[12px] text-gray-800">{t.v}</div>
                  </div>
                ))}
              </div>

              <div className="border border-gray-100 rounded-[12px] px-3 py-1 text-[11.5px]">
                {[
                  { i: <PawPrint size={13} />, l: 'Giống', v: breed },
                  { i: <Info size={13} />, l: 'Màu sắc', v: color },
                  { i: <Calendar size={13} />, l: 'Tuổi', v: age },
                  { i: <Hash size={13} />, l: 'Shelter ID', v: shelterId },
                ].map((r, idx, arr) => (
                  <div key={r.l} className={`py-2.5 ${idx < arr.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <div className="flex items-center gap-1.5 text-gray-400 mb-0.5">{r.i}<span>{r.l}</span></div>
                    <div className="font-bold text-gray-800 pl-[19px]">{r.v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Adopter */}
            <div className="bg-white border border-gray-100 rounded-[18px] p-4 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
              <h3 className="font-bold text-[#14142B] flex items-center gap-2 mb-3 text-[13.5px]">
                <User size={16} fill="currentColor" /> Thông tin người nhận nuôi
              </h3>
              <div className="flex items-center gap-3 mb-3">
                {avatarImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarImage} alt={name} className="w-11 h-11 rounded-full object-cover" />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-[#F3A571] text-white flex items-center justify-center font-bold text-[14px]">
                    {initials(name)}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-bold text-[13px] text-gray-900">{name}</div>
                  <div className="text-gray-400 text-[10.5px] mb-1">{email}</div>
                  <span className="bg-[#DDF5E6] text-[#10B981] text-[9.5px] px-2 py-0.5 rounded-full font-semibold">Đã xác thực</span>
                </div>
              </div>
              <div className="space-y-2.5 text-[11.5px] text-gray-700">
                {[
                  { i: <Phone size={13} />, t: a.phone },
                  { i: <MapPin size={13} />, t: a.location },
                  { i: <Home size={13} />, t: translateHousing(a.housing) },
                  { i: <PawPrint size={13} />, t: translatePetHistory(a.prevPetHistory) },
                  { i: <Heart size={13} />, t: translatePetExperience(a.petExperience) },
                ].map((r, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="text-gray-400 mt-[1px] shrink-0">{r.i}</span>
                    <span className="leading-snug">{r.t || 'Chưa cập nhật'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#FFF3E8] border border-[#F7D9C0] rounded-[14px] p-4">
              <h4 className="font-bold text-[#D9822F] flex items-center gap-1.5 mb-1.5 text-[11.5px]">
                <Heart size={13} /> Cùng tạo nên một mái ấm
              </h4>
              <p className="text-[10.5px] text-gray-600 leading-relaxed">
                Cảm ơn bạn vì đã quan tâm đến {pet.name || 'bé'}. Chúng tôi sẽ liên hệ sớm nhất khi đơn được duyệt.
              </p>
            </div>
          </div>

          {/* RIGHT */}
          <div className="bg-white border border-gray-100 rounded-[18px] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.04)] self-start">
            <SectionTitle icon={<User size={17} fill="currentColor" />}>A. Thông tin liên hệ</SectionTitle>
            <div className="grid grid-cols-2 gap-y-5 gap-x-4 pl-12">
              <F label="Họ và tên" value={name} />
              <F label="Số điện thoại" value={a.phone} />
              <F label="Email / Zalo" value={email} />
              <F label="Đối tượng nhận nuôi" value="Bản thân tự nuôi" />
            </div>
            <Divider />

            <SectionTitle icon={<Home size={17} fill="currentColor" />}>B. Điều kiện sinh sống</SectionTitle>
            <div className="grid grid-cols-2 gap-y-5 gap-x-4 pl-12">
              <F label="Khu vực sinh sống" value={a.location} />
              <F label="Loại nhà ở" value={translateHousing(a.housing)} />
              <F label="Trẻ em trong nhà" value={translateYesNo(a.children)} />
              <F label="Kế hoạch chuồng / xích" value={translateYesNo(a.cage)} />
            </div>
            <Divider />

            <SectionTitle icon={<Heart size={17} fill="currentColor" />}>C. Kinh nghiệm &amp; Cá nhân</SectionTitle>
            <div className="grid grid-cols-2 gap-y-5 gap-x-4 pl-12">
              <F label="Đã từng nuôi thú cưng" value={translatePetExperience(a.petExperience)} />
              <F label="Tình trạng việc làm" value={translateEmploymentStatus(a.employmentStatus)} />
              <F span label="Lịch sử chăm sóc trước đây" value={translatePetHistory(a.prevPetHistory)} />
            </div>
            <Divider />

            <SectionTitle icon={<ShieldCheck size={17} fill="currentColor" />}>E. Cam kết nhận nuôi</SectionTitle>
            <div className="pl-12">
              <F label="Lý do nhận nuôi" value={translateAdoptionReason(a.adoptionReason)} />
              <div className="h-px bg-gray-100 my-4" />
              <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                {COMMITMENTS_CONFIG.map((c) => {
                  const ok = checkCommitmentValue(a.commitments, c.key, c.label);
                  return (
                    <div key={c.key} className="flex items-start gap-2 text-[11.5px] text-gray-700 leading-snug">
                      {ok ? (
                        <Check size={14} strokeWidth={3} className="text-emerald-500 shrink-0 mt-[1px]" />
                      ) : (
                        <X size={14} strokeWidth={3} className="text-rose-500 shrink-0 mt-[1px]" />
                      )}
                      <span>{c.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {message && (
              <div className="mt-6 bg-[#FFF3E8] border border-[#F7D9C0] rounded-[12px] p-4">
                <div className="flex items-center gap-1.5 text-[#D9822F] font-bold text-[11.5px] mb-1.5">
                  <PawPrint size={13} fill="currentColor" /> Lời nhắn từ người nhận nuôi
                </div>
                <p className="text-gray-600 text-[10.5px] leading-relaxed">{message}</p>
              </div>
            )}

            <div className="mt-5 bg-[#F3A571] text-white rounded-[12px] py-3.5 flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-2 font-bold text-[12px]">
                <Send size={14} /> Đơn {status.toLowerCase()}
              </div>
              <span className="text-[9.5px] opacity-90">Chúng tôi sẽ liên hệ với bạn sớm nhất.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};