'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Briefcase, FileText, Linkedin, ShieldCheck } from 'lucide-react';

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
      setProviderMessage('LinkedIn sign-in is not enabled yet. Check the LinkedIn (OIDC) provider in Supabase Auth settings.');
    } else if (authError) setProviderMessage('That sign-in could not be completed. Please try again or use email and password.');
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setMessage(''); setBusy(true);
    try {
      const response = await fetch(`/api/auth/${mode === 'login' ? 'login' : 'signup'}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, next: nextPath })
      });
      const data = await response.json();
      if (!response.ok) {
        const detail = String(data.error || '');
        if (detail.toLowerCase().includes('email rate limit exceeded')) {
          throw new Error('Confirmation emails are temporarily limited. Wait before retrying, or contact support.');
        }
        throw new Error(detail || 'Unable to continue.');
      }
      if (data.needsConfirmation) {
        setMessage('Account created. Check your inbox for the confirmation link to finish setting up your account.');
      } else {
        router.replace(nextPath);
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to continue.'); }
    finally { setBusy(false); }
  }

  return (
    <main className="auth-page">
      <section className="auth-story" aria-label="About Jobhunter">
        <a className="auth-story-brand" href="/" aria-label="Jobhunter home">
          <span className="auth-story-mark">JH</span><span>Jobhunter</span>
        </a>
        <div className="auth-story-content">
          <h1>Your next role starts with a stronger story.</h1>
          <p className="auth-story-lede">Keep your search organized, your experience ready, and every resume focused on the opportunity in front of you.</p>
          <ul className="auth-benefits">
            <li><span><Briefcase size={17} aria-hidden="true" /></span><div><strong>Keep roles in one place</strong><small>Save opportunities as you find them.</small></div></li>
            <li><span><FileText size={17} aria-hidden="true" /></span><div><strong>Tailor with your experience</strong><small>Build a focused resume for each role.</small></div></li>
            <li><span><ShieldCheck size={17} aria-hidden="true" /></span><div><strong>Stay in control</strong><small>Review, edit, and export before you apply.</small></div></li>
          </ul>
        </div>
        <p className="auth-story-footnote">One private workspace for your next career move.</p>
      </section>

      <section className="auth-panel-wrap" aria-label={mode === 'login' ? 'Sign in to Jobhunter' : 'Create a Jobhunter account'}>
        <div className="auth-card">
          <div className="auth-intro">
            <h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
            <p className="auth-description">{mode === 'login' ? 'Sign in to pick up where your job search left off.' : 'Start with LinkedIn or create an account with your email.'}</p>
          </div>

          <div className="auth-provider-block">
            <a className="auth-linkedin-button" href={`/api/auth/oauth?provider=linkedin_oidc&next=${encodeURIComponent(nextPath)}`}>
              <Linkedin size={18} aria-hidden="true" />
              <span>Continue with LinkedIn</span>
              <ArrowRight size={16} aria-hidden="true" />
            </a>
            <p>New here? LinkedIn creates your account. Returning? It signs you in.</p>
          </div>

          {providerMessage && <p className="auth-provider-message" role="status">{providerMessage}</p>}
          <div className="auth-divider"><span>or use email and password</span></div>

          <form onSubmit={submit} className="auth-form">
            <label className="auth-field">Email address
              <input autoComplete="email" required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            </label>
            <label className="auth-field">Password
              <input autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={8} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={mode === 'login' ? 'Enter your password' : 'At least 8 characters'} />
            </label>
            {error && <p className="auth-feedback is-error" role="alert">{error}</p>}
            {message && <p className="auth-feedback is-success" role="status">{message}</p>}
            <button className="auth-submit" type="submit" disabled={busy} aria-busy={busy}>
              {busy ? 'Please wait…' : mode === 'login' ? 'Sign in with email' : 'Create account'}
              {!busy && <ArrowRight size={16} aria-hidden="true" />}
            </button>
          </form>

          <p className="auth-mode-switch">
            {mode === 'login' ? 'New to Jobhunter?' : 'Already have an account?'}
            <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setMessage(''); }}>
              {mode === 'login' ? 'Create an account' : 'Sign in'}
            </button>
          </p>
          <p className="auth-privacy-note">Your career profile and saved roles stay in your private workspace.</p>
        </div>
      </section>
    </main>
  );
}

