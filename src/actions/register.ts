// src/actions/register.ts
"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { RegisterSchema } from "@/schemas";
// Nếu cần type Role, bạn có thể import từ @prisma/client, nhưng dùng string "CUSTOMER" cũng được nếu Prisma đã generate type.

export const register = async (values: z.infer<typeof RegisterSchema>) => {
  const validatedFields = RegisterSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Dữ liệu không hợp lệ!" };
  }

  const { email, password, name } = validatedFields.data;
  const hashedPassword = await bcrypt.hash(password, 10);

  // SỬA LỖI 1: Tìm theo userName (vì schema dùng userName để lưu email)
  const existingUser = await db.user.findUnique({ 
    where: { userName: email } 
  });

  if (existingUser) return { error: "Email đã tồn tại!" };

  // SỬA LỖI 2: Map đúng tên trường trong schema.prisma
  await db.user.create({
    data: {
      fullName: name,              // Map 'name' từ form -> 'fullName' trong DB
      userName: email,             // Map 'email' từ form -> 'userName' trong DB
      passwordHash: hashedPassword,// Map 'password' -> 'passwordHash'
      role: "CUSTOMER",            // Sửa "USER" -> "CUSTOMER" cho đúng Enum trong schema
    },
  });

  return { success: "Đăng ký thành công! Vui lòng đăng nhập." };
};