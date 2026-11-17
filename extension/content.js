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
      '…41531 tokens truncated…style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  {profile.contact.titles.join(' • ')}
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--accent-blue)', flexWrap: 'wrap' }}>
                  {profile.contact.location && <span>{profile.contact.location}</span>}
                  {profile.contact.phone && <a href={`tel:${profile.contact.phone}`}>{profile.contact.phone}</a>}
                  {profile.contact.email && <a href={`mailto:${profile.contact.email}`}>{profile.contact.email}</a>}
                  {profile.contact.github && <a href={profile.contact.github} target="_blank" rel="noreferrer">GitHub ↗</a>}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span className="badge badge-emerald" style={{ marginBottom: '6px' }}>
                  {profile.metadata.sourceFiles.length} CV{profile.metadata.sourceFiles.length === 1 ? '' : 's'} saved
                </span>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                  Used when tailoring your resume
                </div>
              </div>
            </div>

            {/* Categorized Skills */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} /> Skills
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '18px' }}>
                <div>
                  <h4 style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Languages</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {profile.skills.languages.map((s, i) => <span key={i} className="badge badge-blue">{s}</span>)}
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Frameworks & Libraries</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {profile.skills.frameworks.map((s, i) => <span key={i} className="badge badge-purple">{s}</span>)}
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Data & AI Infrastructure</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {profile.skills.data_and_ai.map((s, i) => <span key={i} className="badge badge-emerald">{s}</span>)}
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Cloud & DevOps</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {profile.skills.cloud_and_devops.map((s, i) => <span key={i} className="badge badge-amber">{s}</span>)}
                  </div>
                </div>
              </div>
            </div>

            {/* Work History Timeline */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Briefcase size={18} /> Work experience ({profile.experiences.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {profile.experiences.map(exp => (
                  <div key={exp.id} style={{ borderLeft: '2px solid var(--accent-blue)', paddingLeft: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '14.5px', color: '#ffffff' }}>{exp.role} — {exp.company}</strong>
                      <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{exp.startDate} – {exp.endDate} | {exp.location}</span>
                    </div>
                    <ul style={{ margin: '8px 0', paddingLeft: '18px', fontSize: '12.5px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {exp.highlights.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
              </>
            )}
          </div>
        )}

        {/* TAB 4: CHROME EXTENSION SETUP GUIDE */}
        {activeTab === 'extension' && (
          <>
          <div className="page-heading extension-page-heading">
            <div>
              <p className="eyebrow">LINKEDIN COPILOT</p>
              <h1>Bring Jobhunter to LinkedIn</h1>
              <p className="page-lede">Capture a role while you browse and tailor your resume without copying job links.</p>
            </div>
          </div>
          <div className="extension-workspace" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="glass-panel" style={{ padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
                <Chrome size={24} />
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 750 }}>Add Jobhunter to Chrome</h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Download it once, then load it into Chrome.</p>
                </div>
              </div>

              <section style={{ padding: '20px 0', borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.12))' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>Step 1 · Download the extension</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>Save the ZIP, then extract it to a folder you can find easily, such as Downloads.</p>
                <a
                  href="/downloads/jobhunter-chrome-extension.zip"
                  download="jobhunter-chrome-extension.zip"
                  className="btn-primary"
                  style={{ minHeight: '46px', justifyContent: 'center', textDecoration: 'none', padding: '0 18px' }}
                >
                  <Download size={16} /> Download Chrome extension (.zip)
                </a>
              </section>

              <section style={{ padding: '20px 0' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>Step 2 · Add it to Chrome</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.65 }}>
                  Chrome blocks websites from opening its internal pages. Copy the address below, paste it into Chrome’s address bar, then turn on <strong>Developer mode</strong>, choose <strong>Load unpacked</strong>, and select the extracted <strong>extension</strong> folder. Open the extension and sign in to Jobhunter.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                  <code style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', color: 'var(--text-primary, #fff)', fontSize: '13px' }}>chrome://extensions</code>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText('chrome://extensions');
                        setExtensionsLinkCopied(true);
                      } catch {
                        setExtensionsLinkCopied(false);
                      }
                    }}
                    style={{ minHeight: '46px', justifyContent: 'center', padding: '0 18px' }}
                  >
                    {extensionsLinkCopied ? <Check size={16} /> : <Copy size={16} />}
                    {extensionsLinkCopied ? 'Copied — paste in address bar' : 'Copy Chrome Extensions address'}
                  </button>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '10px' }}>If copying is blocked, select and copy the address above. After setup, visit <a href="https://www.linkedin.com/jobs" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)' }}>LinkedIn Jobs</a> to use the helper.</p>
              </section>
            </div>
          </div>
          </>
        )}
      </main>

      {/* Manual Job Modal */}
      {showAddJobModal && (
        <div className="modal-backdrop" style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div className="glass-panel job-modal" style={{ width: '100%', maxWidth: '580px', padding: '28px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: '#ffffff' }}>
              Add Job Posting Manually
            </h3>
            <form onSubmit={handleCreateJob} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Job Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Senior Backend Engineer"
                  value={newJobTitle}
                  onChange={e => setNewJobTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Company</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Stripe, Tesla"
                    value={newJobCompany}
                    onChange={e => setNewJobCompany(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '13px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Location</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Remote or Düsseldorf"
                    value={newJobLocation}
                    onChange={e => setNewJobLocation(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '13px'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Job Description</label>
                <textarea 
                  required
                  rows={6}
                  placeholder="Paste the full job requirements and description here..."
                  value={newJobDesc}
                  onChange={e => setNewJobDesc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '13px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddJobModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save & Add to Pipeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
