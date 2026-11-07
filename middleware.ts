import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Export default middleware từ NextAuth
export default NextAuth(authConfig).auth;

export const config = {
  // Matcher để bỏ qua các file tĩnh, ảnh...
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};