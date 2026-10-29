// ==UserScript==
// @name         Jobhunter — LinkedIn Copilot
// @namespace    https://github.com/quadriabdulsalam/jobhunter
// @version      1.0.1
// @description  Extract LinkedIn job details, tailor a CV with Jobhunter, and assist with application forms.
// @author       Jobhunter
// @match        https://*.linkedin.com/jobs/*
// @match        https://jobhunter-azure.vercel.app/*
// @match        http://localhost:3000/*
// @run-at       document-idle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_openInTab
// @grant        GM_xmlhttpRequest
// @grant        GM_addValueChangeListener
// @updateURL    https://raw.githubusercontent.com/quadriabdulsalam/jobhunter/main/userscript/jobhunter.user.js
// @downloadURL  https://raw.githubusercontent.com/quadriabdulsalam/jobhunter/main/userscript/jobhunter.user.js
// @connect      jobhunter-azure.vercel.app
// @connect      localhost
// @connect      127.0.0.1
// ==/UserScript==

(function () {
  'use strict';

  const DEFAULT_APP_URL = 'https://jobhunter-azure.vercel.app';
  const APP_URL_KEY = 'jobhunter.appUrl';
  const SESSION_KEY = 'jobhunter.session';
  const onLinkedIn = /(^|\.)linkedin\.com$/i.test(location.hostname) && location.pathname.startsWith('/jobs/');

  const getValue = (key, fallback) => GM_getValue(key, fallback);
  const setValue = (key, value) => GM_setValue(key, value);
  const normalizeAppUrl = value => String(value || DEFAULT_APP_URL).trim().replace(/\/+$/, '');

  // On a signed-in Jobhunter page, use the existing same-origin session endpoint
  // to share the current Supabase session with the userscript's LinkedIn context.
  if (!onLinkedIn) {
    const appUrl = normalizeAppUrl(getValue(APP_URL_KEY, DEFAULT_APP_URL));
    if (location.origin === appUrl) {
      // Keep checking briefly so sign-ins that finish through client-side routing
      // are picked up without requiring the user to reload the app page.
      let attempts = 0;
      const syncSession = async () => {
        attempts++;
        try {
          const response = await fetch(`${appUrl}/api/auth/extension-session`, { credentials: 'include', cache: 'no-store' });
          const data = response.ok ? await response.json() : null;
          if (data?.session?.accessToken && data?.session?.refreshToken) {
            setValue(SESSION_KEY, data.session);
            showAppNotice('Jobhunter userscript connected. Return to your LinkedIn tab.');
            clearInterval(syncTimer);
            return;
          }
        } catch {}
        if (attempts >= 90) clearInterval(syncTimer);
      };
      const syncTimer = setInterval(syncSession, 2000);
      syncSession();
    }
    return;
  }

  if (document.getElementById('jobhunter-userscript-host')) return;

  const host = document.createElement('div');
  host.id = 'jobhunter-userscript-host';
  document.documentElement.appendChild(host);
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = `
    <style>
      :host { all: initial; }
      * { box-sizing: border-box; }
      .panel { position: fixed; z-index: 2147483646; right: 20px; bottom: 20px; width: 330px; max-height: min(620px, calc(100vh - 40px)); overflow: auto; padding: 16px; border: 1px solid #e6e6e6; border-radius: 14px; background: #fff; color: #111; box-shadow: 0 8px 32px #0002; font: 13px/1.45 Inter, ui-sans-serif, system-ui, -apple-system, sans-serif; }
      .header, .brand, .actions, .row { display: flex; align-items: center; }
      .header, .row { justify-content: space-between; gap: 10px; }
      .brand { gap: 10px; }
      .logo { display:grid; place-items:center; width:32px; height:32px; border-radius:9px; background:#111; color:#fff; font-weight:700; }
      .name { font-size:14px; font-weight:650; }
      .muted { color:#777; font-size:12px; }
      .status { margin: 14px 0; color:#666; font-size:12px; }
      .status:before { content:''; display:inline-block; width:7px; height:7px; margin-right:7px; border-radius:50%; background:#aaa; }
      .status.online:before { background:#16834a; }
      .status.error:before { background:#c23a32; }
      .job { margin: 12px 0; padding: 12px 0; border-top:1px solid #eee; border-bottom:1px solid #eee; }
      .job-title { margin-bottom:4px; font-size:14px; font-weight:650; }
      .actions { flex-direction:column; gap:8px; }
      button, a.button { display:block; width:100%; min-height:38px; padding:9px 12px; border:1px solid #e3e3e3; border-radius:8px; background:#fff; color:#111; font:600 12px/1.2 inherit; text-align:center; text-decoration:none; cursor:pointer; }
      button.primary { border-color:#111; background:#111; color:#fff; }
      button:disabled { opacity:.55; cursor:wait; }
      .icon { width:auto; min-height:28px; padding:5px 8px; }
      .settings { display:none; margin-top:12px; padding-top:12px; border-top:1px solid #eee; }
      .settings.open { display:block; }
      label { display:block; margin-bottom:6px; color:#666; font-size:11px; }
      input { width:100%; min-height:36px; margin-bottom:8px; padding:8px; border:1px solid #ddd; border-radius:7px; font:inherit; }
      .result { margin-top:10px; padding:10px; border-radius:8px; background:#f6f6f5; }
      .result strong { display:block; margin-bottom:4px; }
      .small { margin-top:10px; color:#888; font-size:11px; }
    </style>
    <section class="panel" aria-label="Jobhunter LinkedIn Copilot">
      <div class="header">
        <div class="brand"><div class="logo">J</div><div><div class="name">Jobhunter</div><div class="muted">LinkedIn job copilot</div></div></div>
        <div class="actions" style="flex-direction:row">
          <button class="icon" id="refresh" title="Refresh">↻</button>
          <button class="icon" id="minimize" title="Minimize">−</button>
        </div>
      </div>
      <div class="status" id="status">Checking Jobhunter connection…</div>
      <div class="job" id="job"><div class="muted">Reading job details…</div></div>
      <div class="actions" id="actions">
        <button class="primary" id="tailor">Tailor my CV for this job</button>
        <button id="autofill">Assist with application form</button>
        <button id="connect">Connect Jobhunter account</button>
        <button id="settings-toggle">Settings</button>
      </div>
      <div class="settings" id="settings">
        <label for="app-url">Jobhunter app URL</label>
        <input id="app-url" type="url" spellcheck="false" placeholder="https://jobhunter-azure.vercel.app">
        <button id="save-url">Save app URL</button>
      </div>
      <div class="small">Review generated content and form fields before you submit an application.</div>
    </section>`;

  const $ = selector => shadow.querySelector(selector);
  let profile = null;
  let job = null;
  let busy = false;
  let minimized = false;

  function showAppNotice(message) {
    const notice = document.createElement('div');
    notice.textContent = message;
    Object.assign(notice.style, { position: 'fixed', zIndex: '2147483647', right: '20px', bottom: '20px', padding: '12px 16px', borderRadius: '9px', background: '#111', color: '#fff', font: '13px system-ui, sans-serif' });
    document.body.appendChild(notice);
    setTimeout(() => notice.remove(), 5000);
  }

  function parseTitle() {
    const raw = (document.title || '').replace(/\s*\|\s*LinkedIn.*$/i, '').trim();
    let match = raw.match(/^(.+?)\s+hiring\s+(.+?)(?:\s+in\s+(.+))?$/i);
    if (match) return { company: match[1].trim(), title: match[2].trim(), location: match[3]?.trim() || 'Remote / Hybrid' };
    match = raw.match(/^(.+?)\s+at\s+(.+?)(?:\s+in\s+(.+))?$/i);
    if (match) return { title: match[1].trim(), company: match[2].trim(), location: match[3]?.trim() || 'Remote / Hybrid' };
    return { title: raw, company: '', location: 'Remote / Hybrid' };
  }

  function extractJob() {
    const text = selectors => {
      for (const selector of selectors) {
        const value = document.querySelector(selector)?.innerText?.trim();
        if (value) return value;
      }
      return '';
    };
    const fallback = parseTitle();
    const title = text(['h1.job-details-jobs-unified-top-card__job-title', 'h1.jobs-unified-top-card__job-title', 'h1[class*="job-title"]', '.topcard__title', 'main h1', 'h1']) || fallback.title;
    const company = text(['.job-details-jobs-unified-top-card__company-name a', '.jobs-unified-top-card__company-name', 'a[href*="/company/"]', '[class*="company-name"]']) || fallback.company;
    const locationText = text(['.job-details-jobs-unified-top-card__primary-description-container', '.jobs-unified-top-card__primary-description', '[class*="primary-description"]']);
    const description = text(['#job-details', '.jobs-description__content', '.jobs-description', '.jobs-box__html-content', '[class*="jobs-description"]', '.description__text']) || document.querySelector('meta[property="og:description"]')?.content || document.querySelector('meta[name="description"]')?.content || '';
    if (!title && !description) return null;
    const applyText = document.querySelector('.jobs-apply-button--top-card, .jobs-apply-button')?.innerText?.toLowerCase() || '';
    const idMatch = location.href.match(/currentJobId=(\d+)/) || location.href.match(/\/jobs\/view\/(\d+)/);
    return {
      id: idMatch ? `li-${idMatch[1]}` : `li-${Date.now()}`,
      title: title || 'Target Role', company: company || 'Hiring Company',
      location: locationText.split('·')[0]?.trim() || fallback.location,
      description, url: location.href,
      applyType: applyText.includes('easy apply') ? 'easy_apply' : 'external', source: 'linkedin'
    };
  }

  function currentAppUrl() { return normalizeAppUrl(getValue(APP_URL_KEY, DEFAULT_APP_URL)); }
  function request(method, path, body, token) {
    return new Promise((resolve, reject) => {
      const options = {
        method, url: `${currentAppUrl()}${path}`, timeout: 30000,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        onload: response => {
          let data = {};
          try { data = JSON.parse(response.responseText || '{}'); } catch {}
          resolve({ status: response.status, ok: response.status >= 200 && response.status < 300, data });
        },
        onerror: () => reject(new Error('Could not reach Jobhunter. Check your app URL and connection.')),
        ontimeout: () => reject(new Error('Jobhunter request timed out. Try again.'))
      };
      if (body !== undefined) options.data = JSON.stringify(body);
      GM_xmlhttpRequest(options);
    });
  }

  async function getSession() {
    let session = getValue(SESSION_KEY, null);
    if (session?.accessToken && session.expiresAt && session.expiresAt * 1000 < Date.now() + 60000 && session.refreshToken) {
      const refreshed = await request('POST', '/api/auth/extension-refresh', { refreshToken: session.refreshToken });
      if (refreshed.ok && refreshed.data.session?.accessToken) {
        session = refreshed.data.session;
        setValue(SESSION_KEY, session);
      } else {
        setValue(SESSION_KEY, null);
        session = null;
      }
    }
    return session;
  }

  async function authorizedRequest(method, path, body) {
    let session = await getSession();
    if (!session?.accessToken) throw new Error('Connect your Jobhunter account first.');
    let response = await request(method, path, body, session.accessToken);
    if (response.status === 401 && session.refreshToken) {
      const refreshed = await request('POST', '/api/auth/extension-refresh', { refreshToken: session.refreshToken });
      if (refreshed.ok && refreshed.data.session?.accessToken) {
        session = refreshed.data.session;
        setValue(SESSION_KEY, session);
        response = await request(method, path, body, session.accessToken);
      }
    }
    if (!response.ok || response.data.success === false) throw new Error(response.data.error || response.data.message || `Jobhunter returned ${response.status}.`);
    return response.data;
  }

  function setStatus(message, kind = '') {
    const element = $('#status');
    element.textContent = message;
    element.className = `status ${kind}`;
  }

  function renderJob() {
    job = extractJob();
    const target = $('#job');
    target.replaceChildren();
    if (!job) {
      target.textContent = 'No job detected on this page. Open a LinkedIn job listing and refresh.';
      return;
    }
    const title = document.createElement('div'); title.className = 'job-title'; title.textContent = job.title;
    const company = document.createElement('div'); company.className = 'muted'; company.textContent = `${job.company} · ${job.location}`;
    const meta = document.createElement('div'); meta.className = 'muted'; meta.style.marginTop = '7px'; meta.textContent = `${job.applyType === 'easy_apply' ? 'Easy Apply' : 'External application'} · ${job.description.split(/\s+/).filter(Boolean).length} description words`;
    target.append(title, company, meta);
  }

  async function checkConnection() {
    try {
      const data = await authorizedRequest('GET', '/api/profile');
      profile = data.profile || null;
      if (!profile) throw new Error('Your Jobhunter profile is not set up yet. Add your profile in the app first.');
      setStatus('Connected to your Jobhunter account', 'online');
    } catch (error) {
      profile = null;
      const message = error instanceof Error ? error.message : 'Could not connect to Jobhunter.';
      setStatus(message, 'error');
    }
  }

  function connectAccount() {
    GM_openInTab(`${currentAppUrl()}/?userscriptConnect=1`, { active: true, insert: true, setParent: true });
    setStatus('Sign in to Jobhunter in the new tab; your session will connect automatically.');
  }

  async function tailorJob() {
    if (!job || busy) return;
    if (!job.description || job.description.trim().length < 20) { setStatus('The job description is too short to tailor a CV.', 'error'); return; }
    busy = true;
    $('#tailor').disabled = true;
    $('#tailor').textContent = 'Tailoring your CV…';
    setStatus('Sending this job and your profile to Jobhunter…');
    try {
      const data = await authorizedRequest('POST', '/api/jobs', { ...job, autoTailor: true });
      if (!data.tailoredCv) throw new Error('Job saved, but tailoring did not return a CV. Make sure your profile and AI provider are configured.');
      const result = document.createElement('div'); result.className = 'result';
      const heading = document.createElement('strong'); heading.textContent = `CV tailored · ${data.tailoredCv.matchScore ?? '—'}% match`;
      const rationale = document.createElement('div'); rationale.textContent = data.tailoredCv.rationale || 'Your tailored CV is ready.';
      const link = document.createElement('a'); link.className = 'button'; link.style.marginTop = '9px'; link.textContent = 'Open tailored CV'; link.href = `${currentAppUrl()}/?cvId=${encodeURIComponent(data.tailoredCv.id)}`; link.target = '_blank'; link.rel = 'noopener noreferrer';
      result.append(heading, rationale, link);
      $('#job').appendChild(result);
      setStatus('CV tailoring complete.', 'online');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not tailor this CV.', 'error');
    } finally {
      busy = false;
      $('#tailor').disabled = false;
      $('#tailor').textContent = 'Tailor my CV for this job';
    }
  }

  function assistForm() {
    if (!profile?.contact) { setStatus('Connect your account and set up your profile before using form assistance.', 'error'); return; }
    const contact = profile.contact;
    const nameParts = String(contact.name || '').trim().split(/\s+/);
    const values = [
      [['input[name*="first" i]', 'input[id*="first" i]', 'input[autocomplete="given-name"]'], nameParts[0]],
      [['input[name*="last" i]', 'input[id*="last" i]', 'input[autocomplete="family-name"]'], nameParts.slice(1).join(' ')],
      [['input[name*="name" i]:not([name*="first" i]):not([name*="last" i])', 'input[id*="full_name" i]'], contact.name],
      [['input[type="email"]', 'input[name*="email" i]', 'input[id*="email" i]'], contact.email],
      [['input[type="tel"]', 'input[name*="phone" i]', 'input[id*="phone" i]'], contact.phone],
      [['input[name*="city" i]', 'input[id*="city" i]', 'input[name*="location" i]'], contact.location],
      [['input[name*="linkedin" i]', 'input[id*="linkedin" i]'], contact.linkedin],
      [['input[name*="github" i]', 'input[id*="github" i]', 'input[name*="website" i]'], contact.github]
    ];
    let count = 0;
    for (const [selectors, value] of values) {
      if (!value) continue;
      for (const selector of selectors) {
        document.querySelectorAll(selector).forEach(input => {
          if (!(input instanceof HTMLInputElement) || input.value || input.disabled || input.readOnly) return;
          const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
          setter?.call(input, value);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          count++;
        });
      }
    }
    setStatus(`Filled ${count} blank fields. Review each one before continuing.`, 'online');
  }

  $('#refresh').addEventListener('click', () => { renderJob(); checkConnection(); });
  $('#minimize').addEventListener('click', () => {
    minimized = !minimized;
    $('.panel').style.width = minimized ? '180px' : '330px';
    $('.job').hidden = minimized;
    $('#actions').hidden = minimized;
    $('#settings').hidden = minimized;
  });
  $('#tailor').addEventListener('click', tailorJob);
  $('#autofill').addEventListener('click', assistForm);
  $('#connect').addEventListener('click', connectAccount);
  $('#settings-toggle').addEventListener('click', () => $('#settings').classList.toggle('open'));
  $('#app-url').value = currentAppUrl();
  $('#save-url').addEventListener('click', async () => {
    try {
      const parsed = new URL($('#app-url').value);
      if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error();
      setValue(APP_URL_KEY, parsed.origin);
      $('#app-url').value = parsed.origin;
      setStatus('App URL saved. Checking connection…');
      await checkConnection();
    } catch { setStatus('Enter a valid Jobhunter app URL.', 'error'); }
  });

  if (typeof GM_addValueChangeListener === 'function') {
    GM_addValueChangeListener(SESSION_KEY, () => checkConnection());
  }

  renderJob();
  checkConnection();
  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href === lastUrl) return;
    lastUrl = location.href;
    setTimeout(() => { renderJob(); checkConnection(); }, 700);
  }).observe(document, { childList: true, subtree: true });

  function showAppNotice(message) {
    const notice = document.createElement('div');
    notice.textContent = message;
    Object.assign(notice.style, { position: 'fixed', zIndex: '2147483647', right: '20px', bottom: '20px', padding: '12px 16px', borderRadius: '9px', background: '#111', color: '#fff', font: '13px system-ui, sans-serif' });
    document.body.appendChild(notice);
    setTimeout(() => notice.remove(), 5000);
  }
})();
