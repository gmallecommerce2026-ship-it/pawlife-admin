export type ShelterStaffRole = 'ADMIN' | 'MEMBER' | 'VOLUNTEER' | 'VETERINARIAN';

export interface ShelterTeamMember {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  shelterRole: ShelterStaffRole;
  createdAt: string;
}

export interface ShelterInvitationItem {
  id: string;
  email: string;
  role: ShelterStaffRole;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
  createdAt: string;
  expiresAt: string;
}

export const STAFF_ROLE_LABEL: Record<ShelterStaffRole, string> = {
  ADMIN: 'Admin',
  MEMBER: 'Thành viên',
  VOLUNTEER: 'Tình nguyện viên',
  VETERINARIAN: 'Bác sĩ thú y',
};

export const STAFF_ROLE_COLOR: Record<ShelterStaffRole, string> = {
  ADMIN: 'purple',
  MEMBER: 'blue',
  VOLUNTEER: 'green',
  VETERINARIAN: 'pink',
};