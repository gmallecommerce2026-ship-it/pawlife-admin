// src/actions/logout.ts
'use server'

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function logout() {
  // SỬA: Thêm await vào trước cookies() để lấy cookieStore
  const cookieStore = await cookies(); 

  // Xóa các cookie xác thực
  // Lưu ý: cookieStore.delete() không cần await, nhưng cookies() thì có
  cookieStore.delete("session");
  cookieStore.delete("authjs.session-token");
  cookieStore.delete("__Secure-authjs.session-token");
  cookieStore.delete("next-auth.session-token");
  cookieStore.delete("__Secure-next-auth.session-token");

  // Chuyển hướng về trang login
  redirect("/login");
}