import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return NextResponse.json({ error: 'Configure Supabase Auth first.' }, { status: 503 });
    const { email, password } = await request.json();
    if (typeof email !== 'string' || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'Enter a valid email and a password with at least 8 characters.' }, { status: 400 });
    }
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: new URL('/auth/callback', request.url).toString() }
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, needsConfirmation: !data.session });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to create account.' }, { status: 400 });
  }
}
