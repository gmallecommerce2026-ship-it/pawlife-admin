'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  MapPin,
  Phone,
  Mail,
  Camera,
  Globe,
  Bell,
  Pencil,
  Trash2,
  Plus,
  Check,
  Lock,
  Clock,
  X,
  Loader2,
  Key // BỔ SUNG THÊM ICON NÀY
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useShelterProfile, useShelterProfileActions } from '@/stores/useShelterProfileStore';
import { ShelterProfileFormValues, defaultOpeningHours } from '@/types/shelter';
import { OpeningHoursEditor } from '@/components/OpeningHoursEditor';
import { useShelterTeam, useShelterTeamActions } from '@/store/useShelterTeamStore';
import { STAFF_ROLE_LABEL, STAFF_ROLE_COLOR } from '@/types/shelterTeam';
import { InviteMemberModal } from '@/components/InviteMemberModal';
import { getUserFromToken } from '@/utils/getUserFromToken';

const AddressPicker = dynamic(() => import('@/components/AddressPicker'), {
  ssr: false,
  loading: () => <div className="w-full h-[50px] bg-gray-50 border border-gray-200 rounded-xl animate-pulse" />
});

type FormValues = ShelterProfileFormValues & {
  lat?: number;
  lng?: number;
  bio?: string;
  shelterType?: string;
  website?: string;
  policy?: string;
};

const SHELTER_TYPE_OPTIONS = [
  { value: 'Animal Shelter & Rescue', label: 'Trạm cứu hộ & Bảo trợ động vật' },
  { value: 'Nonprofit organization', label: 'Tổ chức phi lợi nhuận' },
  { value: 'Foster Home', label: 'Nhà nuôi tạm (Foster Home)' },
  { value: 'Veterinary Clinic', label: 'Phòng khám thú y kiêm cứu hộ' },
  { value: 'Individual Rescuer', label: 'Cá nhân cứu hộ tự do' },
];

const PERMISSIONS_DATA = [
  { name: 'Thêm pet mới', admin: true, vet: true, member: true, volunteer: true },
  { name: 'Sửa thông tin pet', admin: true, vet: true, member: true, volunteer: true },
  { name: 'Cập nhật hồ sơ y tế', admin: true, vet: true, member: false, volunteer: false },
  { name: 'Xóa pet', admin: true, vet: true, member: true, volunteer: false },
  { name: 'Xem và quản lý đơn đăng ký', admin: true, vet: true, member: true, volunteer: true },
  { name: 'Duyệt/từ chối đơn đăng ký', admin: true, vet: false, member: true, volunteer: false },
  { name: 'Ghi chú external note', admin: true, vet: true, member: true, volunteer: false },
  { name: 'Tạo cuộc hẹn phỏng vấn', admin: true, vet: false, member: true, volunteer: false },
  { name: 'Quản lý account và team member', admin: true, vet: false, member: false, volunteer: false },
];

const getRoleBadgeStyle = (color: string) => {
  switch (color) {
    case 'purple': return 'bg-[#F4E8FF] text-[#A855F7] border border-[#E9D5FF]';
    case 'blue': return 'bg-[#E0F2FE] text-[#3B82F6] border border-[#BAE6FD]';
    case 'green': return 'bg-[#DCFCE7] text-[#22C55E] border border-[#BBF7D0]';
    case 'pink': return 'bg-[#FCE7F3] text-[#EC4899] border border-[#FBCFE8]';
    default: return 'bg-gray-100 text-gray-500 border border-gray-200';
  }
};

