import { createHmac, timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';

const SESSION_COOKIE = 'jobhunter_session';
const SESSION_SECONDS = 60 * 60 * 24 * 7;

export async function POST(request: Request) {
  const expectedPassword = process.env.APP_ACCESS_PASSWORD;
  const secret = process.env.APP_SESSION_SECRET;
  if (!expectedPassword || !secret || secret.length < 32) {
    return NextResponse.json({ success: false, error: 'App access is not configured yet.' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const password = typeof body.password === 'string' ? body.password : '';
    const supplied = Buffer.from(password);
    const expected = Buffer.from(expectedPassword);
    const matches = supplied.length === expected.length && timingSafeEqual(supplied, expected);
    if (!matches) return NextResponse.json({ success: false, error: 'That password is incorrect.' }, { status: 401 });

    const expiresAt = String(Math.floor(Date.now() / 1000) + SESSION_SECONDS);
    const signature = createHmac('sha256', secret).update(expiresAt).digest('base64url');
    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE, `${expiresAt}.${signature}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_SECONDS
    });
    return response;
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to sign in.' }, { status: 400 });
  }
}
