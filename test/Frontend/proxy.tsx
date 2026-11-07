import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(req: NextRequest) {
  const hostname = req.headers.get('host') || ''; // ví dụ: seller.lovegifts.vn
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('token')?.value;

  // 1. Logic cho ADMIN Domain (admin.lovegifts.vn)
  if (hostname.startsWith('admin.')) {
    // Nếu chưa login -> đá về trang login của admin
    if (!token && !pathname.startsWith('/auth')) {
       return NextResponse.redirect(new URL('/auth/admin-login', req.url));
    }
    // Rewrite ngầm về thư mục /app/admin mà URL trình duyệt vẫn giữ nguyên
    return NextResponse.rewrite(new URL(`/admin${pathname}`, req.url));
  }

  // 2. Logic cho SELLER Domain (seller.lovegifts.vn)
  if (hostname.startsWith('seller.')) {
     if (!token && !pathname.startsWith('/auth')) {
       return NextResponse.redirect(new URL('/auth/seller-login', req.url));
    }
     // Rewrite ngầm về thư mục /app/seller
     return NextResponse.rewrite(new URL(`/seller${pathname}`, req.url));
  }

  // 3. Logic cho User thường (www.lovegifts.vn)
  // Bảo vệ các route cần login như /cart, /profile
  const protectedPaths = ['/cart', '/profile', '/checkout'];
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
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};