// Quản lý quản trị viên: chỉ quyền cao nhất. Mỗi admin có một hoặc nhiều vai trò.
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/admin/guard";
import { fmtDate, maskEmail } from "@/lib/admin/format";
import { ALL_ROLES, ROLE_LABELS } from "@/lib/admin/permissions";
import { PageHeader, Card, Badge, DataTable, EmptyState, inputCls, labelCls } from "@/components/admin/ui";
import ActionForm from "@/components/admin/ActionForm";
import { grantRole, revokeRole, disableAdmin } from "@/actions/admin/admins";

export default async function AdminsPage() {
  const ctx = await requirePermission("admins.manage");
  const admins = await db.user.findMany({
    where: { OR: [{ role: "ADMIN" }, { adminRoles: { some: {} } }] },
    include: { adminRoles: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <>
      <PageHeader title="Quản trị viên" description="Chỉ quyền cao nhất mới thêm, sửa hoặc tắt tài khoản admin." />

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <h2 className="mb-4 font-bold text-[#1d150b]">Danh sách</h2>
          {admins.length === 0 ? (
            <EmptyState text="Chưa có quản trị viên" />
          ) : (
            <DataTable head={["Tài khoản", "Vai trò", "Thêm lúc", "Thao tác"]}>
              {admins.map((a) => (
                <tr key={a.id} className="align-top">
                  <td className="px-4 py-3">
                    <p className="font-semibold">{a.fullName ?? "—"}</p>
                    <p className="text-xs text-gray-500">{maskEmail(a.userName)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {a.adminRoles.length === 0 && <Badge>Chưa có vai trò</Badge>}
                      {a.adminRoles.map((r) => (
                        <span key={r.id} className="inline-flex items-center gap-1">
                          <Badge tone="purple">{ROLE_LABELS[r.role]}</Badge>
                          <ActionForm action={revokeRole} hidden={{ assignmentId: r.id }} label="×" variant="ghost" confirmMessage={`Gỡ vai trò ${ROLE_LABELS[r.role]}?`} className="inline w-auto">
                            {/* chỉ nút gỡ */}
                          </ActionForm>
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{fmtDate(a.createdAt, false)}</td>
                  <td className="px-4 py-3">
                    {a.id !== ctx.adminId && (
                      <ActionForm action={disableAdmin} hidden={{ userId: a.id }} label="Tắt tài khoản admin" variant="danger" confirmMessage="Tắt tài khoản admin này? Người dùng sẽ về vai trò khách hàng." />
                    )}
                  </td>
                </tr>
              ))}
            </DataTable>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 font-bold text-[#1d150b]">Cấp vai trò</h2>
          <ActionForm action={grantRole} label="Cấp vai trò" notePlaceholder="Lý do cấp quyền (bắt buộc)">
            <div>
              <span className={labelCls}>Email tài khoản</span>
              <input name="email" type="email" required className={inputCls} />
            </div>
            <div>
              <span className={labelCls}>Vai trò</span>
              <select name="role" className={inputCls} defaultValue="SUPPORT">
                {ALL_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </div>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
