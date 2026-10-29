const DEFAULT_APP_URL = 'https://jobhunter-azure.vercel.app';
const LOCAL_APP_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', async () => {
  const appUrlEl = document.getElementById('app-url');
  const loginForm = document.getElementById('login-form');
  const accountPanel = document.getElementById('account');
  const messageEl = document.getElementById('message');
  const signInButton = document.getElementById('sign-in');
  const openStudio = document.getElementById('open-studio');
  const createAccount = document.getElementById('create-account');
  const browserConnect = document.getElementById('browser-connect');

  const stored = await chrome.storage.local.get(['appUrl', 'session']);
  appUrlEl.value = stored.appUrl === LOCAL_APP_URL ? LOCAL_APP_URL : DEFAULT_APP_URL;
  updateLinks();

  appUrlEl.addEventListener('change', async () => {
    // Never send a session token for one app instance to another host.
    await chrome.storage.local.set({ appUrl: appUrlEl.value });
    await chrome.storage.local.remove('session');
    messageEl.textContent = '';
    updateLinks();
    await refreshStatus();
  });

  loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    messageEl.textContent = '';
    signInButton.disabled = true;
    signInButton.textContent = 'Signing in…';
    const appUrl = appUrlEl.value;

    try {
      const response = await fetch(`${appUrl}/api/auth/extension-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: document.getElementById('email').value,
          password: document.getElementById('password').value
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.session?.accessToken || !data.session?.refreshToken) {
        throw new Error(data.error || 'Sign-in did not return a session. Please try again.');
      }

      await chrome.storage.local.set({ appUrl, session: data.session });
      document.getElementById('password').value = '';
      await refreshStatus();
    } catch (error) {
      messageEl.textContent = error instanceof Error
        ? `${error.message} Check your connection and selected app.`
        : 'Unable to sign in. Check your connection and selected app.';
    } finally {
      signInButton.disabled = false;
      signInButton.textContent = 'Sign in';
    }
  });

  document.getElementById('sign-out').addEventListener('click', async () => {
    await chrome.storage.local.remove('session');
    accountPanel.style.display = 'none';
    loginForm.style.display = 'block';
    document.getElementById('status').className = 'status offline';
    document.getElementById('status-text').textContent = 'Signed out';
    messageEl.textContent = '';
  });

  function updateLinks() {
    openStudio.href = appUrlEl.value;
    createAccount.href = `${appUrlEl.value}/login?mode=signup`;
    browserConnect.href = `${appUrlEl.value}/extension/connect`;
  }

  async function refreshStatus() {
    const status = document.getElementById('status');
    const statusText = document.getElementById('status-text');
    status.className = 'status';
    statusText.textContent = 'Checking connection…';

    const response = await chrome.runtime.sendMessage({ type: 'CHECK_SERVER' }).catch(error => ({
      success: false,
      error: error?.message || 'Extension connection failed.'
    }));

    if (response?.needsLogin) {
      status.className = 'status offline';
      statusText.textContent = 'Sign in to connect your account';
      accountPanel.style.display = 'none';
      loginForm.style.display = 'block';
      return;
    }

    if (response?.success && response.profile) {
      status.className = 'status online';
      statusText.textContent = 'Connected to your account';
      document.getElementById('account-name').textContent = response.profile.contact?.name || 'Your profile is ready';
      accountPanel.style.display = 'block';
      loginForm.style.display = 'none';
      return;
    }

    if (response?.status === 404) {
      status.className = 'status online';
      statusText.textContent = 'Connected, but your profile needs setup';
      document.getElementById('account-name').textContent = 'Create your profile in Jobhunter to start tailoring.';
      accountPanel.style.display = 'block';
      loginForm.style.display = 'none';
      return;
    }

    status.className = 'status offline';
    statusText.textContent = 'Could not reach Jobhunter';
    accountPanel.style.display = 'none';
    loginForm.style.display = 'block';
    if (response?.error) messageEl.textContent = response.error;
  }

  await refreshStatus();
});
