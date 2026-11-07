import { create } from 'zustand';
import { apiClient } from '@/lib/api/ApiClient';
import { toast } from 'react-hot-toast';
import { AdoptionApplication, ApplicationStatus } from '@/types/application';

export interface AdoptionRequestItem {
  id: string;
  status: ApplicationStatus;
  rejectionReason?: string | null;
  reviewNote?: string | null;
  createdAt: string;
  pet?: {
    id: string;
    name: string;
    breed?: any;
    images?: { url: string }[];
    shelter?: { name: string; phone?: string; address?: string };
  };
  appointments?: { id: string; scheduledAt: string; status: string }[];
}

interface UserAdoptionState {
  profile: AdoptionApplication | null;
  requests: AdoptionRequestItem[];
  isLoading: boolean;
  isSubmitting: boolean;

  fetchProfile: () => Promise<void>;
  fetchRequests: () => Promise<void>;
  updateProfile: (data: Partial<AdoptionApplication>) => Promise<boolean>;
  cancelRequest: (requestId: string) => Promise<boolean>;
  createAppointment: (requestId: string, scheduledAt: string, notes?: string) => Promise<boolean>;
}

export const useUserAdoptionStore = create<UserAdoptionState>((set, get) => ({
  profile: null,
  requests: [],
  isLoading: false,
  isSubmitting: false,

  fetchProfile: async () => {
    set({ isLoading: true });
    try {
      const data = await apiClient.get('/adoption-applications/me');
      set({ profile: data });
    } catch (error) {
      console.error('Fetch adoption profile error:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchRequests: async () => {
    try {
      const data = await apiClient.get('/adoption-applications/my-requests');
      set({ requests: Array.isArray(data) ? data : [] });
    } catch (error) {
      console.error('Fetch adoption requests error:', error);
    }
  },

  updateProfile: async (data) => {
    set({ isSubmitting: true });
    try {
      const updated = await apiClient.put('/adoption-applications/me', data);
      set({ profile: updated });
      toast.success('Cập nhật hồ sơ thành công!');
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Cập nhật thất bại');
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },

  cancelRequest: async (requestId) => {
    try {
      await apiClient.patch(`/adoption-applications/my-requests/${requestId}/cancel`);
      toast.success('Đã hủy yêu cầu nhận nuôi.');
      await get().fetchRequests();
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Không thể hủy yêu cầu');
      return false;
    }
  },

  createAppointment: async (requestId, scheduledAt, notes) => {
    set({ isSubmitting: true });
    try {
      await apiClient.post('/adoption-applications/appointments', { requestId, scheduledAt, notes });
      toast.success('Đã đặt lịch hẹn thành công!');
      await get().fetchRequests();
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Không thể đặt lịch hẹn');
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },
}));