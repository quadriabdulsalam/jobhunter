import { NextRequest, NextResponse } from 'next/server';

const encoder = new TextEncoder();
const SESSION_COOKIE = 'jobhunter_session';

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function isValidSession(token: string | undefined, secret: string): Promise<boolean> {
  if (!token) return false;
  const [expiresAt, signature] = token.split('.');
  const expiry = Number(expiresAt);
  if (!Number.isFinite(expiry) || expiry <= Math.floor(Date.now() / 1000) || !signature) return false;

  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  const normalized = signature.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
  const signatureBytes = Uint8Array.from(atob(padded), char => char.charCodeAt(0));
  return crypto.subtle.verify('HMAC', key, signatureBytes, encoder.encode(expiresAt));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith('/api/');
  const isLoginRoute = pathname === '/login' || pathname === '/api/auth/login' || pathname === '/api/auth/logout';
  const password = process.env.APP_ACCESS_PASSWORD;
  const secret = process.env.APP_SESSION_SECRET;

  if (process.env.NODE_ENV !== 'production' && (!password || !secret)) return NextResponse.next();

  if (!password || !secret || secret.length < 32) {
    if (pathname === '/setup-required') return NextResponse.next();
    if (isApi) return NextResponse.json({ success: false, error: 'Set APP_ACCESS_PASSWORD and APP_SESSION_SECRET before using the app.' }, { status: 503 });
    return NextResponse.redirect(new URL('/setup-required', request.url));
  }

  const authorized = await isValidSession(request.cookies.get(SESSION_COOKIE)?.value, secret);
  if (isLoginRoute) {
    if (authorized && pathname === '/login') return NextResponse.redirect(new URL('/', request.url));
    return NextResponse.next();
  }
  if (authorized) return NextResponse.next();
  if (isApi) return NextResponse.json({ success: false, error: 'Sign in to continue.' }, { status: 401 });

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('next', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
};
