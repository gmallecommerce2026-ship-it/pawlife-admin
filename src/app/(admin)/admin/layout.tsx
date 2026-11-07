// Layout khu quản trị: khóa đúng khung màn hình (fixed inset-0), chỉ phần nội dung cuộn.
// Nhờ vậy không còn khoảng trống thừa do body/wrapper bên ngoài.
import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/guard";
import { hasPermission, ROLE_LABELS } from "@/lib/admin/permissions";
import { ADMIN_MENU } from "@/lib/admin/menu";
import { parseSupport, SUPPORT_COOKIE } from "@/lib/admin/support";
import Sidebar from "@/components/admin/Sidebar";
import SupportBanner from "@/components/admin/SupportBanner";
import { MOCK } from "@/lib/mock/config";
import { mockLogout } from "@/actions/mock-auth";
import { logout } from "@/actions/logout";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/login");

  const items = ADMIN_MENU.filter((i) => hasPermission(ctx.roles, i.permission));
  const jar = await cookies();
  const support = parseSupport(jar.get(SUPPORT_COOKIE)?.value);

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-white">
      <Sidebar
        items={items}
        name={ctx.name}
        roles={ctx.roles.map((r) => ROLE_LABELS[r])}
        logoutAction={MOCK ? mockLogout : logout}
      />

      <main className="relative min-w-0 flex-1 overflow-y-auto overscroll-contain bg-white">
        {support && <SupportBanner session={support} />}
        <div className="min-h-full p-4 pb-[calc(96px+env(safe-area-inset-bottom))] sm:p-6 md:pb-6 lg:p-6 lg:pl-5 lg:pt-5">
          <div className="min-h-full rounded-[28px] border border-[#E7E7EC] bg-white p-5 sm:p-7 lg:p-8">
            <div className="mx-auto max-w-[1400px]">{children}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