export const ShelterProfileForm = () => {
  const { profile, isLoading } = useShelterProfile();
  const { fetchProfile, updateProfile, isSubmitting } = useShelterProfileActions();

  const [activeTab, setActiveTab] = useState<'info' | 'members'>('info');
  const [isEditing, setIsEditing] = useState(false);

  const [values, setValues] = useState<FormValues>({
    name: '',
    address: '',
    phone: '',
    email: '',
    description: '',
    openingHours: defaultOpeningHours,
    bio: '',
    shelterType: SHELTER_TYPE_OPTIONS[0].value,
    website: '',
    policy: '',
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const profileLat = profile?.latitude;
  const profileLng = profile?.longitude;
  const profileCoverUrl = profile?.coverUrl;

  const { members, invitations, me, isLoading: isTeamLoading } = useShelterTeam();

  // BỔ SUNG CÁC ACTION ĐỔI PASSWORD
  const { fetchTeam, fetchMe, updateMe, updateMemberRole, removeMember, cancelInvitation, updateMemberName, changeMyPassword, changeMemberPassword } = useShelterTeamActions() as any;
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  // States cho quản lý tài khoản cá nhân (Me)
  const [meName, setMeName] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [isSavingMe, setIsSavingMe] = useState(false);

  // States cho chỉnh sửa tên thành viên trong danh sách
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editMemberName, setEditMemberName] = useState('');
  const [isSavingMember, setIsSavingMember] = useState(false);

  // BỔ SUNG: States cho Modal Đổi Mật Khẩu
  const [pwdTarget, setPwdTarget] = useState<{ id: string, name: string, type: 'me' | 'member' } | null>(null);
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [isSavingPwd, setIsSavingPwd] = useState(false);

  const [tokenUser, setTokenUser] = useState<any>(null);
  useEffect(() => {
    setTokenUser(getUserFromToken());
  }, []);

  const currentMember = React.useMemo(() => {
    if (!members?.length) return null;
    return members.find(m => (me?.id && m.id === me.id) || (tokenUser?.email && m.email === tokenUser.email)) || null;
  }, [members, me, tokenUser]);

  const displayAvatar = me?.avatarUrl || currentMember?.avatarUrl || tokenUser?.avatarUrl;
  const displayName = me?.name || currentMember?.name || tokenUser?.name || '';
  const displayEmail = me?.email || currentMember?.email || tokenUser?.email || '';
  const displayRole = me?.shelterRole || currentMember?.shelterRole;

  useEffect(() => {
    if (displayName) setMeName(displayName);
  }, [displayName]);

  useEffect(() => {
    if (activeTab === 'members') {
      (async () => {
        await fetchTeam();
        await fetchMe();
      })();
    }
  }, [activeTab]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveMe = async () => {
    if (!meName.trim()) return;
    setIsSavingMe(true);
    try {
      await updateMe(meName.trim(), avatarFile);
      setAvatarFile(null); // Reset file ảnh sau khi thành công
    } catch (error) {
      console.error(error);
    } finally {
      setIsSavingMe(false);
    }
  };

  const handleSaveMemberName = async (id: string) => {
    if (!editMemberName.trim()) return;
    setIsSavingMember(true);
    try {
      if (updateMemberName) {
        await updateMemberName(id, editMemberName.trim());
      } else {
        alert("Chức năng updateMemberName chưa được định nghĩa trong store!");
      }
    } finally {
      setIsSavingMember(false);
      setEditingMemberId(null);
    }
  };

  // BỔ SUNG: Hàm Submit Modal Đổi Mật Khẩu
  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwdTarget || !newPwd.trim()) return;

    if (pwdTarget.type === 'me' && !oldPwd.trim()) {
      alert('Vui lòng nhập mật khẩu cũ!');
      return;
    }

    setIsSavingPwd(true);
    try {
      let success = false;

      if (pwdTarget.type === 'me') {
        if (typeof changeMyPassword !== 'function') {
          throw new Error('changeMyPassword chưa được định nghĩa trong store');
        }
        success = await changeMyPassword(oldPwd, newPwd);
      } else {
        if (typeof changeMemberPassword !== 'function') {
          throw new Error('changeMemberPassword chưa được định nghĩa trong store');
        }
        success = await changeMemberPassword(pwdTarget.id, newPwd);
      }

      if (success) {
        setPwdTarget(null);
        setOldPwd('');
        setNewPwd('');
      }
    } catch (error) {
      console.error(error);
      alert('Có lỗi xảy ra khi đổi mật khẩu');
    } finally {
      setIsSavingPwd(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (profile) populateFormWithProfile();
  }, [profile]);

  const populateFormWithProfile = () => {
    if (!profile) return;
    setValues({
      name: profile.name,
      address: profile.address,
      phone: profile.phone,
      email: profile.email,
      description: profile.description || '',
      openingHours: profile.openingHours?.length ? profile.openingHours : defaultOpeningHours,
      latitude: profileLat,
      longitude: profileLng,
      bio: profile.bio || '',
      shelterType: profile.shelterType || SHELTER_TYPE_OPTIONS[0].value,
      website: (profile as any).website || '',
      policy: (profile as any).policy || '',
    });
    setLogoPreview(profile.logoUrl);
    setCoverPreview(profileCoverUrl || null);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleCancel = () => {
    populateFormWithProfile();
    setLogoFile(null);
    setCoverFile(null);
    setIsEditing(false);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    const bio = (values.bio || '').trim();
    const desc = (values.description || '').trim();
    if (bio && desc && bio === desc) {
      alert('Mô tả ngắn và Giới thiệu đang giống nhau. Vui lòng nhập nội dung khác nhau để app không hiển thị lặp.');
      return;
    }
    if (e) e.preventDefault();
    if (!values.address) {
      alert('Vui lòng chọn địa chỉ trên bản đồ');
      return;
    }
    const success = await updateProfile(values, logoFile, coverFile);
    if (success) {
      setLogoFile(null);
      setCoverFile(null);
      setIsEditing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full py-20 text-center text-gray-400 font-sans">
        Đang tải hồ sơ trạm cứu hộ...
      </div>
    );
  }

  const shelterTypeLabel = SHELTER_TYPE_OPTIONS.find((o) => o.value === values.shelterType)?.label || SHELTER_TYPE_OPTIONS[0].label;

  return (
    <div className="w-full max-w-[1000px] mx-auto flex flex-col font-sans mb-20">
      {/* HEADER */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-[24px] md:text-[28px] font-bold text-[#1E1B4B] mb-1">Quản Lý Trạm</h2>
          <p className="text-[13px] text-gray-500">Thông tin này sẽ hiển thị công khai cho người nhận nuôi trên PawLife.</p>
        </div>
        <button className="p-2 text-gray-400 hover:text-[#E89B5A] transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
      </div>

      {/* TABS */}
      <div className="bg-gray-100 p-1.5 rounded-full flex w-full mb-8">
        <button
          onClick={() => setActiveTab('info')}
          className={`flex-1 font-semibold text-[13px] md:text-[14px] leading-tight px-2 py-2.5 rounded-full transition-all ${activeTab === 'info' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Thông tin trạm cứu hộ
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`flex-1 font-semibold text-[13px] md:text-[14px] leading-tight px-2 py-2.5 rounded-full transition-all ${activeTab === 'members' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Tài khoản & thành viên
        </button>
      </div>

      {/* TAB 1: THÔNG TIN TRẠM */}
      {activeTab === 'info' && (
        <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden flex flex-col animate-in fade-in duration-300">
          <div
            className="relative w-full h-[130px] md:h-[180px] bg-gradient-to-r from-[#FCAE7C] to-[#F97B89] group cursor-pointer"
            onClick={() => isEditing && coverInputRef.current?.click()}
          >
            {coverPreview && <Image src={coverPreview} alt="Cover" fill className="object-cover" />}
            {isEditing && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2 text-white bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm">
                  <Camera size={16} /> <span className="text-sm font-medium">Đổi ảnh bìa</span>
                </div>
              </div>
            )}
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
          </div>

          <div className="px-5 md:px-8 pb-6 md:pb-8">
            <div className="flex justify-between items-end -mt-[44px] md:-mt-[50px] mb-6 relative z-10">
              <div
                className="relative w-[88px] h-[88px] md:w-[110px] md:h-[110px] rounded-full border-[5px] border-white bg-[#D9D9D9] group overflow-hidden cursor-pointer"
                onClick={() => isEditing && fileInputRef.current?.click()}
              >
                {logoPreview && <Image src={logoPreview} alt="Logo" fill className="object-cover" />}
                {isEditing && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={24} className="text-white" />
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              </div>

              <div className="mb-2">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] border border-gray-200 text-gray-700 font-medium text-[14px] hover:bg-gray-50 transition-colors"
                  >
                    <Pencil size={14} /> Chỉnh Sửa
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="px-6 py-2.5 rounded-[10px] bg-[#E89B5A] text-white font-bold text-[14px] hover:bg-[#D68B4E] transition-colors disabled:opacity-70"
                    >
                      {isSubmitting ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isSubmitting}
                      className="px-6 py-2.5 rounded-[10px] border border-gray-200 text-gray-500 font-medium text-[14px] hover:bg-gray-50 transition-colors"
                    >
                      Hủy
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div>
                <h1 className="text-[22px] md:text-[24px] font-bold text-[#1E1B4B] mb-1">{values.name || 'Tên Trạm Cứu Hộ'}</h1>
                <p className="text-[14px] text-gray-400">{shelterTypeLabel}</p>
              </div>

              {!isEditing ? (
                <>
                  {values.bio && (
                    <p className="text-[15px] text-gray-600 mb-2 leading-relaxed">{values.bio}</p>
                  )}
                  <div>
                    <span className="text-[12px] text-gray-400 font-bold mb-1.5 block">Giới thiệu</span>
                    <p className="text-[14px] text-gray-800 leading-relaxed whitespace-pre-line">
                      {values.description || 'Chưa cập nhật'}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mt-2">
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 rounded-full bg-[#FFF8F3] text-[#E89B5A] shrink-0 mt-0.5"><Mail size={18} /></div>
                      <div className="flex flex-col">
                        <span className="text-[12px] text-gray-400 font-medium mb-0.5">Email</span>
                        <span className="text-[15px] font-medium text-gray-900">{values.email || 'Chưa cập nhật'}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 rounded-full bg-[#FFF8F3] text-[#E89B5A] shrink-0 mt-0.5"><MapPin size={18} /></div>
                      <div className="flex flex-col">
                        <span className="text-[12px] text-gray-400 font-medium mb-0.5">Địa chỉ</span>
                        <span className="text-[15px] font-medium text-gray-900 leading-snug">{values.address || 'Chưa cập nhật'}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 rounded-full bg-[#FFF8F3] text-[#E89B5A] shrink-0 mt-0.5"><Phone size={18} /></div>
                      <div className="flex flex-col">
                        <span className="text-[12px] text-gray-400 font-medium mb-0.5">Số điện thoại</span>
                        <span className="text-[15px] font-medium text-gray-900">{values.phone || 'Chưa cập nhật'}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 rounded-full bg-[#FFF8F3] text-[#E89B5A] shrink-0 mt-0.5"><Globe size={18} /></div>
                      <div className="flex flex-col">
                        <span className="text-[12px] text-gray-400 font-medium mb-0.5">Website</span>
                        <span className="text-[15px] font-medium text-gray-900">{values.website || 'Chưa cập nhật'}</span>
                      </div>
                    </div>
                    <div className="col-span-1 md:col-span-2 flex items-start gap-4 mt-5">
                      <div className="p-2.5 rounded-full bg-[#FFF8F3] text-[#E89B5A] shrink-0 mt-0.5 border border-[#FCE8D5]">
                        <Clock size={18} />
                      </div>
                      <div className="flex flex-col w-full">
                        <span className="text-[12px] text-gray-400 font-bold mb-2">Giờ hoạt động</span>
                        <OpeningHoursEditor
                          value={values.openingHours}
                          isEditing={false}
                          onChange={() => { }}
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* FORM EDIT MODE */
                <div className="flex flex-col gap-5 mt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="text-[12px] font-bold text-gray-400 mb-1.5 block">Tên trạm</label>
                      <input
                        type="text"
                        value={values.name}
                        onChange={(e) => setValues(p => ({ ...p, name: e.target.value }))}
                        className="w-full bg-[#F9FAFB] border border-transparent rounded-[12px] px-4 py-3 text-[14px] text-gray-900 outline-none focus:border-[#E89B5A] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[12px] font-bold text-gray-400 mb-1.5 block">Loại hình</label>
                      <select
                        value={values.shelterType}
                        onChange={(e) => setValues(p => ({ ...p, shelterType: e.target.value }))}
                        className="w-full bg-[#F9FAFB] border border-transparent rounded-[12px] px-4 py-3 text-[14px] text-gray-900 outline-none focus:border-[#E89B5A] transition-colors"
                      >
                        {SHELTER_TYPE_OPTIONS.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1.5">
                      <label className="text-[12px] font-bold text-gray-400">Mô tả ngắn (Bio)</label>
                      <span className="text-[11px] text-gray-400">{(values.bio || '').length}/160</span>
                    </div>
                    <textarea
                      value={values.bio}
                      maxLength={160}
                      onChange={(e) => setValues(p => ({ ...p, bio: e.target.value }))}
                      placeholder="Một câu giới thiệu ngắn hiển thị dưới tên trạm trên app"
                      rows={2}
                      className="w-full bg-[#F9FAFB] border border-transparent rounded-[12px] p-4 text-[14px] text-gray-800 outline-none focus:border-[#E89B5A] transition-colors resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-[12px] font-bold text-gray-400 mb-1.5 block">Giới thiệu (hiển thị ở tab Liên hệ trên app)</label>
                    <textarea
                      value={values.description}
                      onChange={(e) => setValues(p => ({ ...p, description: e.target.value }))}
                      placeholder="Câu chuyện, sứ mệnh, hoạt động của trạm..."
                      rows={5}
                      className="w-full bg-[#F9FAFB] border border-transparent rounded-[12px] p-4 text-[14px] text-gray-800 outline-none focus:border-[#E89B5A] transition-colors resize-y"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="text-[12px] font-bold text-gray-400 mb-1.5 block">Email</label>
                      <div className="flex items-center gap-3 bg-[#F9FAFB] rounded-[12px] px-4 py-3 border border-transparent focus-within:border-[#E89B5A] transition-colors">
                        <Mail size={18} className="text-gray-400 shrink-0" />
                        <input
                          type="email"
                          value={values.email}
                          onChange={(e) => setValues(p => ({ ...p, email: e.target.value }))}
                          className="w-full bg-transparent outline-none text-[14px] text-gray-900"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[12px] font-bold text-gray-400 mb-1.5 block">Địa chỉ</label>
                      <div className="flex items-center gap-3 bg-[#F9FAFB] rounded-[12px] px-4 border border-transparent focus-within:border-[#E89B5A] transition-colors">
                        <MapPin size={18} className="text-gray-400 shrink-0" />
                        <div className="flex-1 w-full -ml-3">
                          <AddressPicker
                            disabled={isSubmitting}
                            initialAddress={profile?.address}
                            initialCenter={profileLat && profileLng ? [profileLat, profileLng] : undefined}
                            onSelect={(result) => setValues((p) => ({ ...p, address: result.address, latitude: result.lat, longitude: result.lng }))}
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-[12px] font-bold text-gray-400 mb-1.5 block">Số điện thoại</label>
                      <div className="flex items-center gap-3 bg-[#F9FAFB] rounded-[12px] px-4 py-3 border border-transparent focus-within:border-[#E89B5A] transition-colors">
                        <Phone size={18} className="text-gray-400 shrink-0" />
                        <input
                          type="text"
                          value={values.phone}
                          onChange={(e) => setValues(p => ({ ...p, phone: e.target.value }))}
                          className="w-full bg-transparent outline-none text-[14px] text-gray-900"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[12px] font-bold text-gray-400 mb-1.5 block">Website</label>
                      <div className="flex items-center gap-3 bg-[#F9FAFB] rounded-[12px] px-4 py-3 border border-transparent focus-within:border-[#E89B5A] transition-colors">
                        <Globe size={18} className="text-gray-400 shrink-0" />
                        <input
                          type="text"
                          value={values.website}
                          onChange={(e) => setValues(p => ({ ...p, website: e.target.value }))}
                          placeholder="https://"
                          className="w-full bg-transparent outline-none text-[14px] text-gray-900"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 mt-2 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock size={16} className="text-[#E89B5A]" />
                      <label className="text-[13px] font-bold text-gray-700">Cấu hình Giờ hoạt động</label>
                    </div>
                    <div className="bg-[#F9FAFB] p-5 rounded-[16px] border border-gray-100">
                      <OpeningHoursEditor
                        value={values.openingHours}
                        isEditing={isEditing}
                        onChange={(next: any) => setValues((p) => ({ ...p, openingHours: next }))}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TÀI KHOẢN & THÀNH VIÊN */}
      {activeTab === 'members' && (
        <div className="flex flex-col gap-8 animate-in fade-in duration-300">
          <div className="bg-white border border-gray-200 rounded-[20px] p-5 md:p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-start mb-6">
              <div className="flex items-center gap-5">

                {/* ẢNH AVATAR CÁ NHÂN CÓ THỂ THAY ĐỔI */}
                <div
                  className="relative w-[84px] h-[84px] rounded-full group cursor-pointer overflow-hidden border border-gray-100 shrink-0"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  <img
                    src={avatarPreview || displayAvatar || 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?q=80&w=100'}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={22} className="text-white" />
                  </div>
                  <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </div>

                <div className="flex flex-col">
                  <h3 className="text-[20px] font-bold text-gray-900 mb-1">{displayName || 'Chưa đặt tên'}</h3>
                  <p className="text-[14px] text-gray-400 mb-2">{displayEmail}</p>
                  {displayRole && (
                    <span className={`w-fit px-3 py-0.5 rounded-full text-[12px] font-medium ${getRoleBadgeStyle(STAFF_ROLE_COLOR[displayRole])}`}>
                      {STAFF_ROLE_LABEL[displayRole]}
                    </span>
                  )}
                </div>
              </div>

              {/* BỔ SUNG: Nút Đổi mật khẩu cá nhân */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setOldPwd('');
                    setNewPwd('');
                    setPwdTarget({ id: me?.id || '', name: displayName, type: 'me' });
                  }}
                  className="bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium text-[14px] px-4 py-2.5 rounded-[8px] transition-colors flex items-center gap-2 flex-1 md:flex-none justify-center"
                >
                  <Key size={16} /> Đổi mật khẩu
                </button>
                <button
                  onClick={handleSaveMe}
                  disabled={isSavingMe || (!meName.trim() && !avatarFile) || (meName.trim() === (displayName || '') && !avatarFile)}
                  className="bg-[#F3A571] hover:bg-[#E89B5A] text-white font-medium text-[14px] px-6 py-2.5 rounded-[8px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-1 md:flex-none"
                >
                  {isSavingMe ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="text-[12px] text-gray-400 mb-1.5 block">Tên đầy đủ</label>
                <input
                  type="text"
                  value={meName}
                  onChange={(e) => setMeName(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-[10px] px-4 py-2.5 text-[14px] text-gray-900 outline-none focus:border-[#E89B5A]"
                />
              </div>
              <div>
                <label className="text-[12px] text-gray-400 mb-1.5 block">Email</label>
                <input
                  type="text"
                  value={displayEmail}
                  readOnly
                  className="w-full bg-[#FAFAFA] border border-gray-200 rounded-[10px] px-4 py-2.5 text-[14px] text-gray-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4 mt-2">
              <h3 className="text-[20px] font-bold text-gray-900">Team Member</h3>
              <button
                onClick={() => setIsInviteOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors text-[13px] font-medium"
              >
                <Plus size={16} /> Thêm Member
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-[20px] overflow-hidden">
              <div className="hidden md:grid grid-cols-[2fr_2fr_1.5fr_1fr] px-6 py-4 border-b border-gray-100 bg-[#FAFAFA]">
                <span className="text-[13px] font-medium text-gray-500">Tên</span>
                <span className="text-[13px] font-medium text-gray-500">Email</span>
                <span className="text-[13px] font-medium text-gray-500">Quyền hạn</span>
                <span className="text-[13px] font-medium text-gray-500 text-right">Thao tác</span>
              </div>

              {isTeamLoading ? (
                <div className="py-10 text-center text-gray-400 text-[13px]">Đang tải...</div>
              ) : (
                <div className="flex flex-col divide-y divide-gray-100">
                  {members.map((member) => {
                    const isSelf = member.id === me?.id;
                    const isCurrentUserAdmin = me?.shelterRole === 'ADMIN';
                    const canEditRole = isCurrentUserAdmin && !isSelf;

                    return (
                      <div key={member.id} className="flex flex-col gap-2.5 md:grid md:grid-cols-[2fr_2fr_1.5fr_1fr] md:items-center px-4 md:px-6 py-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <img
                            src={member.avatarUrl || 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?q=80&w=100'}
                            alt={member.name || member.email}
                            className="w-8 h-8 rounded-full object-cover shrink-0"
                          />

                          {/* KHU VỰC CHỈNH SỬA TÊN THÀNH VIÊN */}
                          {editingMemberId === member.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                autoFocus
                                value={editMemberName}
                                onChange={(e) => setEditMemberName(e.target.value)}
                                className="border border-[#E89B5A] rounded px-2 py-1 text-[13px] outline-none w-[130px]"
                                placeholder="Nhập tên..."
                              />
                              {isSavingMember ? (
                                <Loader2 size={16} className="text-[#E89B5A] animate-spin shrink-0" />
                              ) : (
                                <>
                                  <button onClick={() => handleSaveMemberName(member.id)} className="text-green-500 hover:text-green-600 transition-colors shrink-0">
                                    <Check size={16} />
                                  </button>
                                  <button onClick={() => setEditingMemberId(null)} className="text-gray-400 hover:text-gray-600 transition-colors shrink-0">
                                    <X size={16} />
                                  </button>
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-[14px] font-bold text-gray-900 truncate max-w-[220px] md:max-w-[120px]">
                                {member.name || 'Chưa đặt tên'}
                                {isSelf && <span className="text-gray-400 font-normal"> (Bạn)</span>}
                              </span>
                              {canEditRole && (
                                <button
                                  onClick={() => {
                                    setEditingMemberId(member.id);
                                    setEditMemberName(member.name || '');
                                  }}
                                  className="text-gray-400 hover:text-[#E89B5A] transition-colors shrink-0"
                                  title="Chỉnh sửa tên"
                                >
                                  <Pencil size={12} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        <span className="text-[14px] text-gray-500 truncate pr-2 pl-11 md:pl-0">{member.email}</span>

                        <div>
                          {canEditRole ? (
                            <select
                              value={member.shelterRole}
                              onChange={(e) => updateMemberRole(member.id, e.target.value as any)}
                              className={`px-3 py-1 rounded-full text-[12px] font-medium border outline-none cursor-pointer ${STAFF_ROLE_COLOR[member.shelterRole] === 'purple' ? 'bg-[#F4E8FF] text-[#A855F7] border-[#E9D5FF]' :
                                STAFF_ROLE_COLOR[member.shelterRole] === 'blue' ? 'bg-[#E0F2FE] text-[#3B82F6] border-[#BAE6FD]' :
                                  STAFF_ROLE_COLOR[member.shelterRole] === 'green' ? 'bg-[#DCFCE7] text-[#22C55E] border-[#BBF7D0]' :
                                    'bg-[#FCE7F3] text-[#EC4899] border-[#FBCFE8]'
                                }`}
                            >
                              {(['ADMIN', 'MEMBER', 'VOLUNTEER', 'VETERINARIAN'] as const).map((r) => (
                                <option key={r} value={r}>{STAFF_ROLE_LABEL[r]}</option>
                              ))}
                            </select>
                          ) : (
                            <span
                              className={`px-3 py-1 rounded-full text-[12px] font-medium border w-fit inline-block ${STAFF_ROLE_COLOR[member.shelterRole] === 'purple' ? 'bg-[#F4E8FF] text-[#A855F7] border-[#E9D5FF]' :
                                STAFF_ROLE_COLOR[member.shelterRole] === 'blue' ? 'bg-[#E0F2FE] text-[#3B82F6] border-[#BAE6FD]' :
                                  STAFF_ROLE_COLOR[member.shelterRole] === 'green' ? 'bg-[#DCFCE7] text-[#22C55E] border-[#BBF7D0]' :
                                    'bg-[#FCE7F3] text-[#EC4899] border-[#FBCFE8]'
                                }`}
                            >
                              {STAFF_ROLE_LABEL[member.shelterRole]}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-start md:justify-end gap-3 pl-11 md:pl-0">
                          {isCurrentUserAdmin && !isSelf && (
                            <>
                              {/* BỔ SUNG: Nút đổi mật khẩu cho thành viên (Chỉ Admin) */}
                              <button
                                type="button"
                                onClick={() => {
                                  setOldPwd('');
                                  setNewPwd('');
                                  setPwdTarget({ id: member.id, name: member.name || member.email, type: 'member' });
                                }}
                                className="p-2.5 md:p-1.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-800 transition-colors"
                                title="Đổi mật khẩu"
                              >
                                <Key size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Xoá ${member.name || member.email} khỏi trạm?`)) removeMember(member.id);
                                }}
                                className="p-2.5 md:p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                title="Xóa thành viên"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {invitations.map((inv) => (
                    <div key={inv.id} className="flex flex-col gap-2.5 md:grid md:grid-cols-[2fr_2fr_1.5fr_1fr] md:items-center px-4 md:px-6 py-4 bg-[#FFFBF5]">
                      <div className="flex items-center gap-3">
                        <span className="text-[14px] font-bold text-gray-400 italic">Đang chờ chấp nhận</span>
                      </div>
                      <span className="text-[14px] text-gray-500">{inv.email}</span>
                      <span className="px-3 py-1 rounded-full text-[12px] font-medium bg-gray-100 text-gray-500 w-fit">
                        {STAFF_ROLE_LABEL[inv.role]}
                      </span>
                      <div className="flex items-center justify-end gap-4">
                        <button onClick={() => cancelInvitation(inv.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4 mt-2">
              <h3 className="text-[20px] font-bold text-gray-900">Quyền Hạn</h3>
            </div>

            <div className="bg-white border border-gray-200 rounded-[20px] overflow-x-auto shadow-sm">
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] min-w-[640px] px-6 py-4 border-b border-gray-100 bg-[#FAFAFA] items-center">
                <span className="text-[13px] font-medium text-gray-500">Quyền hạn</span>
                <span className="text-[13px] font-bold text-[#A855F7] text-center">Admin</span>
                <span className="text-[13px] font-bold text-[#EC4899] text-center">Bác sĩ thú y</span>
                <span className="text-[13px] font-bold text-[#3B82F6] text-center">Thành viên</span>
                <span className="text-[13px] font-bold text-[#22C55E] text-center">Tình nguyện viên</span>
              </div>

              <div className="flex flex-col divide-y divide-gray-100">
                {PERMISSIONS_DATA.map((item, index) => (
                  <div key={index} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] min-w-[640px] items-center px-6 py-4 hover:bg-gray-50/50 transition-colors">
                    <span className="text-[14px] text-gray-600 font-medium">{item.name}</span>
                    <div className="flex justify-center">
                      {item.admin && <Check size={20} strokeWidth={2.5} className="text-[#22C55E]" />}
                    </div>
                    <div className="flex justify-center">
                      {item.vet && <Check size={20} strokeWidth={2.5} className="text-[#22C55E]" />}
                    </div>
                    <div className="flex justify-center">
                      {item.member && <Check size={20} strokeWidth={2.5} className="text-[#22C55E]" />}
                    </div>
                    <div className="flex justify-center">
                      {item.volunteer && <Check size={20} strokeWidth={2.5} className="text-[#22C55E]" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {isInviteOpen && <InviteMemberModal onClose={() => setIsInviteOpen(false)} />}

      {/* MODAL ĐỔI MẬT KHẨU */}
      {pwdTarget && (
        <div className="fixed inset-0 bg-black/50 z-[110] flex items-end sm:items-center justify-center sm:p-4 backdrop-blur-sm" onClick={() => setPwdTarget(null)}>
          <form
            onSubmit={handleSubmitPassword}
            className="bg-white w-full sm:max-w-[420px] rounded-t-[28px] sm:rounded-[20px] shadow-2xl p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] relative animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPwdTarget(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <X size={20} strokeWidth={2} />
            </button>

            <h3 className="text-[18px] font-bold text-gray-900 mb-1">
              {pwdTarget.type === 'me' ? 'Đổi mật khẩu cá nhân' : 'Đặt lại mật khẩu'}
            </h3>
            <p className="text-[13px] text-gray-500 mb-6">
              {pwdTarget.type === 'me'
                ? 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới của bạn.'
                : <>Bạn đang đặt lại mật khẩu cho thành viên <strong className="text-gray-800">{pwdTarget.name}</strong>.</>
              }
            </p>

            <div className="flex flex-col gap-4 mb-6">
              {pwdTarget.type === 'me' && (
                <div>
                  <label className="text-[12px] font-bold text-gray-700 mb-1.5 block">Mật khẩu cũ</label>
                  <input
                    type="password"
                    value={oldPwd}
                    onChange={(e) => setOldPwd(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#F9FAFB] border border-gray-200 rounded-[10px] px-4 py-2.5 text-[14px] text-gray-900 outline-none focus:border-[#E89B5A]"
                  />
                </div>
              )}
              <div>
                <label className="text-[12px] font-bold text-gray-700 mb-1.5 block">Mật khẩu mới</label>
                <input
                  type="password"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#F9FAFB] border border-gray-200 rounded-[10px] px-4 py-2.5 text-[14px] text-gray-900 outline-none focus:border-[#E89B5A]"
                />
              </div>
            </div>

            <div className="flex items-center justify-start md:justify-end gap-3 pl-11 md:pl-0">
              <button
                type="button"
                onClick={() => setPwdTarget(null)}
                disabled={isSavingPwd}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[13px] font-semibold rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSavingPwd || !newPwd.trim()}
                className="px-6 py-2 bg-[#E89B5A] hover:bg-[#D68B4E] text-white text-[13px] font-bold rounded-lg disabled:opacity-60 transition-colors"
              >
                {isSavingPwd ? 'Đang lưu...' : 'Xác nhận'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};