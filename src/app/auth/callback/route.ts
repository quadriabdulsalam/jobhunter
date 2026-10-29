import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const cookieStore = await cookies();
  const next = cookieStore.get('jh_oauth_next')?.value || url.searchParams.get('next');
  const nextPath = next && next.startsWith('/') && !next.startsWith('//') && !next.includes('\\') ? next : '/';
  cookieStore.delete('jh_oauth_next');
  const code = url.searchParams.get('code');
  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase!.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(nextPath, url));
  }
  return NextResponse.redirect(new URL('/login?error=confirmation', url));
}
