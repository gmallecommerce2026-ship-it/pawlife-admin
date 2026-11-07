// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const hostname = req.headers.get('host') || ''; 
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('accessToken')?.value;

  // BỎ QUA các request gọi vào API để không ảnh hưởng Mobile App
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // 1. Logic cho ADMIN Domain (admin.lovegifts.vn)
  if (hostname.startsWith('admin.')) {
    if (!token && !pathname.startsWith('/auth')) {
      return NextResponse.redirect(new URL('/auth/admin-login', req.url));
    }
    return NextResponse.rewrite(new URL(`/admin${pathname}`, req.url));
  }

  // 2. Logic cho SELLER Domain (seller.lovegifts.vn)
  if (hostname.startsWith('seller.')) {
    if (!token && !pathname.startsWith('/auth')) {
      return NextResponse.redirect(new URL('/auth/seller-login', req.url));
    }
    return NextResponse.rewrite(new URL(`/seller${pathname}`, req.url));
  }

  // 3. Logic cho User thường (www.lovegifts.vn)
  const protectedPaths = ['/profile', '/shelter/dashboard']; // Thêm các route cần bảo vệ
  if (protectedPaths.some(path => pathname.startsWith(path))) {
    if (!token) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Loại trừ các file tĩnh, hình ảnh và API routes
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/mock|images).*)'],
};