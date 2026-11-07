// src/lib/admin/support.ts
// Phiên "hỗ trợ shelter": admin tạm thời vào dashboard của shelter. Lưu trong cookie, tự hết hạn.
export const SUPPORT_COOKIE = "admin_support";
export const SUPPORT_MINUTES = 30;

export type SupportSession = {
  shelterId: string;
  shelterName: string;
  adminId: string;
  startedAt: number;
  expiresAt: number;
  write: boolean;
};

export function parseSupport(raw: string | undefined): SupportSession | null {
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as SupportSession;
    if (!s.shelterId || !s.expiresAt || s.expiresAt <= Date.now()) return null;
    return s;
  } catch {
    return null;
  }
}
