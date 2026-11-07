import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/admin/guard";
import { hasPermission } from "@/lib/admin/permissions";
import { computeStoreStats } from "@/lib/admin/appStats";
import { fmtDate } from "@/lib/admin/format";
import { PageHeader, StatCard, Card, EmptyState } from "@/components/admin/ui";
import TrendChart from "@/components/admin/TrendChart";
import StoreStatsPanel from "@/components/admin/StoreStatsPanel";

const WEEK = 7 * 86400_000;
const WEEKS = 8;

export default async function DashboardPage() {
  const ctx = await requirePermission("dashboard");
  const canStats = hasPermission(ctx.roles, "stats.read");
  const now = new Date();
  const start = new Date(now.getTime() - WEEKS * WEEK);
  const soon = new Date(now.getTime() + 7 * 86400_000);

  const [pendingShelters, pendingProposals, openReports, upcoming, shelters, proposals, installs] = await Promise.all([
    db.shelter.count({ where: { status: "PENDING" } }),
    db.placeProposal.count({ where: { status: { in: ["PENDING", "NEEDS_INFO"] } } }),
    db.report.count({ where: { status: { in: ["NEW", "IN_PROGRESS"] } } }),
    db.event.findMany({
      where: { status: "PUBLISHED", startsAt: { gte: now, lte: soon } },
      orderBy: { startsAt: "asc" },
      take: 8,
      select: { id: true, titleVi: true, startsAt: true, area: true },
    }),
    db.shelter.findMany({ where: { createdAt: { gte: start } }, select: { createdAt: true } }),
    db.placeProposal.findMany({ where: { createdAt: { gte: start } }, select: { createdAt: true } }),
    canStats
      ? db.appInstall.findMany({ select: { platform: true, installedAt: true, lastSeenAt: true, uninstalledAt: true } })
      : Promise.resolve([]),
  ]);

  // Số shelter đăng ký và đề xuất địa điểm theo tuần (8 tuần gần nhất)
  const fmtDay = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", timeZone: "Asia/Ho_Chi_Minh" });
  const buckets = Array.from({ length: WEEKS }, (_, i) => ({
    label: fmtDay.format(new Date(start.getTime() + i * WEEK)),
    shelter: 0,
    proposal: 0,
  }));
  const bump = (list: { createdAt: Date }[], key: "shelter" | "proposal") => {
    for (const r of list) {
      const idx = Math.floor((r.createdAt.getTime() - start.getTime()) / WEEK);
      if (idx >= 0 && idx < WEEKS) buckets[idx][key]++;
    }
  };
  bump(shelters, "shelter");
  bump(proposals, "proposal");

  // Thống kê app tách theo cửa hàng: iOS = App Store, Android = Google Play
  const isIOS = (p: string) => p.toLowerCase() === "ios";
  const appStore = computeStoreStats(installs.filter((i) => isIOS(i.platform)));
  const googlePlay = computeStoreStats(installs.filter((i) => !isIOS(i.platform)));

  return (
    <>
      <PageHeader title="Tổng quan" description="Việc đang chờ xử lý và thống kê app" />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Shelter chờ duyệt" value={pendingShelters} href="/admin/shelters?tab=pending" />
        <StatCard label="Đề xuất địa điểm chờ duyệt" value={pendingProposals} href="/admin/place-proposals" />
        <StatCard label="Báo cáo chưa xử lý" value={openReports} href="/admin/reports" />
        <StatCard label="Sự kiện sắp diễn ra (7 ngày)" value={upcoming.length} href="/admin/events" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <h2 className="mb-4 font-bold text-[#1d150b]">Đăng ký theo tuần (8 tuần gần nhất)</h2>
          <TrendChart
            data={buckets}
            series={[
              { key: "shelter", label: "Shelter đăng ký", color: "#c49b63" },
              { key: "proposal", label: "Đề xuất địa điểm", color: "#1d150b" },
            ]}
          />
        </Card>

        <Card>
          <h2 className="mb-4 font-bold text-[#1d150b]">Sự kiện sắp diễn ra</h2>
          {upcoming.length === 0 ? (
            <EmptyState text="Không có sự kiện nào trong 7 ngày tới" />
          ) : (
            <ul className="divide-y divide-gray-100">
              {upcoming.map((e) => (
                <li key={e.id} className="py-3">
                  <Link href={`/admin/events/${e.id}`} className="text-sm font-semibold text-gray-800 hover:text-[#c49b63]">
                    {e.titleVi}
                  </Link>
                  <p className="text-xs text-gray-500">{fmtDate(e.startsAt)} · {e.area}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {canStats && (
        <section className="mt-8">
          <h2 className="mb-4 text-xl font-bold text-[#1d150b]">Thống kê app</h2>
          <div className="grid gap-6 xl:grid-cols-2">
            <StoreStatsPanel title="App Store" platform="iOS" stats={appStore} color="#0D062D" />
            <StoreStatsPanel title="Google Play" platform="Android" stats={googlePlay} color="#34A853" />
          </div>
        </section>
      )}
    </>
  );
}
