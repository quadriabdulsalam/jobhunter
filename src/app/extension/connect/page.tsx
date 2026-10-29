'use client';

import { useEffect, useState } from 'react';

export default function ExtensionConnectPage() {
  const [message, setMessage] = useState('Connect the extension to your signed-in Jobhunter account.');
  const [failed, setFailed] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.source !== window || event.origin !== window.location.origin || event.data?.type !== 'JOBHUNTER_EXTENSION_CONNECT_RESULT') return;
      setConnecting(false);
      setMessage(event.data.success
        ? 'Connected. You can close this tab and return to LinkedIn.'
        : event.data.error || 'Could not connect. Make sure the Jobhunter extension is installed and try again.');
      setFailed(!event.data.success);
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#f9f9f8', color: '#111' }}>
      <section style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
        <p style={{ color: '#777', fontSize: 13 }}>Jobhunter</p>
        <h1 style={{ fontSize: 25, fontWeight: 600, letterSpacing: '-.03em' }}>Connect your extension</h1>
        <p role="status" style={{ color: failed ? '#b42318' : '#6b6b6b', fontSize: 14 }}>{message}</p>
        <button
          type="button"
          disabled={connecting}
          onClick={() => {
            setConnecting(true);
            setFailed(false);
            setMessage('Connecting your Jobhunter account to the extension…');
            window.postMessage({ type: 'JOBHUNTER_EXTENSION_CONNECT_REQUEST' }, window.location.origin);
            window.setTimeout(() => {
              setConnecting(current => {
                if (current) {
                  setFailed(true);
                  setMessage('No extension response. Check that the Jobhunter extension is installed and enabled, then try again.');
                }
                return false;
              });
            }, 8000);
          }}
          style={{ minHeight: 44, padding: '0 20px', border: 0, borderRadius: 8, background: '#111', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
        >
          {connecting ? 'Connecting…' : 'Connect extension'}
        </button>
      </section>
    </main>
  );
}
