import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return NextResponse.json({ error: 'Configure Supabase Auth first.' }, { status: 503 });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return NextResponse.json({ error: 'Sign in to Jobhunter first.' }, { status: 401 });

    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) return NextResponse.json({ error: 'Your Jobhunter session could not be read. Please sign in again.' }, { status: 401 });

    return NextResponse.json({
      session: {
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresAt: session.expires_at
      }
    }, { headers: { 'Cache-Control': 'no-store, private' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to connect extension.' }, { status: 500 });
  }
}
