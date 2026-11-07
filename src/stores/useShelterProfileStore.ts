// src/stores/useShelterProfileStore.ts
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { apiClient } from '@/lib/api/ApiClient';
import { toast } from 'react-hot-toast';
import { ShelterProfile, ShelterProfileFormValues } from '@/types/shelter';
import { uploadFileToR2 } from '@/lib/upload/uploadToR2';
import axiosClient from '@/lib/api/axiosClient';

interface ShelterProfileState {
  profile: ShelterProfile | null;
  isLoading: boolean;
  isSubmitting: boolean;
}

interface ShelterProfileActions {
  fetchProfile: () => Promise<void>;
  updateProfile: (
    values: ShelterProfileFormValues,
    logoFile: File | null,
    coverFile?: File | null,
  ) => Promise<boolean>;
}
async function uploadOne(file: File, folder: string): Promise<string> {
  const { data } = await axiosClient.post('/storage/presigned-url', {
    fileName: file.name, fileType: file.type || 'image/jpeg', folder,
  });
  const res = await fetch(data.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
  if (!res.ok) throw new Error('Upload ảnh thất bại');
  return data.fileUrl;
}

const useShelterProfileStoreBase = create<ShelterProfileState & ShelterProfileActions>()((set, get) => ({
  profile: null,
  isLoading: false,
  isSubmitting: false,

  fetchProfile: async () => {
    set({ isLoading: true });
    try {
      // SỬA: Trỏ thẳng vào Backend thay vì route /api/shelter/profile
      const res = await apiClient.get('/shelter-dashboard/profile');
      set({ profile: res as ShelterProfile });
    } catch (error) {
      console.error('Fetch shelter profile error:', error);
      toast.error('Không thể tải dữ liệu hồ sơ.');
    } finally {
      set({ isLoading: false });
    }
  },

  updateProfile: async (values, logoFile, coverFile) => {
    set({ isSubmitting: true });
    try {
      const [logoUrl, coverUrl] = await Promise.all([
        logoFile ? uploadOne(logoFile, 'shelter-logos') : undefined,
        coverFile ? uploadOne(coverFile, 'shelter-covers') : undefined,
      ]);

      // SỬA: Thay axiosClient.patch thành apiClient.patch để Header có chứa Token
      const data = await apiClient.patch('/shelter-dashboard/profile', {
        ...values,
        ...(logoUrl && { logoUrl }),
        ...(coverUrl && { coverUrl }),
      });

      set({ profile: data, isSubmitting: false });
      toast.success('Lưu hồ sơ thành công!');
      return true;
    } catch (e: any) {
      set({ isSubmitting: false });
      console.error('[updateProfile]', e);
      toast.error(e.message || 'Lưu thất bại, vui lòng thử lại.');
      return false;
    }
  },
}));

export const useShelterProfile = () =>
  useShelterProfileStoreBase(useShallow((state) => ({
    profile: state.profile,
    isLoading: state.isLoading,
  })));

export const useShelterProfileActions = () =>
  useShelterProfileStoreBase(useShallow((state) => ({
    fetchProfile: state.fetchProfile,
    updateProfile: state.updateProfile,
    isSubmitting: state.isSubmitting,
  })));

export const useShelterProfileStore = useShelterProfileStoreBase;
