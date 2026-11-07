import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { toast } from 'react-hot-toast';
import { shelterTeamService } from '@/services/shelterTeamService';
import type { ShelterTeamMember, ShelterInvitationItem, ShelterStaffRole } from '@/types/shelterTeam';
import axiosClient from '@/lib/api/axiosClient';
import { apiClient } from '@/lib/api/ApiClient';

// HÀM UPLOAD ẢNH (Tương tự như bên upload ảnh Pet/Shelter)
async function uploadOne(file: File, folder: string): Promise<string> {
  const { data } = await axiosClient.post('/storage/presigned-url', {
    fileName: file.name,
    fileType: file.type || 'image/jpeg',
    folder,
  });
  const res = await fetch(data.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file
  });
  if (!res.ok) throw new Error('Upload ảnh thất bại');
  return data.fileUrl;
}

interface ShelterTeamState {
  members: ShelterTeamMember[];
  invitations: ShelterInvitationItem[];
  me: ShelterTeamMember | null;
  isLoading: boolean;
  isMeLoading: boolean;
  isSubmitting: boolean;
  changeMyPassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  changeMemberPassword: (memberId: string, newPassword: string) => Promise<boolean>;
}

interface ShelterTeamActions {
  fetchTeam: () => Promise<void>;
  fetchMe: () => Promise<void>;
  // Bổ sung thêm tham số avatarFile
  updateMe: (name: string, avatarFile?: File | null) => Promise<boolean>;
  // Bổ sung hàm updateMemberName
  updateMemberName: (userId: string, name: string) => Promise<boolean>;
  inviteMember: (email: string, role: ShelterStaffRole, name?: string) => Promise<boolean>;
  updateMemberRole: (userId: string, role: ShelterStaffRole) => Promise<boolean>;
  removeMember: (userId: string) => Promise<boolean>;
  cancelInvitation: (invitationId: string) => Promise<boolean>;
}

const useShelterTeamStoreBase = create<ShelterTeamState & ShelterTeamActions>()((set, get) => ({
  members: [],
  invitations: [],
  me: null,
  isLoading: false,
  isMeLoading: false,
  isSubmitting: false,

  fetchTeam: async () => {
    set({ isLoading: true });
    try {
      const data = await shelterTeamService.getTeam();
      set({ members: data.members, invitations: data.invitations });
    } catch (e: any) {
      toast.error(e.message || 'Không thể tải danh sách thành viên.');
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMe: async () => {
    set({ isMeLoading: true });
    try {
      const me = await shelterTeamService.getMe();
      set({ me });
    } catch (e: any) {
      toast.error(e.message || 'Không thể tải thông tin tài khoản.');
    } finally {
      set({ isMeLoading: false });
    }
  },
  changeMyPassword: async (oldPassword, newPassword) => {
    try {
      await apiClient.patch('/shelter-dashboard/team/me/password', { oldPassword, newPassword });
      toast.success('Đổi mật khẩu thành công');
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Đổi mật khẩu thất bại');
      return false;
    }
  },

  changeMemberPassword: async (memberId, newPassword) => {
    try {
      await apiClient.patch(`/shelter-dashboard/team/${memberId}/password`, { newPassword });
      toast.success('Đặt lại mật khẩu thành công');
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Đặt lại mật khẩu thất bại');
      return false;
    }
  },

  updateMe: async (name, avatarFile) => {
    set({ isSubmitting: true });
    try {
      let avatarUrl = undefined;
      if (avatarFile) {
        // 👇 ĐỔI TÊN FOLDER Ở DÒNG NÀY (VD: 'avatars' hoặc 'images')
        avatarUrl = await uploadOne(avatarFile, 'avatars');
      }

      // Gọi API cập nhật
      const updated = await shelterTeamService.updateMe(name, avatarUrl);

      set((s) => ({
        me: updated,
        members: s.members.map((m) => (m.id === updated.id ? { ...m, name: updated.name, avatarUrl: updated.avatarUrl || m.avatarUrl } : m)),
      }));

      toast.success('Đã cập nhật thông tin tài khoản.');
      return true;
    } catch (e: any) {
      toast.error(e.message || 'Không thể cập nhật thông tin tài khoản.');
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // Triển khai logic updateMemberName
  updateMemberName: async (userId, name) => {
    try {
      await shelterTeamService.updateMemberName(userId, name);
      toast.success('Đã cập nhật tên thành viên.');
      await get().fetchTeam(); // Refresh lại list
      return true;
    } catch (e: any) {
      toast.error(e.message || 'Không thể cập nhật tên thành viên.');
      return false;
    }
  },

  inviteMember: async (email, role, name) => {
    set({ isSubmitting: true });
    try {
      await shelterTeamService.inviteMember(email, role, name);
      toast.success('Đã gửi lời mời qua email!');
      await get().fetchTeam();
      return true;
    } catch (e: any) {
      toast.error(e.message || 'Không thể gửi lời mời.');
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },

  updateMemberRole: async (userId, role) => {
    try {
      await shelterTeamService.updateMemberRole(userId, role);
      toast.success('Đã cập nhật vai trò.');
      await get().fetchTeam();
      return true;
    } catch (e: any) {
      toast.error(e.message || 'Không thể cập nhật vai trò.');
      return false;
    }
  },

  removeMember: async (userId) => {
    try {
      await shelterTeamService.removeMember(userId);
      toast.success('Đã xoá thành viên.');
      await get().fetchTeam();
      return true;
    } catch (e: any) {
      toast.error(e.message || 'Không thể xoá thành viên.');
      return false;
    }
  },

  cancelInvitation: async (invitationId) => {
    try {
      await shelterTeamService.cancelInvitation(invitationId);
      toast.success('Đã thu hồi lời mời.');
      await get().fetchTeam();
      return true;
    } catch (e: any) {
      toast.error(e.message || 'Không thể thu hồi lời mời.');
      return false;
    }
  },
}));

export const useShelterTeam = () =>
  useShelterTeamStoreBase(useShallow((s) => ({
    members: s.members,
    invitations: s.invitations,
    me: s.me,
    isLoading: s.isLoading,
    isMeLoading: s.isMeLoading,
  })));

export const useShelterTeamActions = () =>
  useShelterTeamStoreBase(useShallow((s) => ({
    fetchTeam: s.fetchTeam,
    fetchMe: s.fetchMe,
    updateMe: s.updateMe,
    updateMemberName: s.updateMemberName, // XUẤT HÀM NÀY RA CHO UI DÙNG
    changeMyPassword: s.changeMyPassword,
    changeMemberPassword: s.changeMemberPassword,
    inviteMember: s.inviteMember,
    updateMemberRole: s.updateMemberRole,
    removeMember: s.removeMember,
    cancelInvitation: s.cancelInvitation,
    isSubmitting: s.isSubmitting,
  })));