// Tính thống kê cài đặt app cho từng cửa hàng (App Store = iOS, Google Play = Android)
export type InstallRow = { platform: string; installedAt: Date; lastSeenAt: Date; uninstalledAt: Date | null };
export type DailyPoint = { label: string; installs: number };
export type StoreStats = {
  total: number;
  uninstalled: number;
  uninstallRate: number;
  online: number;
  dau: number;
  d1: number | null;
  d7: number | null;
  daily: DailyPoint[];
};

const DAY = 86400_000;
const keyFmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" });
const labelFmt = new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit" });

export function computeStoreStats(rows: InstallRow[], now = Date.now()): StoreStats {
  const total = rows.length;
  const uninstalled = rows.filter((r) => r.uninstalledAt).length;
  const online = rows.filter((r) => !r.uninstalledAt && r.lastSeenAt.getTime() >= now - 5 * 60_000).length;
  const dau = rows.filter((r) => !r.uninstalledAt && r.lastSeenAt.getTime() >= now - DAY).length;

  // Giữ chân (ước tính): trong các thiết bị đã cài đủ N ngày, tỉ lệ còn mở app sau N ngày
  const retention = (n: number) => {
    const eligible = rows.filter((r) => r.installedAt.getTime() <= now - n * DAY);
    if (!eligible.length) return null;
    const kept = eligible.filter((r) => r.lastSeenAt.getTime() >= r.installedAt.getTime() + n * DAY).length;
    return Math.round((kept / eligible.length) * 1000) / 10;
  };

  const daily: DailyPoint[] = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now - (29 - i) * DAY);
    const key = keyFmt.format(d);
    return {
      label: labelFmt.format(d),
      installs: rows.filter((r) => keyFmt.format(r.installedAt) === key).length,
    };
  });

  return {
    total,
    uninstalled,
    uninstallRate: total ? Math.round((uninstalled / total) * 1000) / 10 : 0,
    online,
    dau,
    d1: retention(1),
    d7: retention(7),
    daily,
  };
}
