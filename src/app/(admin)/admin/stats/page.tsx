// Thống kê app: cài đặt lần đầu, tỉ lệ xóa app, người dùng đang online, tỉ lệ giữ chân.
// Dữ liệu lấy từ bảng AppInstall, được cập nhật bởi API của app (installedAt, lastSeenAt, uninstalledAt).
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/admin/guard";
import { PageHeader, StatCard, Card, Notice } from "@/components/admin/ui";
import TrendChart from "@/components/admin/TrendChart";

const DAY = 86400_000;

export default async function StatsPage() {
  await requirePermission("stats.read");
  const now = Date.now();
  const since30 = new Date(now - 30 * DAY);
  const since60 = new Date(now - 60 * DAY);

  const [total, uninstalled, liveNow, dau, recent, cohort] = await Promise.all([
    db.appInstall.count(),
    db.appInstall.count({ where: { uninstalledAt: { not: null } } }),
    db.appInstall.count({ where: { lastSeenAt: { gte: new Date(now - 5 * 60_000) }, uninstalledAt: null } }),
    db.appInstall.count({ where: { lastSeenAt: { gte: new Date(now - DAY) }, uninstalledAt: null } }),
    db.appInstall.findMany({ where: { installedAt: { gte: since30 } }, select: { installedAt: true } }),
    db.appInstall.findMany({ where: { installedAt: { gte: since60 } }, select: { installedAt: true, lastSeenAt: true } }),
  ]);

  // Lượt cài lần đầu theo ngày (30 ngày)
  const fmt = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", timeZone: "Asia/Ho_Chi_Minh" });
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now - (29 - i) * DAY);
    return { key: fmt.format(d), label: fmt.format(d), installs: 0 };
  });
  for (const r of recent) {
    const key = fmt.format(r.installedAt);
    const d = days.find((x) => x.key === key);
    if (d) d.installs++;
  }

  // Giữ chân D1 / D7 (ước tính): trong các thiết bị đã cài đủ N ngày, tỉ lệ còn mở app sau N ngày
  const retention = (n: number) => {
    const eligible = cohort.filter((c) => c.installedAt.getTime() <= now - n * DAY);
    if (!eligible.length) return null;
    const kept = eligible.filter((c) => c.lastSeenAt.getTime() >= c.installedAt.getTime() + n * DAY).length;
    return Math.round((kept / eligible.length) * 1000) / 10;
  };

  const uninstallRate = total ? Math.round((uninstalled / total) * 1000) / 10 : 0;
  const fmtPct = (v: number | null) => (v === null ? "—" : `${v}%`);

  return (
    <>
      <PageHeader title="Thống kê app" description="Lượt cài, người dùng đang sử dụng và tỉ lệ giữ chân" />

      {total === 0 && (
        <Notice tone="yellow">Chưa có dữ liệu cài đặt. App cần gọi API ghi nhận lượt cài (installedAt), nhịp hoạt động (lastSeenAt) và gỡ cài (uninstalledAt).</Notice>
      )}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Tổng lượt cài" value={total} hint="Lần đầu tải app" />
        <StatCard label="Tỉ lệ xóa app" value={`${uninstallRate}%`} hint={`${uninstalled} thiết bị đã gỡ`} />
        <StatCard label="Đang online" value={liveNow} hint="Hoạt động trong 5 phút qua" />
        <StatCard label="Hoạt động 24h" value={dau} hint="Thiết bị hoạt động trong ngày" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <h2 className="mb-4 font-bold text-[#1d150b]">Lượt cài mới (30 ngày)</h2>
          <TrendChart data={days} series={[{ key: "installs", label: "Lượt cài", color: "#c49b63" }]} type="line" />
        </Card>
        <Card>
          <h2 className="mb-4 font-bold text-[#1d150b]">Tỉ lệ giữ chân</h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Ngày 1 (D1)</p>
              <p className="text-3xl font-bold text-[#1d150b]">{fmtPct(retention(1))}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Ngày 7 (D7)</p>
              <p className="text-3xl font-bold text-[#1d150b]">{fmtPct(retention(7))}</p>
            </div>
            <p className="text-xs text-gray-400">Ước tính: thiết bị còn mở app sau N ngày kể từ khi cài, dựa trên lastSeenAt. Tính trên 60 ngày gần nhất.</p>
          </div>
        </Card>
      </div>
    </>
  );
}
