import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const { refreshToken } = await request.json();
    if (typeof refreshToken !== 'string' || !refreshToken) {
      return NextResponse.json({ error: 'A refresh token is required.' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    if (!supabase) return NextResponse.json({ error: 'Configure Supabase Auth first.' }, { status: 503 });
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
    if (error || !data.session) {
      return NextResponse.json({ error: error?.message || 'Your session has expired. Please sign in again.' }, { status: 401 });
    }

    return NextResponse.json({
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at
      }
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to refresh session.' }, { status: 400 });
  }
}
