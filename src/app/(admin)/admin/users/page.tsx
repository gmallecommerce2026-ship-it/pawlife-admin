// Người dùng: tìm theo ID, email hoặc số điện thoại. Email và SĐT được che một phần. Không hiển thị mật khẩu/OTP/2FA.
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/admin/guard";
import { hasPermission } from "@/lib/admin/permissions";
import { fmtDate, maskEmail, maskPhone } from "@/lib/admin/format";
import { PageHeader, Badge, DataTable, EmptyState, inputCls, btnVariant } from "@/components/admin/ui";
import ActionForm from "@/components/admin/ActionForm";
import { lockUser, unlockUser } from "@/actions/admin/users";

export default async function UsersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const ctx = await requirePermission("users.read");
  const canLock = hasPermission(ctx.roles, "users.lock");
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();

  const rows = await db.user.findMany({
    where: q
      ? {
          OR: [
            { id: q },
            { userName: { contains: q } },
            { phoneNumber: { contains: q } },
          ],
        }
      : {},
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true, userName: true, fullName: true, phoneNumber: true, role: true,
      createdAt: true, lastActiveAt: true, lockedUntil: true, lockedPermanently: true, lockReason: true,
    },
  });

  const now = new Date();

  return (
    <>
      <PageHeader title="Người dùng" description="Tìm theo ID, email hoặc số điện thoại" />

      <form className="mb-5 flex gap-2">
        <input name="q" defaultValue={q} placeholder="ID, email hoặc số điện thoại" className={`${inputCls} max-w-md`} />
        <button className={btnVariant.primary}>Tìm</button>
      </form>

      {rows.length === 0 ? (
        <EmptyState text="Không tìm thấy người dùng" />
      ) : (
        <DataTable head={["ID", "Họ tên", "Email", "SĐT", "Vai trò", "Trạng thái", "Hoạt động gần nhất", "Thao tác"]}>
          {rows.map((u) => {
            const locked = u.lockedPermanently || (u.lockedUntil && u.lockedUntil > now);
            return (
              <tr key={u.id} className="align-top hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{u.id.slice(0, 10)}…</td>
                <td className="px-4 py-3 font-semibold">{u.fullName ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600">{maskEmail(u.userName)}</td>
                <td className="px-4 py-3 text-gray-600">{maskPhone(u.phoneNumber)}</td>
                <td className="px-4 py-3"><Badge>{u.role}</Badge></td>
                <td className="px-4 py-3">
                  {u.lockedPermanently ? <Badge tone="red">Khóa vĩnh viễn</Badge> : locked ? <Badge tone="yellow">Khóa đến {fmtDate(u.lockedUntil)}</Badge> : <Badge tone="green">Hoạt động</Badge>}
                  {locked && u.lockReason && <p className="mt-1 max-w-xs text-xs text-gray-500">{u.lockReason}</p>}
                </td>
                <td className="px-4 py-3 text-gray-500">{fmtDate(u.lastActiveAt)}</td>
                <td className="px-4 py-3">
                  {canLock && u.id !== ctx.adminId && (
                    locked ? (
                      <ActionForm action={unlockUser} hidden={{ userId: u.id }} label="Mở khóa" variant="success" confirmMessage="Mở khóa tài khoản này?" className="w-64" />
                    ) : (
                      <ActionForm action={lockUser} hidden={{ userId: u.id }} label="Khóa tài khoản" variant="danger" confirmMessage="Khóa tài khoản này?" className="w-64" notePlaceholder="Lý do khóa (bắt buộc)">
                        <div className="grid grid-cols-2 gap-2">
                          <select name="mode" defaultValue="TEMP" className={inputCls}>
                            <option value="TEMP">Tạm thời</option>
                            <option value="PERMANENT">Vĩnh viễn</option>
                          </select>
                          <input name="days" type="number" min={1} max={365} defaultValue={7} className={inputCls} aria-label="Số ngày" />
                        </div>
                      </ActionForm>
                    )
                  )}
                </td>
              </tr>
            );
          })}
        </DataTable>
      )}
    </>
  );
}
