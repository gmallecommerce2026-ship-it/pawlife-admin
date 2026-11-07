import { apiClient } from '@/lib/api/ApiClient';
import type { ShelterStaffRole, ShelterTeamMember } from '@/types/shelterTeam';

const unwrap = <T = any>(res: any): T => (res?.data !== undefined ? res.data : res);

export const shelterTeamService = {
  getTeam: async () => unwrap(await apiClient.get('/shelter-dashboard/team')),

  getMe: async (): Promise<ShelterTeamMember> =>
    unwrap(await apiClient.get('/shelter-dashboard/team/me')),
  
  updateMe: async (name: string, avatarUrl?: string): Promise<ShelterTeamMember> =>
    unwrap(await apiClient.patch('/shelter-dashboard/team/me', { name, avatarUrl })),

  updateMemberName: async (userId: string, name: string) =>
    unwrap(await apiClient.patch(`/shelter-dashboard/team/${userId}/name`, { name })),

  inviteMember: async (email: string, role: ShelterStaffRole, name?: string) =>
    unwrap(await apiClient.post('/shelter-dashboard/team/invite', { email, role, name })),

  updateMemberRole: async (userId: string, role: ShelterStaffRole) =>
    unwrap(await apiClient.patch(`/shelter-dashboard/team/${userId}/role`, { role })),

  removeMember: async (userId: string) =>
    unwrap(await apiClient.delete(`/shelter-dashboard/team/${userId}`)),

  cancelInvitation: async (invitationId: string) =>
    unwrap(await apiClient.delete(`/shelter-dashboard/team/invitations/${invitationId}`)),

  getInvitationPreview: async (token: string) =>
    unwrap(await apiClient.get(`/invitations/${token}`)),

  acceptInvitation: async (token: string, password: string) =>
    unwrap(await apiClient.post(`/invitations/${token}/accept`, { password })),
};