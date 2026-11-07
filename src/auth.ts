// src/auth.ts
import NextAuth from "next-auth";
import { db } from "@/lib/db";
import { authConfig } from "@/auth.config";
import Credentials from "next-auth/providers/credentials";
import { LoginSchema } from "@/schemas";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const validatedFields = LoginSchema.safeParse(credentials);
        if (!validatedFields.success) return null;

        const { email, password } = validatedFields.data;
        const user = await db.user.findFirst({ where: { userName: email } });

        if (!user || !user.passwordHash) return null;

        // Tài khoản bị khóa (tạm thời hoặc vĩnh viễn) không được đăng nhập
        const now = new Date();
        if (user.lockedPermanently) return null;
        if (user.lockedUntil && user.lockedUntil > now) return null;

        const passwordsMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordsMatch) return null;

        return {
          id: user.id.toString(),
          name: user.fullName,
          email: user.userName,
          role: user.role,
        };
      },
    }),
  ],
});
