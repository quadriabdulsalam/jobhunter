// JobHunter AI - Extension Background Service Worker
const API_BASE = 'http://localhost:3000/api';

chrome.runtime.onInstalled.addListener(() => {
  console.log('[JobHunter] Background service worker initialized.');
});

// Proxy API requests from content scripts to avoid Mixed-Content (HTTPS -> HTTP) blocks
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'CHECK_SERVER') {
    fetch(`${API_BASE}/profile`)
      .then(res => res.json())
      .then(data => sendResponse({ success: true, profile: data.profile }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // Keep message channel open for async response
  }

  if (request.type === 'SAVE_JOB') {
    fetch(`${API_BASE}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request.payload)
    })
      .then(res => res.json())
      .then(data => sendResponse(data))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (request.type === 'TAILOR_JOB') {
    fetch(`${API_BASE}/tailor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request.payload)
    })
      .then(res => res.json())
      .then(data => sendResponse(data))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
});
