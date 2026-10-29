import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase-server';

function getSafeNextPath(value: string | null) {
  return value && value.startsWith('/') && !value.startsWith('//') && !value.includes('\\') ? value : '/';
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const provider = url.searchParams.get('provider');
  if (provider !== 'google' && provider !== 'github') return NextResponse.redirect(new URL('/login?error=provider', url));
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.redirect(new URL('/login?error=config', url));
  const nextPath = getSafeNextPath(url.searchParams.get('next'));
  const cookieStore = await cookies();
  cookieStore.set('jh_oauth_next', nextPath, {
    httpOnly: true,
    secure: url.protocol === 'https:',
    sameSite: 'lax',
    path: '/auth/callback',
    maxAge: 10 * 60
  });
  const redirectTo = new URL('/auth/callback', url);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: redirectTo.toString() }
  });
  if (error || !data.url) return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error?.message || 'oauth')}`, url));
  return NextResponse.redirect(data.url);
}
