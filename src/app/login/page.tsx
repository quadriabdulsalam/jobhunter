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

  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('error')) {
      setProviderMessage('That sign-in option is not ready yet. Use email for now, or enable the provider in Supabase.');
    }
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setMessage(''); setBusy(true);
    try {
      const response = await fetch(`/api/auth/${mode === 'login' ? 'login' : 'signup'}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to continue.');
      if (data.needsConfirmation) setMessage('Check your email to confirm your account, then come back to sign in.');
      else router.replace('/');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to continue.'); }
    finally { setBusy(false); }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#f9f9f8', color: '#111' }}>
      <section style={{ width: '100%', maxWidth: 360, display: 'grid', gap: 18 }}>
        <div><p style={{ color: '#777', fontSize: 13, marginBottom: 8 }}>Jobhunter</p><h1 style={{ fontSize: 27, fontWeight: 600, letterSpacing: '-.03em' }}>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1><p style={{ color: '#6b6b6b', fontSize: 14, marginTop: 8 }}>Your career workspace, kept private to you.</p></div>
        <a href="/api/auth/oauth?provider=google" style={socialStyle}>Continue with Google</a>
        <a href="/api/auth/oauth?provider=github" style={socialStyle}>Continue with GitHub</a>
        {providerMessage && <p role="status" style={{ color: '#6b6b6b', fontSize: 13, textAlign: 'center' }}>{providerMessage}</p>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#888', fontSize: 12 }}><span style={{ height: 1, background: '#e2e2df', flex: 1 }} />or continue with email<span style={{ height: 1, background: '#e2e2df', flex: 1 }} /></div>
        <form onSubmit={submit} style={{ display: 'grid', gap: 13 }}>
          <label style={labelStyle}>Email<input autoComplete="email" required type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} /></label>
          <label style={labelStyle}>Password<input autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={8} type="password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} /></label>
          {error && <p role="alert" style={{ color: '#b42318', fontSize: 13 }}>{error}</p>}{message && <p role="status" style={{ color: '#426b50', fontSize: 13 }}>{message}</p>}
          <button disabled={busy} style={{ height: 44, border: 0, borderRadius: 8, background: '#111', color: 'white', fontWeight: 600, cursor: 'pointer' }}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
        </form>
        <p style={{ color: '#6b6b6b', textAlign: 'center', fontSize: 13 }}>{mode === 'login' ? 'New here?' : 'Already have an account?'} <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setMessage(''); }} style={{ border: 0, padding: 0, background: 'none', color: '#111', textDecoration: 'underline', cursor: 'pointer' }}>{mode === 'login' ? 'Create an account' : 'Sign in'}</button></p>
      </section>
    </main>
  );
}

const socialStyle = { display: 'grid', placeItems: 'center', height: 44, border: '1px solid #d8d8d5', borderRadius: 8, background: 'white', color: '#111', fontSize: 14, textDecoration: 'none' } as const;
const labelStyle = { display: 'grid', gap: 7, fontSize: 13 } as const;
const inputStyle = { height: 44, border: '1px solid #d8d8d5', borderRadius: 8, padding: '0 12px', background: 'white', color: '#111' } as const;
