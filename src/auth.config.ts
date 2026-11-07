// src/auth.config.ts
import type { NextAuthConfig } from "next-auth";
import { MOCK } from "@/lib/mock/config";
import {
  publicRoutes,
  authRoutes,
  apiAuthPrefix,
  shelterRoutesPrefix,
  adminRoutesPrefix,
  DEFAULT_LOGIN_REDIRECT,
} from "@/routes";

export const authConfig = {
  providers: [],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      // FE mock: không chặn route ở middleware, việc kiểm tra quyền làm trong layout/guard
      if (MOCK) return true;

      const isLoggedIn = !!auth?.user;
      const userRole = auth?.user?.role;
      const pathname = nextUrl.pathname;

      // 1. Cho phép tất cả API Auth
      if (pathname.startsWith(apiAuthPrefix)) return true;

      // 2. Trang Auth (Login/Register)
      if (authRoutes.includes(pathname)) {
        if (isLoggedIn) {
          return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
        }
        return true;
      }

      // 3. Khu admin: chỉ role ADMIN. Quyền chi tiết kiểm tra ở lib/admin/guard.ts
      if (pathname.startsWith(adminRoutesPrefix)) {
        return isLoggedIn && userRole === "ADMIN";
      }

      // 4. Route Shelter: SHELTER_ADMIN và ADMIN (ADMIN là cấp cao nhất, vào thẳng dashboard shelter)
      if (pathname.startsWith(shelterRoutesPrefix)) {
        return isLoggedIn && (userRole === "SHELTER_ADMIN" || userRole === "ADMIN");
      }

      // 5. Các route public
      const isPublic = publicRoutes.some((route) =>
        route === "/" ? pathname === "/" : pathname.startsWith(route)
      );
      if (isPublic) return true;

      // 6. Mặc định: yêu cầu đăng nhập
      return isLoggedIn;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = (user as any).role;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = token.role as any;
        session.user.name = token.name;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
