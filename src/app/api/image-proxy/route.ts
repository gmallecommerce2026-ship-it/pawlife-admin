import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_HOSTS = ['pub-35c6d59c9e96467b9783df2a4e890a09.r2.dev'];

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('url');
  if (!raw) return new NextResponse('Missing url', { status: 400 });

  let u: URL;
  try { u = new URL(raw); } catch { return new NextResponse('Bad url', { status: 400 }); }
  if (u.protocol !== 'https:' || !ALLOWED_HOSTS.includes(u.hostname)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const upstream = await fetch(u.toString());
  if (!upstream.ok) return new NextResponse('Upstream error', { status: 502 });

  return new NextResponse(upstream.body, {
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? 'image/jpeg',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}