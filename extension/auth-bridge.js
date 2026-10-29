// Runs only on the Jobhunter app origin. The session stays in this isolated
// content-script world and is forwarded directly to the extension service worker.
window.addEventListener('message', async event => {
  if (event.source !== window || event.origin !== window.location.origin || event.data?.type !== 'JOBHUNTER_EXTENSION_CONNECT_REQUEST') return;

  try {
    const response = await fetch('/api/auth/extension-session', { cache: 'no-store', credentials: 'same-origin' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.session) throw new Error(data.error || 'Sign in to Jobhunter first.');

    const result = await chrome.runtime.sendMessage({ type: 'STORE_SESSION', session: data.session });
    if (!result?.success) throw new Error(result?.error || 'Could not save the session in the extension.');
    window.postMessage({ type: 'JOBHUNTER_EXTENSION_CONNECT_RESULT', success: true }, window.location.origin);
  } catch (error) {
    window.postMessage({
      type: 'JOBHUNTER_EXTENSION_CONNECT_RESULT',
      success: false,
      error: error instanceof Error ? error.message : 'Unable to connect the extension.'
    }, window.location.origin);
  }
});
