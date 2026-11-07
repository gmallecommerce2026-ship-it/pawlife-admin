// Khối thống kê riêng cho một cửa hàng ứng dụng
import { Card, Badge } from "./ui";
import TrendChart from "./TrendChart";
import type { StoreStats } from "@/lib/admin/appStats";

const pct = (v: number | null) => (v === null ? "—" : `${v}%`);

export default function StoreStatsPanel({
  title,
  platform,
  stats,
  color,
}: {
  title: string;
  platform: string;
  stats: StoreStats;
  color: string;
}) {
  const metrics: [string, string | number][] = [
    ["Lượt cài", stats.total],
    ["Tỉ lệ xóa app", `${stats.uninstallRate}%`],
    ["Đang online", stats.online],
    ["Hoạt động 24h", stats.dau],
  ];
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-bold text-[#1d150b]">{title}</h3>
        <Badge tone="gray">{platform}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {metrics.map(([label, value]) => (
          <div key={label} className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-[#1d150b]">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-gray-100 p-3">
          <p className="text-xs text-gray-500">Giữ chân ngày 1</p>
          <p className="mt-1 text-lg font-bold text-[#1d150b]">{pct(stats.d1)}</p>
        </div>
        <div className="rounded-xl border border-gray-100 p-3">
          <p className="text-xs text-gray-500">Giữ chân ngày 7</p>
          <p className="mt-1 text-lg font-bold text-[#1d150b]">{pct(stats.d7)}</p>
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Lượt cài mới (30 ngày)</p>
        <TrendChart data={stats.daily} series={[{ key: "installs", label: "Lượt cài", color }]} type="line" height={200} />
      </div>
      <p className="mt-3 text-xs text-gray-400">Giữ chân là ước tính dựa trên lần mở app gần nhất.</p>
    </Card>
  );
}
