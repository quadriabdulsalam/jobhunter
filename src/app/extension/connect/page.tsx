'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Chrome, Link2 } from 'lucide-react';

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
    <main className="extension-connect-page">
      <section className="extension-connect-card">
        <div className="extension-connect-mark"><Chrome size={20} aria-hidden="true" /></div>
        <p className="extension-connect-brand">JOBHUNTER · LINKEDIN HELPER</p>
        <h1>Connect your browser helper</h1>
        <p className={`extension-connect-status${failed ? ' is-error' : ''}`} role="status" aria-live="polite">
          {message}
        </p>
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
          className="extension-connect-button"
        >
          {connecting ? <><Link2 size={16} className="connect-spinner" /> Connecting…</> : failed ? 'Try connecting again' : message.startsWith('Connected') ? <><CheckCircle2 size={17} /> Connected to Jobhunter</> : <><Link2 size={16} /> Connect browser helper</>}
        </button>
        <p className="extension-connect-footnote">Keep this tab open until the helper confirms the connection.</p>
      </section>
    </main>
  );
}

