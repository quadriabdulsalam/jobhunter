'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to sign in.');
      const destination = new URLSearchParams(window.location.search).get('next');
      router.replace(destination?.startsWith('/') && !destination.startsWith('//') ? destination : '/');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px', background: '#f9f9f8', color: '#111' }}>
      <form onSubmit={signIn} style={{ width: '100%', maxWidth: '360px', display: 'grid', gap: '16px' }}>
        <div>
          <p style={{ color: '#777', fontSize: '13px', marginBottom: '8px' }}>Jobhunter</p>
          <h1 style={{ fontSize: '26px', fontWeight: 600, letterSpacing: '-0.03em' }}>Welcome back</h1>
          <p style={{ color: '#6b6b6b', fontSize: '14px', marginTop: '8px' }}>Enter your app password to open your private workspace.</p>
        </div>
        <label style={{ display: 'grid', gap: '7px', fontSize: '13px' }}>
          App password
          <input autoFocus required type="password" value={password} onChange={event => setPassword(event.target.value)} style={{ height: '44px', border: '1px solid #d8d8d5', borderRadius: '8px', padding: '0 12px', background: 'white', color: '#111' }} />
        </label>
        {error && <p role="alert" style={{ color: '#b42318', fontSize: '13px' }}>{error}</p>}
        <button type="submit" disabled={isSubmitting} style={{ height: '44px', border: 0, borderRadius: '8px', background: '#111', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
          {isSubmitting ? 'Signing in…' : 'Continue'}
        </button>
      </form>
    </main>
  );
}
