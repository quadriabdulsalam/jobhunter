import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const provider = url.searchParams.get('provider');
  if (provider !== 'google' && provider !== 'github') return NextResponse.redirect(new URL('/login?error=provider', url));
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.redirect(new URL('/login?error=config', url));
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: new URL('/auth/callback', url).toString() }
  });
  if (error || !data.url) return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error?.message || 'oauth')}`, url));
  return NextResponse.redirect(data.url);
}
