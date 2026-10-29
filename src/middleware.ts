import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_PUBLISHABLE_KEY?.trim();
  return url && key ? { url, key } : null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const config = getSupabaseConfig();

  if (!config) {
    if (process.env.NODE_ENV !== 'production') return NextResponse.next();
    if (pathname === '/setup-required') return NextResponse.next();
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, error: 'Supabase Auth is not configured.' }, { status: 503 });
    }
    return NextResponse.redirect(new URL('/setup-required', request.url));
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });

  const accessToken = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  const { data: { user } } = await supabase.auth.getUser(accessToken);
  const isAuthApi = pathname.startsWith('/api/auth/');
  const isPublic = pathname === '/login' || pathname === '/setup-required' || pathname === '/auth/callback' || isAuthApi;

  if (user && pathname === '/login') {
    const next = request.nextUrl.searchParams.get('next');
    const nextPath = next && next.startsWith('/') && !next.startsWith('//') && !next.includes('\\') ? next : '/';
    return NextResponse.redirect(new URL(nextPath, request.url));
  }
  if (!user && !isPublic) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, error: 'Sign in to continue.' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
};
