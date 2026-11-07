"use server";
// Đăng nhập / đăng xuất demo cho FE mock (không gọi backend)
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { MOCK_COOKIE } from "@/lib/mock/config";

export async function mockLogin(_fd?: FormData) {
  const admin = await db.user.findFirst({ where: { userName: "admin@pawly.local" } });
  if (!admin) throw new Error("Thiếu dữ liệu demo");
  const jar = await cookies();
  jar.set(MOCK_COOKIE, admin.id, { httpOnly: true, sameSite: "lax", path: "/" });
  redirect("/admin/dashboard");
}

export async function mockLogout(_fd?: FormData) {
  const jar = await cookies();
  jar.delete(MOCK_COOKIE);
  redirect("/login");
}
