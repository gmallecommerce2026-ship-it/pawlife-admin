// Cấp quyền QUẢN TRỊ CAO NHẤT cho một tài khoản (dùng để tạo admin đầu tiên)
// Chạy: npm run admin:grant -- email@domain.com
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) throw new Error("Thiếu email. Ví dụ: npm run admin:grant -- you@example.com");

  const user = await db.user.findFirst({ where: { userName: email } });
  if (!user) throw new Error(`Không tìm thấy tài khoản: ${email}. Hãy đăng ký trước.`);

  await db.$transaction([
    db.user.update({ where: { id: user.id }, data: { role: "ADMIN" } }),
    db.adminRoleAssignment.upsert({
      where: { userId_role: { userId: user.id, role: "SUPER_ADMIN" } },
      update: {},
      create: { userId: user.id, role: "SUPER_ADMIN" },
    }),
  ]);
  console.log(`Đã cấp quyền quản trị cao nhất cho ${email}`);
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
