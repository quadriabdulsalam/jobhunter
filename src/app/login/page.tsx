'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [providerMessage, setProviderMessage] = useState('');
  const [nextPath, setNextPath] = useState('/');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedNext = params.get('next');
    if (requestedNext?.startsWith('/') && !requestedNext.startsWith('//') && !requestedNext.includes('\\')) setNextPath(requestedNext);
    if (params.get('mode') === 'signup') setMode('signup');
    const authError = params.get('error');
    if (authError === 'config') setProviderMessage('Sign-in is not configured yet. Please try again later.');
    else if (authError === 'provider' || authError?.toLowerCase().includes('unsupported provider')) {
      setProviderMessage('Google and GitHub sign-in are not enabled yet. Add each provider’s OAuth credentials in Supabase Auth settings to use them.');
    } else if (authError) setProviderMessage('That sign-in could not be completed. Please try again or use email.');
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setMessage(''); setBusy(true);
    try {
      const response = await fetch(`/api/auth/${mode === 'login' ? 'login' : 'signup'}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) {
        const detail = String(data.error || '');
        if (detail.toLowerCase().includes('email rate limit exceeded')) {
          throw new Error('Supabase has temporarily limited confirmation emails. Wait before retrying, or configure a custom SMTP provider in Supabase Auth settings.');
        }
        throw new Error(detail || 'Unable to continue.');
      }
      if (data.needsConfirmation) {
        setError('Email confirmation is still enabled for this app. Disable “Confirm email” in Supabase Dashboard → Authentication → Sign In / Providers to create accounts and sign users in immediately.');
      } else {
        router.replace(nextPath);
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to continue.'); }
    finally { setBusy(false); }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-intro"><p className="auth-brand">Jobhunter</p><h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1><p className="auth-description">Your career workspace, kept private to you.</p></div>
        <a className="auth-social-link" href={`/api/auth/oauth?provider=google&next=${encodeURIComponent(nextPath)}`}>Continue with Google</a>
        <a className="auth-social-link" href={`/api/auth/oauth?provider=github&next=${encodeURIComponent(nextPath)}`}>Continue with GitHub</a>
        {providerMessage && <p role="status" style={{ color: '#6b6b6b', fontSize: 13, textAlign: 'center' }}>{providerMessage}</p>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#888', fontSize: 12 }}><span style={{ height: 1, background: '#e2e2df', flex: 1 }} />or continue with email<span style={{ height: 1, background: '#e2e2df', flex: 1 }} /></div>
        <form onSubmit={submit} style={{ display: 'grid', gap: 13 }}>
          <label style={labelStyle}>Email<input autoComplete="email" required type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} /></label>
          <label style={labelStyle}>Password<input autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={8} type="password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} /></label>
          {error && <p role="alert" style={{ color: '#b42318', fontSize: 13 }}>{error}</p>}{message && <p role="status" style={{ color: '#426b50', fontSize: 13 }}>{message}</p>}
          <button className="btn-primary" disabled={busy} aria-busy={busy} style={{ width: '100%' }}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
        </form>
        <p style={{ color: '#6b6b6b', textAlign: 'center', fontSize: 13 }}>{mode === 'login' ? 'New here?' : 'Already have an account?'} <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setMessage(''); }} style={{ minHeight: 44, border: 0, padding: '0 4px', background: 'none', color: '#9a3412', textDecoration: 'underline', cursor: 'pointer' }}>{mode === 'login' ? 'Create an account' : 'Sign in'}</button></p>
      </section>
    </main>
  );
}

const labelStyle = { display: 'grid', gap: 7, fontSize: 13 } as const;
const inputStyle = { height: 44, border: '1px solid #d8d8d5', borderRadius: 8, padding: '0 12px', background: 'white', color: '#111' } as const;
