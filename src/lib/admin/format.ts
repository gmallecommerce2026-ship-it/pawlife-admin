// src/lib/admin/format.ts
const TZ = "Asia/Ho_Chi_Minh";

export function fmtDate(d: Date | string | null | undefined, withTime = true): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

/** Chuỗi cho <input type="datetime-local"> theo giờ Việt Nam */
export function toLocalInput(d: Date | null | undefined): string {
  if (!d) return "";
  const shifted = new Date(d.getTime() + 7 * 3600_000);
  return shifted.toISOString().slice(0, 16);
}

/** Đọc giá trị datetime-local (giờ Việt Nam) thành Date */
export function fromLocalInput(v: string): Date | null {
  if (!v) return null;
  const d = new Date(`${v}:00+07:00`);
  return isNaN(d.getTime()) ? null : d;
}

export function maskEmail(email: string | null | undefined): string {
  if (!email) return "—";
  const [user, domain] = email.split("@");
  if (!domain) return "***";
  return `${user.slice(0, 2)}***@${domain}`;
}

export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "—";
  return `***${phone.slice(-3)}`;
}

/** Khoảng cách (mét) giữa hai tọa độ, dùng để cảnh báo trùng địa điểm */
export function distanceMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function parseInt0(v: string | undefined, fallback = 1): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}
