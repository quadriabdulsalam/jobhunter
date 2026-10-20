// JobHunter AI - LinkedIn Copilot Content Script (Ultra-Resilient Scraper & Title Fallback)
(function () {
  console.log('[JobHunter] Content script loaded on LinkedIn.');

  let currentJobData = null;
  let isProcessing = false;
  let isWidgetMinimized = false;
  let masterProfile = null;
  let isConnected = false;
  let showManualInput = false;

  // Communicate with background script proxy to avoid Mixed-Content (HTTPS -> HTTP) blocking
  function checkServerConnection() {
    try {
      chrome.runtime.sendMessage({ type: 'CHECK_SERVER' }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn('[JobHunter] Extension background message error:', chrome.runtime.lastError.message);
          updateServerStatus(false);
          return;
        }
        if (response && response.success && response.profile) {
          masterProfile = response.profile;
          isConnected = true;
          updateServerStatus(true);
        } else {
          isConnected = false;
          updateServerStatus(false);
        }
      });
    } catch (e) {
      console.warn('[JobHunter] Connection check error:', e);
      updateServerStatus(false);
    }
  }

  function updateServerStatus(online) {
    const statusEl = document.getElementById('jh-status-indicator');
    if (!statusEl) return;
    if (online) {
      statusEl.className = 'jh-status';
      statusEl.innerHTML = '<span class="jh-status-dot"></span> Studio Connected';
    } else {
      statusEl.className = 'jh-status offline';
      statusEl.innerHTML = '<span class="jh-status-dot"></span> Studio Offline';
    }
  }

  // Parse LinkedIn tab title as guaranteed fallback
  // e.g. "GetYourGuide hiring Senior Software Engineer (Backend focused) in Berlin, Germany | LinkedIn"
  function parseDocumentTitle() {
    const raw = (document.title || '').replace(/\s*\|\s*LinkedIn.*$/i, '').trim();
    if (!raw) return null;

    // Pattern 1: "Company hiring Job Title in Location"
    let m = raw.match(/^(.+?)\s+hiring\s+(.+?)(?:\s+in\s+(.+))?$/i);
    if (m) {
      return {
        company: m[1].trim(),
        title: m[2].trim(),
        location: m[3] ? m[3].trim() : 'Remote / Hybrid'
      };
    }

    // Pattern 2: "Job Title at Company"
    m = raw.match(/^(.+?)\s+at\s+(.+?)(?:\s+in\s+(.+))?$/i);
    if (m) {
      return {
        title: m[1].trim(),
        company: m[2].trim(),
        location: m[3] ? m[3].trim() : 'Remote / Hybrid'
      };
    }

    // Pattern 3: "Job Title - Company - Location"
    m = raw.match(/^(.+?)\s*[-–]\s*(.+?)(?:\s*[-–]\s*(.+))?$/);
    if (m) {
      return {
        title: m[1].trim(),
        company: m[2].trim(),
        location: m[3] ? m[3].trim() : 'Remote / Hybrid'
      };
    }

    return {
      title: raw,
      company: '',
      location: 'Remote / Hybrid'
    };
  }

  // Multi-tier robust DOM scraper for LinkedIn job listings
  function extractJobDetails() {
    // 1. Try DOM selectors for Title
    const titleSelectors = [
      'h1.job-details-jobs-unified-top-card__job-title',
      'h1.jobs-unified-top-card__job-title',
      'h1[class*="job-title"]',
      'h1.t-24',
      '.job-details-jobs-unified-top-card__job-title',
      '.jobs-unified-top-card__job-title',
      '.topcard__title',
      'main h1',
      'h1'
    ];

    let title = '';
    for (const sel of titleSelectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText && el.innerText.trim().length > 2) {
        const text = el.innerText.trim();
        // Skip common generic headers
        if (!text.toLowerCase().includes('messaging') && !text.toLowerCase().includes('notifications')) {
          title = text;
          break;
        }
      }
    }

    // 2. Try DOM selectors for Company Name
    const companySelectors = [
      'a[href*="/company/"]',
      '.job-details-jobs-unified-top-card__company-name a',
      '.job-details-jobs-unified-top-card__company-name',
      '.jobs-unified-top-card__company-name',
      '[class*="company-name"]',
      '.topcard__flavor--black-link',
      '.topcard__flavor'
    ];

    let company = '';
    for (const sel of companySelectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText && el.innerText.trim().length > 1) {
        company = el.innerText.trim().split('\n')[0].trim();
        break;
      }
    }

    // 3. Try DOM selectors for Location
    const locationSelectors = [
      '.job-details-jobs-unified-top-card__primary-description-container',
      '.jobs-unified-top-card__primary-description',
      '[class*="primary-description"]',
      '.job-details-jobs-unified-top-card__bullet',
      '.topcard__flavor--bullet'
    ];

    let location = '';
    for (const sel of locationSelectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText) {
        location = el.innerText.split('·')[0].trim();
        break;
      }
    }

    // Fallback: If title or company missing from DOM, check document.title!
    const fromTitle = parseDocumentTitle();
    if (fromTitle) {
      if (!title || title.length < 3) title = fromTitle.title;
      if (!company || company.length < 2) company = fromTitle.company;
      if (!location) location = fromTitle.location;
    }

    // 4. Try DOM selectors for Description
    const descSelectors = [
      '#job-details',
      '.jobs-description__content',
      '.jobs-description',
      '.jobs-box__html-content',
      '[class*="jobs-description"]',
      'article',
      '.description__text'
    ];

    let description = '';
    for (const sel of descSelectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText && el.innerText.trim().length > 30) {
        description = el.innerText.trim();
        break;
      }
    }

    // Fallback for description from meta tags
    if (!description || description.length < 30) {
      const ogDesc = document.querySelector('meta[property="og:description"]')?.content ||
                     document.querySelector('meta[name="description"]')?.content;
      if (ogDesc && ogDesc.length > 20) {
        description = ogDesc;
      }
    }

    // 5. Detect Apply Type
    const applyButton = document.querySelector('.jobs-apply-button--top-card, .jobs-apply-button, [data-control-name="jobdetails_topcard_inapply"]');
    const isEasyApply = applyButton ? applyButton.innerText.toLowerCase().includes('easy apply') : false;

    // 6. Job ID & URL
    const url = window.location.href;
    const urlMatch = url.match(/currentJobId=(\d+)/) || url.match(/\/jobs\/view\/(\d+)/);
    const jobId = urlMatch ? `li-${urlMatch[1]}` : `li-${Date.now()}`;

    // If we have either a title or description, create the job object
    if (!title && !description) {
      return null;
    }

    return {
      id: jobId,
      title: title || 'Target Role',
      company: company || 'Hiring Company',
      location: location || 'Remote / Hybrid',
      description: description || `${title} at ${company}. Experience with backend platforms, distributed systems, and modern software engineering.`,
      url,
      applyType: isEasyApply ? 'easy_apply' : 'external',
      source: 'linkedin'
    };
  }

  // Render or update the floating widget
  function renderWidget() {
    let widget = document.getElementById('jobhunter-widget');
    if (!widget) {
      widget = document.createElement('div');
      widget.id = 'jobhunter-widget';
      document.body.appendChild(widget);
    }

    // Always attempt fresh extraction if no job yet or upon render
    if (!currentJobData) {
      currentJobData = extractJobDetails();
    }

    widget.innerHTML = `
      <div class="jh-header">
        <div class="jh-brand">
          <div class="jh-logo-badge">JH</div>
          <div class="jh-header-text">
            <div class="jh-title">JobHunter AI</div>
            <div id="jh-status-indicator" class="jh-status ${isConnected ? '' : 'offline'}">
              <span class="jh-status-dot"></span> ${isConnected ? 'Studio Connected' : 'Studio Offline'}
            </div>
          </div>
        </div>
        <div class="jh-actions-header">
          <button id="jh-btn-rescan" class="jh-icon-btn" title="Scan / Refresh Connection">🔄</button>
          <button id="jh-btn-minimize" class="jh-icon-btn" title="Minimize">─</button>
        </div>
      </div>

      <div class="jh-body">
        ${currentJobData ? `
          <div class="jh-job-card">
            <div class="jh-job-role" title="${currentJobData.title}">${currentJobData.title}</div>
            <div class="jh-job-company">${currentJobData.company} • ${currentJobData.location}</div>
            <div class="jh-job-meta-tags">
              <span class="jh-tag ${currentJobData.applyType === 'easy_apply' ? 'easy-apply' : ''}">
                ${currentJobData.applyType === 'easy_apply' ? '⚡ Easy Apply' : '🔗 External Link'}
              </span>
              <span class="jh-tag">JD: ${currentJobData.description ? `${currentJobData.description.split(' ').length} words` : 'Ready'}</span>
            </div>
          </div>

          <div id="jh-action-area">
            <button id="jh-btn-tailor" class="jh-btn-primary" ${isProcessing ? 'disabled' : ''}>
              ${isProcessing ? '<div class="jh-spinner"></div> Tailoring CV...' : '⚡ Extract & Tailor My CV'}
            </button>
          </div>

          <div id="jh-result-container" style="display: none;"></div>

          <button id="jh-btn-autofill" class="jh-btn-secondary" title="Fill application fields">
            🤖 Assist Auto-Fill Form
          </button>
        ` : `
          <div class="jh-job-card">
            <div style="font-size: 12.5px; font-weight: 600; color: #ffffff; margin-bottom: 4px;">
              LinkedIn Job Detection
            </div>
            <div style="font-size: 11.5px; color: #94a3b8; margin-bottom: 12px; line-height: 1.4;">
              Click below to force scan this page or enter role manually:
            </div>
            <button id="jh-btn-force-scan" class="jh-btn-primary" style="margin-bottom: 10px;">
              🔍 Scan This Page Now
            </button>
            <button id="jh-btn-toggle-manual" class="jh-btn-secondary" style="font-size: 11px;">
              ✏️ Enter / Paste Role Details
            </button>
          </div>

          ${showManualInput ? `
            <div style="display: flex; flex-direction: column; gap: 8px; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px;">
              <input id="jh-manual-title" placeholder="Job Title (e.g. Senior Backend Engineer)" style="padding: 6px 8px; font-size: 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.4); color: #fff;" />
              <input id="jh-manual-company" placeholder="Company (e.g. GetYourGuide)" style="padding: 6px 8px; font-size: 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.4); color: #fff;" />
              <button id="jh-btn-submit-manual" class="btn-primary" style="padding: 6px; font-size: 12px;">Tailor CV for this</button>
            </div>
          ` : ''}
        `}
      </div>
    `;

    // Rescan button handler
    const rescanBtn = document.getElementById('jh-btn-rescan');
    if (rescanBtn) {
      rescanBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        checkServerConnection();
        const extracted = extractJobDetails();
        if (extracted) {
          currentJobData = extracted;
        }
        renderWidget();
      });
    }

    // Force scan button handler
    const forceScanBtn = document.getElementById('jh-btn-force-scan');
    if (forceScanBtn) {
      forceScanBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        forceScanBtn.innerHTML = '<div class="jh-spinner"></div> Scanning...';
        setTimeout(() => {
          checkServerConnection();
          const extracted = extractJobDetails();
          if (extracted) {
            currentJobData = extracted;
            renderWidget();
          } else {
            forceScanBtn.innerText = 'Retrying scan...';
            // Fallback to title
            const t = parseDocumentTitle();
            if (t && t.title) {
              currentJobData = {
                id: `li-${Date.now()}`,
                title: t.title,
                company: t.company || 'LinkedIn Company',
                location: t.location || 'Berlin, Germany',
                description: `${t.title} at ${t.company}. Role extracted from LinkedIn job post.`,
                url: window.location.href,
                applyType: 'easy_apply',
                source: 'linkedin'
              };
              renderWidget();
            } else {
              showManualInput = true;
              renderWidget();
            }
          }
        }, 300);
      });
    }

    // Toggle manual input
    const toggleManualBtn = document.getElementById('jh-btn-toggle-manual');
    if (toggleManualBtn) {
      toggleManualBtn.addEventListener('click', () => {
        showManualInput = !showManualInput;
        renderWidget();
      });
    }

    // Submit manual
    const submitManualBtn = document.getElementById('jh-btn-submit-manual');
    if (submitManualBtn) {
      submitManualBtn.addEventListener('click', () => {
        const titleVal = document.getElementById('jh-manual-title')?.value;
        const compVal = document.getElementById('jh-manual-company')?.value;
        if (titleVal) {
          currentJobData = {
            id: `li-${Date.now()}`,
            title: titleVal,
            company: compVal || 'Company',
            location: 'Remote / Hybrid',
            description: `${titleVal} at ${compVal || 'Company'}.`,
            url: window.location.href,
            applyType: 'easy_apply',
            source: 'linkedin'
          };
          renderWidget();
        }
      });
    }

    // Minimize toggle
    const minBtn = document.getElementById('jh-btn-minimize');
    if (minBtn) {
      minBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        isWidgetMinimized = !isWidgetMinimized;
        widget.classList.toggle('minimized', isWidgetMinimized);
      });
    }

    widget.addEventListener('click', () => {
      if (isWidgetMinimized) {
        isWidgetMinimized = false;
        widget.classList.remove('minimized');
      }
    });

    // Tailor button handler
    const tailorBtn = document.getElementById('jh-btn-tailor');
    if (tailorBtn) {
      tailorBtn.addEventListener('click', handleTailorClick);
    }

    // Auto-fill button handler
    const autofillBtn = document.getElementById('jh-btn-autofill');
    if (autofillBtn) {
      autofillBtn.addEventListener('click', handleAutoFill);
    }
  }

  // Handle Tailor action via background service worker proxy
  function handleTailorClick() {
    if (!currentJobData || isProcessing) return;

    isProcessing = true;
    renderWidget();

    chrome.runtime.sendMessage({
      type: 'SAVE_JOB',
      payload: {
        ...currentJobData,
        autoTailor: true
      }
    }, (response) => {
      isProcessing = false;
      if (chrome.runtime.lastError) {
        alert('Communication error with extension background: ' + chrome.runtime.lastError.message);
        renderWidget();
        return;
      }

      if (response && response.success && response.tailoredCv) {
        showTailorResult(response.tailoredCv);
      } else {
        alert('Tailoring result: ' + (response?.error || 'Make sure JobHunter Studio is running at http://localhost:3000'));
        renderWidget();
      }
    });
  }

  function showTailorResult(tailoredCv) {
    const resultContainer = document.getElementById('jh-result-container');
    const actionArea = document.getElementById('jh-action-area');
    if (!resultContainer) return;

    if (actionArea) actionArea.style.display = 'none';
    resultContainer.style.display = 'flex';
    resultContainer.innerHTML = `
      <div class="jh-result-card">
        <div class="jh-score-badge">
          <span style="font-size: 12px; font-weight: 600; color: #f1f5f9;">ATS Match Score</span>
          <span class="jh-score-number">${tailoredCv.matchScore}%</span>
        </div>
        <div class="jh-toast">${(tailoredCv.rationale || '').slice(0, 140)}...</div>
        <a href="http://localhost:3000?cvId=${tailoredCv.id}" target="_blank" class="jh-btn-primary" style="text-decoration: none;">
          📄 Open Tailored CV Studio
        </a>
      </div>
    `;
  }

  // Intelligent Form Autofill
  function handleAutoFill() {
    if (!masterProfile) {
      alert('Master Profile not loaded. Please ensure JobHunter studio is running at http://localhost:3000.');
      return;
    }

    const contact = masterProfile.contact;
    const nameParts = (contact.name || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    let filledCount = 0;

    const fillInput = (selectorList, value) => {
      if (!value) return;
      for (const sel of selectorList) {
        const inputs = document.querySelectorAll(sel);
        inputs.forEach(input => {
          if (input && !input.value) {
            input.value = value;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            filledCount++;
          }
        });
      }
    };

    fillInput(['input[name*="first" i]', 'input[id*="first" i]', 'input[autocomplete="given-name"]'], firstName);
    fillInput(['input[name*="last" i]', 'input[id*="last" i]', 'input[autocomplete="family-name"]'], lastName);
    fillInput(['input[name*="name" i]:not([name*="first" i]):not([name*="last" i])', 'input[id*="full_name" i]'], contact.name);
    fillInput(['input[type="email"]', 'input[name*="email" i]', 'input[id*="email" i]'], contact.email);
    fillInput(['input[type="tel"]', 'input[name*="phone" i]', 'input[id*="phone" i]'], contact.phone);
    fillInput(['input[name*="city" i]', 'input[id*="city" i]', 'input[name*="location" i]'], contact.location);
    fillInput(['input[name*="linkedin" i]', 'input[id*="linkedin" i]'], contact.linkedin || 'https://linkedin.com');
    fillInput(['input[name*="github" i]', 'input[id*="github" i]', 'input[name*="website" i]'], contact.github || '');

    alert(`JobHunter Auto-Fill: Checked form fields and filled ${filledCount} fields! Please review custom questions before submitting.`);
  }

  // Check connection and initialize
  checkServerConnection();

  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      currentJobData = null;
      setTimeout(() => {
        checkServerConnection();
        renderWidget();
      }, 1000);
    }
  }).observe(document, { subtree: true, childList: true });

  window.addEventListener('load', () => {
    setTimeout(renderWidget, 1000);
  });

  setTimeout(renderWidget, 1000);
  setTimeout(renderWidget, 2500);
})();
