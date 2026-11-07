"use server";

import * as z from "zod";
import { signIn } from "@/auth";
import { LoginSchema } from "@/schemas";
import { AuthError } from "next-auth";
import { db } from "@/lib/db";
import { 
  DEFAULT_LOGIN_REDIRECT, 
  DEFAULT_ADMIN_REDIRECT, 
  DEFAULT_STAFF_REDIRECT 
} from "@/routes";
import { revalidatePath } from "next/cache";

export const login = async (values: z.infer<typeof LoginSchema>, callbackUrl?: string | null) => {
  console.log("🟣 [SERVER] Action login được gọi. Values:", values); // DEBUG

  const validatedFields = LoginSchema.safeParse(values);
  if (!validatedFields.success) {
    console.log("🔴 [SERVER] Validate thất bại");
    return { error: "Dữ liệu không hợp lệ!" };
  }

  const { email, password } = validatedFields.data;

  // 1. Kiểm tra User
  const existingUser = await db.user.findUnique({
    where: { userName: email } 
  });

  if (!existingUser || !existingUser.passwordHash) {
    console.log("🔴 [SERVER] User không tồn tại hoặc thiếu pass hash");
    return { error: "Email không tồn tại!" };
  }

  // 2. Xác định Role & Redirect
  let redirectTo = callbackUrl;
  if (!redirectTo) {
    switch (existingUser.role) {
      case "ADMIN": redirectTo = DEFAULT_ADMIN_REDIRECT; break;
      case "STAFF": redirectTo = DEFAULT_STAFF_REDIRECT; break;
      default: redirectTo = DEFAULT_LOGIN_REDIRECT;
    }
  }
  console.log("🟣 [SERVER] Role:", existingUser.role, "-> RedirectTo:", redirectTo); // DEBUG

  try {
    revalidatePath("/", "layout"); 

    console.log("🟣 [SERVER] Bắt đầu gọi signIn với redirect: false"); // DEBUG
    
    // AuthJS v5: signIn trả về promise, nếu redirect:false thì nó KHÔNG throw redirect error (lý thuyết)
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false, 
    });
    
    // Nếu code chạy đến đây nghĩa là signIn không throw error
    console.log("🟣 [SERVER] signIn hoàn tất. Kết quả (nếu có):", result); // DEBUG

  } catch (error) {
    console.log("🔴 [SERVER] Catch Error:", error); // DEBUG QUAN TRỌNG

    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Sai email hoặc mật khẩu!" };
        default:
          return { error: "Lỗi đăng nhập hệ thống!" };
      }
    }
    // Nếu lỗi không phải AuthError, throw tiếp để Nextjs xử lý (hoặc return error server)
    throw error; 
  }
  
  console.log("🟢 [SERVER] Return Success Object"); // DEBUG
  return { success: true, redirectTo };
};