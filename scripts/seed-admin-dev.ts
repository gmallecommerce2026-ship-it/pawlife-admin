// Tạo tài khoản quản trị cao nhất để đăng nhập khi phát triển (CHỈ dùng môi trường dev)
// Chạy: npm run seed:admin
// Mặc định: admin@pawly.local / Admin@2026  (ghi đè bằng ADMIN_EMAIL, ADMIN_PASSWORD trong .env)
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("Không chạy seed admin trên production");

  const email = process.env.ADMIN_EMAIL || "admin@pawly.local";
  const password = process.env.ADMIN_PASSWORD || "Admin@2026";
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await db.user.upsert({
    where: { userName: email },
    update: { passwordHash, role: "ADMIN", lockedPermanently: false, lockedUntil: null },
    create: { userName: email, passwordHash, role: "ADMIN", fullName: "Quản trị viên" },
  });

  await db.adminRoleAssignment.upsert({
    where: { userId_role: { userId: user.id, role: "SUPER_ADMIN" } },
    update: {},
    create: { userId: user.id, role: "SUPER_ADMIN" },
  });

  console.log(`Tài khoản admin sẵn sàng: ${email} / ${password}`);
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
