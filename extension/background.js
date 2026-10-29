// Jobhunter extension service worker. API requests are made from here so the
// LinkedIn content script never needs direct network access to the app.
const DEFAULT_APP_URL = 'https://jobhunter-azure.vercel.app';
const LOCAL_APP_URL = 'http://localhost:3000';

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Jobhunter] Extension service worker initialized.');
});

async function getAppUrl() {
  const { appUrl } = await chrome.storage.local.get('appUrl');
  return appUrl === LOCAL_APP_URL ? LOCAL_APP_URL : DEFAULT_APP_URL;
}

async function getSession() {
  const { session } = await chrome.storage.local.get('session');
  return session || null;
}

async function refreshSession(session, appUrl) {
  if (!session?.refreshToken) return null;
  const response = await fetch(`${appUrl}/api/auth/extension-refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: session.refreshToken })
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.session?.accessToken) {
    await chrome.storage.local.remove('session');
    return null;
  }
  await chrome.storage.local.set({ session: result.session });
  return result.session;
}

async function apiRequest(path, options = {}) {
  const appUrl = await getAppUrl();
  let session = await getSession();

  const send = (currentSession) => fetch(`${appUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      ...(currentSession?.accessToken ? { Authorization: `Bearer ${currentSession.accessToken}` } : {})
    }
  });

  let response = await send(session);
  if (response.status === 401 && session?.refreshToken) {
    session = await refreshSession(session, appUrl);
    if (session) response = await send(session);
  }

  const data = await response.json().catch(() => ({}));
  return {
    ...data,
    success: response.ok && data.success !== false,
    status: response.status,
    needsLogin: response.status === 401,
    appUrl
  };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request?.type === 'STORE_SESSION') {
    (async () => {
      const appUrl = await getAppUrl();
      let senderOrigin = '';
      try { senderOrigin = new URL(sender.url || '').origin; } catch {}
      const session = request.session;
      if (senderOrigin !== appUrl || typeof session?.accessToken !== 'string' || typeof session?.refreshToken !== 'string') {
        sendResponse({ success: false, error: 'Session handoff could not be verified.' });
        return;
      }
      await chrome.storage.local.set({ session });
      sendResponse({ success: true });
    })().catch(() => sendResponse({ success: false, error: 'Could not save the Jobhunter session.' }));
    return true;
  }

  if (!['CHECK_SERVER', 'SAVE_JOB', 'TAILOR_JOB'].includes(request?.type)) return false;

  const operation = request.type === 'CHECK_SERVER'
    ? apiRequest('/api/profile')
    : apiRequest(request.type === 'TAILOR_JOB' ? '/api/tailor' : '/api/jobs', {
        method: 'POST',
        body: JSON.stringify(request.payload || {})
      });

  operation.then(sendResponse).catch(error => sendResponse({
    success: false,
    error: error instanceof Error ? error.message : 'Unable to reach Jobhunter.'
  }));
  return true;
});
