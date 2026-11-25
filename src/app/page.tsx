'use client';

import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  FileText,
  UserCheck,
  Chrome,
  ExternalLink,
  Sparkles,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  Layers,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  Copy,
  Check,
  Trash2
} from 'lucide-react';
import { MasterProfile, JobPosting, TailoredCV, ExperienceItem } from '@/lib/types';
import { cleanProfessionalTitle } from '@/lib/cv-tailorer';

function createEmptyProfile(): MasterProfile {
  return {
    contact: { name: '', titles: [], email: '', phone: '', location: '', github: '', linkedin: '', portfolio: '' },
    summaries: { general: '' },
    skills: { languages: [], frameworks: [], data_and_ai: [], cloud_and_devops: [], databases: [], practices: [] },
    experiences: [], projects: [], education: [], certifications: [],
    metadata: { lastUpdated: new Date().toISOString(), sourceFiles: [] }
  };
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'jobs' | 'studio' | 'profile' | 'extension'>('jobs');
  const [extensionsLinkCopied, setExtensionsLinkCopied] = useState(false);
  const [profile, setProfile] = useState<MasterProfile | null>(null);
  const [profileDraft, setProfileDraft] = useState<MasterProfile>(createEmptyProfile);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveMessage, setProfileSaveMessage] = useState('');
  const [profileEntryMode, setProfileEntryMode] = useState<'choose' | 'import' | 'manual'>('manual');
  const [profileFiles, setProfileFiles] = useState<File[]>([]);
  const [isImportingProfile, setIsImportingProfile] = useState(false);
  const [profileImportMessage, setProfileImportMessage] = useState('');
  const [aiConfigured, setAIConfigured] = useState(false);
  const [aiProvider, setAIProvider] = useState('OpenAI');
  const [aiModel, setAIModel] = useState('gpt-4o');
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [tailoredCv, setTailoredCv] = useState<TailoredCV | null>(null);
  const [isLoadingTailor, setIsLoadingTailor] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');

  // LinkedIn URL direct importer
  const [linkedinUrlInput, setLinkedinUrlInput] = useState('');
  const [isImportingUrl, setIsImportingUrl] = useState(false);

  // New Job Modal state
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newJobCompany, setNewJobCompany] = useState('');
  const [newJobLocation, setNewJobLocation] = useState('Remote');
  const [newJobDesc, setNewJobDesc] = useState('');
  const [newJobApplyType, setNewJobApplyType] = useState<'easy_apply' | 'external'>('easy_apply');

  useEffect(() => {
    fetchProfile();
    fetchJobs();
    fetchAIStatus();

    // Check URL parameters (e.g. ?cvId=... from Chrome Extension)
    const params = new URLSearchParams(window.location.search);
    const cvId = params.get('cvId');
    if (cvId) {
      loadTailoredCv(cvId);
      setActiveTab('studio');
    }
  }, []);

  async function fetchProfile() {
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setProfileDraft(data.profile);
        const hasProfileDetails = Boolean(
          data.profile.contact?.name ||
          data.profile.contact?.email ||
          data.profile.experiences?.length ||
          data.profile.projects?.length ||
          data.profile.education?.length ||
          data.profile.metadata?.sourceFiles?.length
        );
        if (!hasProfileDetails) {
          setIsEditingProfile(true);
          setProfileEntryMode('import');
        }
      } else {
        setProfile(createEmptyProfile());
        setProfileDraft(createEmptyProfile());
        setIsEditingProfile(true);
        setProfileEntryMode('import');
      }
    } catch (e) {
      console.error('Error fetching profile:', e);
    }
  }

  function updateProfileContact(field: keyof MasterProfile['contact'], value: string) {
    const updatedValue = field === 'titles' ? value.split(',').map(item => item.trim()).filter(Boolean) : value;
    setProfileDraft(current => ({ ...current, contact: { ...current.contact, [field]: updatedValue } }));
  }

  function updateProfileSkill(field: keyof MasterProfile['skills'], value: string) {
    setProfileDraft(current => ({
      ...current,
      skills: { ...current.skills, [field]: value.split(',').map(item => item.trim()).filter(Boolean) }
    }));
  }

  function updateProfileExperience(index: number, field: keyof ExperienceItem, value: string) {
    setProfileDraft(current => ({
      ...current,
      experiences: current.experiences.map((experience, itemIndex) => itemIndex === index
        ? { ...experience, [field]: field === 'highlights' ? value.split('\n').map(item => item.trim()).filter(Boolean) : field === 'keywords' ? value.split(',').map(item => item.trim()).filter(Boolean) : value }
        : experience)
    }));
  }

  function addProfileExperience() {
    setProfileDraft(current => ({
      ...current,
      experiences: [...current.experiences, {
        id: `exp-${Date.now()}`, company: '', role: '', location: '', startDate: '', endDate: '', highlights: [], keywords: []
      }]
    }));
  }

  async function saveProfileDetails() {
    setIsSavingProfile(true);
    setProfileSaveMessage('');
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileDraft)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save your profile.');
      setProfile(data.profile);
      setProfileDraft(data.profile);
      setIsEditingProfile(false);
      setProfileSaveMessage('Your career details are saved and ready to use when tailoring a CV.');
    } catch (error) {
      setProfileSaveMessage(error instanceof Error ? error.message : 'Could not save your profile.');
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function importProfileCVs() {
    if (profileFiles.length === 0) {
      setProfileImportMessage('Choose at least one CV file first.');
      return;
    }
    setIsImportingProfile(true);
    setProfileImportMessage('');
    try {
      const formData = new FormData();
      profileFiles.forEach(file => formData.append('files', file));
      const res = await fetch('/api/profile/import', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not import the CV.');
      setProfileDraft(data.profile);
      setProfileEntryMode('manual');
      setProfileImportMessage(data.usedAI
        ? `Imported ${data.filesProcessed.length} CV file(s). Review the extracted details and add anything that was missed.`
        : `Imported ${data.filesProcessed.length} CV file(s). Basic details and recognized skills were extracted. Review them, then add your work history and achievements before saving.`);
      setProfileFiles([]);
    } catch (error) {
      setProfileImportMessage(error instanceof Error ? error.message : 'Could not import the CV.');
    } finally {
      setIsImportingProfile(false);
    }
  }

  async function fetchJobs() {
    try {
      const res = await fetch('/api/jobs');
      if (res.ok) {
        const data = await res.json();
        const fetchedJobs = data.jobs || [];

        setJobs(fetchedJobs);
        if (fetchedJobs.length > 0 && !selectedJob) {
          setSelectedJob(fetchedJobs[0]);
        }
      }
    } catch (e) {
      console.error('Error fetching jobs:', e);
    }
  }

  async function fetchAIStatus() {
    try {
      const res = await fetch('/api/ai/status');
      if (!res.ok) return;
      const status = await res.json();
      setAIConfigured(Boolean(status.configured));
      setAIProvider(status.providerLabel || 'OpenAI');
      setAIModel(status.model || 'gpt-4o');
    } catch (e) {
      console.error('Error checking AI configuration:', e);
    }
  }

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.assign('/login');
  }

  async function handleTailor(job: JobPosting) {
    setSelectedJob(job);
    setIsLoadingTailor(true);
    setActiveTab('studio');

    try {
      const res = await fetch('/api/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id })
      });
      const data = await res.json();
      if (data.success && data.tailoredCv) {
        setTailoredCv(data.tailoredCv);
        fetchJobs(); // Refresh job list status
      } else {
        alert(data.error || 'Failed to tailor resume');
      }
    } catch {
      alert('Error connecting to tailoring service.');
    } finally {
      setIsLoadingTailor(false);
    }
  }

  async function loadTailoredCv(cvId: string) {
    try {
      const res = await fetch(`/api/tailor/${cvId}`);
      if (res.ok) {
        const data = await res.json();
        setTailoredCv(data.tailoredCv);
      }
    } catch (e) {
      console.error('Error loading CV:', e);
    }
  }

  async function handleImportFromUrl(e: React.FormEvent) {
    e.preventDefault();
    if (!linkedinUrlInput || !linkedinUrlInput.trim()) return;

    setIsImportingUrl(true);
    try {
      const res = await fetch('/api/jobs/from-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: linkedinUrlInput.trim(),
          autoTailor: true
        })
      });

      const data = await res.json();
      if (data.success && data.job) {
        setLinkedinUrlInput('');
        await fetchJobs();
        if (data.tailoredCv) {
          setSelectedJob(data.job);
          setTailoredCv(data.tailoredCv);
          setActiveTab('studio');
        }
      } else {
        alert(data.error || 'Failed to fetch job from LinkedIn URL.');
      }
    } catch {
      alert('Error connecting to JobHunter server.');
    } finally {
      setIsImportingUrl(false);
    }
  }

  async function handleCreateJob(e: React.FormEvent) {
    e.preventDefault();
    if (!newJobTitle || !newJobDesc) return;

    const payload = {
      title: newJobTitle,
      company: newJobCompany || 'Target Company',
      location: newJobLocation,
      description: newJobDesc,
      applyType: newJobApplyType,
      source: 'manual',
      url: '#'
    };

    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setShowAddJobModal(false);
        setNewJobTitle('');
        setNewJobCompany('');
        setNewJobDesc('');
        fetchJobs();
      }
    } catch {
      alert('Failed to save job');
    }
  }

  async function handleDeleteJob(jobId: string, e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    if (!confirm('Are you sure you want to delete this job and its tailored CV?')) return;

    try {
      const res = await fetch(`/api/jobs?id=${encodeURIComponent(jobId)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setJobs(prev => prev.filter(j => j.id !== jobId));
        if (selectedJob?.id === jobId) {
          setSelectedJob(null);
          setTailoredCv(null);
        }
      } else {
        alert('Failed to delete job');
      }
    } catch {
      alert('Error deleting job');
    }
  }

  async function handleDeleteTailoredCv(cvId: string) {
    if (!confirm('Are you sure you want to remove this tailored CV record?')) return;

    try {
      const res = await fetch(`/api/tailor/${encodeURIComponent(cvId)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setTailoredCv(null);
        await fetchJobs();
      } else {
        alert('Failed to delete tailored CV');
      }
    } catch {
      alert('Error deleting tailored CV');
    }
  }

  function handlePrintResume() {
    window.print();
  }

  function handleCopyText() {
    if (!tailoredCv) return;
    const text = `
${tailoredCv.contact.name}
${tailoredCv.targetRole}
${tailoredCv.contact.email} | ${tailoredCv.contact.phone} | ${tailoredCv.contact.location}
GitHub: ${tailoredCv.contact.github} | LinkedIn: ${tailoredCv.contact.linkedin}

PROFESSIONAL SUMMARY
${tailoredCv.professionalSummary}

CORE SKILLS
${tailoredCv.highlightedSkills.map(cat => `${cat.category}: ${cat.skills.join(', ')}`).join('\n')}

EXPERIENCE
${tailoredCv.tailoredExperiences.map(exp => `
${exp.role} — ${exp.company} (${exp.period}) | ${exp.location}
${exp.bullets.map(b => `• ${b}`).join('\n')}
`).join('\n')}

EDUCATION
${tailoredCv.education.map(edu => `${edu.degree} — ${edu.institution} (${edu.graduationYear})`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }

  const filteredJobs = jobs.filter(j =>
    j.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
    j.company.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      {/* Top Navbar */}
      <header className="topbar no-print">
        <div className="topbar-brand-nav">
          <div className="brand-lockup">
            <div className="brand-mark">
              JH
            </div>
            <div>
              <div className="brand-name">Jobhunter</div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="top-nav" aria-label="Main navigation">
            <button
              onClick={() => setActiveTab('jobs')}
              aria-pressed={activeTab === 'jobs'}
              aria-controls="main-content"
              className={`nav-button ${activeTab === 'jobs' ? 'is-active' : ''}`}
            >
              <Briefcase size={18} aria-hidden="true" /><span className="nav-label-desktop">Jobs <span className="nav-count">({jobs.length})</span></span><span className="nav-label-mobile">Jobs</span>
            </button>

            <button
              onClick={() => setActiveTab('studio')}
              aria-pressed={activeTab === 'studio'}
              aria-controls="main-content"
              className={`nav-button ${activeTab === 'studio' ? 'is-active' : ''}`}
            >
              <FileText size={18} aria-hidden="true" /><span>Resume</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              aria-pressed={activeTab === 'profile'}
              aria-controls="main-content"
              className={`nav-button ${activeTab === 'profile' ? 'is-active' : ''}`}
            >
              <UserCheck size={18} aria-hidden="true" /><span>Profile</span>
            </button>

            <button
              onClick={() => setActiveTab('extension')}
              aria-pressed={activeTab === 'extension'}
              aria-controls="main-content"
              className={`nav-button ${activeTab === 'extension' ? 'is-active' : ''}`}
            >
              <Chrome size={18} aria-hidden="true" /><span className="nav-label-desktop">Browser helper</span><span className="nav-label-mobile">Helper</span>
            </button>
          </nav>
        </div>

        {/* Profile Status Badge & Actions */}
        <div className="header-actions">
          <div className="ai-status" title={aiConfigured ? `${aiProvider} is configured for ${aiModel}; requests may still fall back if the key is invalid.` : `Configure ${aiProvider} in .env.local to enable AI. The app currently uses its built-in tailoring engine.`}>
            <span className={`ai-status-dot ${aiConfigured ? 'is-ready' : 'is-local'}`} aria-hidden="true" />
            {aiConfigured ? `${aiProvider} ready` : 'Local mode'}
          </div>
          <button className="btn-secondary signout-button" onClick={signOut}>Sign out</button>
        </div>
      </header>

      {/* Main Content Area */}
      <main id="main-content" className={`main-shell ${activeTab === 'studio' ? 'main-shell-wide' : ''}`}>
        {/* TAB 1: JOB APPLICATIONS & PIPELINE */}
        {activeTab === 'jobs' && (
          <div className="jobs-workspace">
            <div className="page-heading heading-row">
              <div>
                <h1>Your job pipeline</h1>
                <p className="page-lede">Save interesting roles, prepare a focused resume, and keep your next steps clear.</p>
              </div>
            </div>
            <div className="profile-readiness">
              <div className="readiness-copy">
                <div className="readiness-icon"><UserCheck size={18} aria-hidden="true" /></div>
                <div>
                  <strong>{profile?.contact?.name ? 'Your career profile is ready' : 'Start with your career profile'}</strong>
                  <p>{profile?.contact?.name
                    ? `${profile.experiences?.length || 0} work roles · ${profile.metadata?.sourceFiles?.length || 0} source CVs saved · Review your details before tailoring.`
                    : 'Upload your CV or add your experience once. Jobhunter will use it as the source for every tailored resume.'}</p>
                </div>
              </div>
              <div className="readiness-actions">
                <button className="btn-secondary" onClick={() => setActiveTab('profile')}>
                  {profile?.contact?.name ? 'Review profile' : 'Set up profile'} <ChevronRight size={15} />
                </button>
                <button className="btn-ghost" onClick={() => setShowAddJobModal(true)}><Plus size={15} /> Add job manually</button>
              </div>
            </div>
            {/* Metric Banner */}
            <div className="metrics-strip" aria-label="Job search overview">
              <div className="metric-card">
                <div className="metric-label">Roles saved</div>
                <div className="metric-value">{jobs.length}</div>
                <div className="metric-note">Across your search</div>
              </div>

              <div className="metric-card">
                <div className="metric-label">Resumes tailored</div>
                <div className="metric-value">
                  {jobs.filter(j => j.tailoredCvId || j.status === 'tailored').length}
                </div>
                <div className="metric-note">Ready to review</div>
              </div>

              <div className="metric-card">
                <div className="metric-label">LinkedIn Easy Apply</div>
                <div className="metric-value">
                  {jobs.filter(j => j.applyType === 'easy_apply').length}
                </div>
                <div className="metric-note">Roles in your pipeline</div>
              </div>

              <div className="metric-card">
                <div className="metric-label">Source resumes</div>
                <div className="metric-value">{profile?.metadata?.sourceFiles?.length || 0}</div>
                <div className="metric-note">In your career profile</div>
              </div>
            </div>

            {/* Quick Import from LinkedIn URL Banner */}
            <section className="glass-panel import-panel" aria-labelledby="job-import-heading">
              <div className="import-panel-heading">
                <div>
                    <h2 id="job-import-heading">
                      Start with a job you’re interested in
                    </h2>
                    <p>
                      Paste a LinkedIn job link. Jobhunter will save the role and prepare a resume for you to review.
                    </p>
                </div>
              </div>

              <form className="linkedin-import-form" onSubmit={handleImportFromUrl}>
                <div className="field-stack">
                  <label htmlFor="linkedin-job-url">LinkedIn job URL</label>
                  <input
                    id="linkedin-job-url"
                    type="url"
                    required
                    placeholder="Paste a LinkedIn job link"
                    value={linkedinUrlInput}
                    onChange={e => setLinkedinUrlInput(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isImportingUrl}
                  className="btn-primary"
                >
                  <Sparkles size={16} /> {isImportingUrl ? 'Saving & tailoring…' : 'Save and tailor'}
                </button>
              </form>
            </section>

            {/* Filter & Search Bar */}
            <div className="job-tools">
              <div className="search-field">
                <label htmlFor="application-search">Find a role</label>
                <Search className="search-icon" size={18} aria-hidden="true" />
                <input
                  id="application-search"
                  type="text"
                  placeholder="Search by title or company"
                  value={filterQuery}
                  onChange={e => setFilterQuery(e.target.value)}
                />
              </div>

              <div className="job-tools-hint">
                Browse jobs on LinkedIn, then save a role from the browser helper.
              </div>
            </div>

            {/* Job Cards Grid */}
            <div className="job-grid">
              {filteredJobs.map(job => (
                <article key={job.id} className="glass-panel job-card">
                  <div>
                    <div className="job-card-header">
                      <div>
                        <h3>
                          {job.title}
                        </h3>
                        <div className="job-card-company">
                          {job.company} • {job.location}
                        </div>
                      </div>

                      <div className="job-card-meta">
                        <span className={`badge ${job.applyType === 'easy_apply' ? 'badge-emerald' : 'badge-blue'}`}>
                          {job.applyType === 'easy_apply' ? 'Easy Apply' : 'External link'}
                        </span>
                        {job.matchScore && (
                          <span className="job-match-score">
                            {job.matchScore}% Match
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="job-description">
                      {job.description}
                    </p>
                  </div>

                  <div className="job-card-footer">
                    <span className="job-card-date">
                      Added {new Date(job.extractedAt).toLocaleDateString()}
                    </span>

                    <div className="job-card-actions">
                      {job.url && job.url !== '#' && (
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-icon"
                          title="Open on LinkedIn"
                          aria-label={`Open ${job.title} at ${job.company} on LinkedIn`}
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}

                      <button
                        onClick={() => handleTailor(job)}
                        className="btn-secondary"
                      >
                        <Sparkles size={14} /> {job.tailoredCvId ? 'View resume' : 'Tailor resume'}
                      </button>

                      <button
                        onClick={(e) => handleDeleteJob(job.id, e)}
                        className="btn-danger"
                        title="Remove job from pipeline"
                        aria-label={`Remove ${job.title} at ${job.company}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
              {filteredJobs.length === 0 && (
                <div className="glass-panel job-empty-state">
                  <Briefcase className="job-empty-icon" size={22} aria-hidden="true" />
                  <h2 className="job-empty-title">
                    {filterQuery ? 'No roles match that search' : 'Your pipeline is ready for its first role'}
                  </h2>
                  <p className="job-empty-copy">
                    {filterQuery ? 'Try a different title or company name.' : 'Paste a LinkedIn job URL above, or use Add job manually in the career profile panel.'}
                  </p>
                  {!filterQuery && <div className="empty-state-actions"><a className="btn-secondary" href="https://www.linkedin.com/jobs/" target="_blank" rel="noreferrer"><ExternalLink size={15} /> Browse LinkedIn jobs</a></div>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: TAILORED CV STUDIO */}
        {activeTab === 'studio' && (
          <>
          <div className="page-heading studio-page-heading">
            <div>
              <h1>Resume studio</h1>
              <p className="page-lede">{selectedJob ? `Review the resume tailored for ${selectedJob.title} at ${selectedJob.company}.` : 'Choose a saved job to create and review a role-specific resume.'}</p>
            </div>
            {selectedJob && <span className="badge">{selectedJob.company}</span>}
          </div>
          <div className="studio-grid resume-inline-001" >
            {/* Left Controls & Analysis Panel */}
            <div className="no-print studio-controls resume-inline-002" >
              <div className="glass-panel resume-inline-003" >
                <h3 className="resume-inline-004">
                  <ShieldCheck size={18} className="resume-heading-icon" /> ATS Alignment & Optimization
                </h3>

                {selectedJob ? (
                  <div className="resume-inline-005">
                    <div className="resume-inline-006">Tailoring for</div>
                    <div className="resume-inline-007">{selectedJob.title}</div>
                    <div className="resume-inline-008">{selectedJob.company}</div>
                  </div>
                ) : (
                  <div className="resume-inline-009">
                    Select a job from your pipeline to generate and review your tailored CV.
                  </div>
                )}

                {/* Match Score Display */}
                <div className="resume-inline-010">
                  <div>
                    <div className="resume-inline-011">Resume match</div>
                    <div className="resume-inline-012">
                      {tailoredCv ? `${tailoredCv.matchScore}%` : '—'}
                    </div>
                  </div>
                  <div className="resume-inline-013">
                    ATS-friendly single-column layout
                  </div>
                </div>

                {tailoredCv?.rationale && (
                  <div className="resume-inline-014">
                    <strong className="resume-inline-015">Tailoring notes:</strong> {tailoredCv.rationale}
                  </div>
                )}

                {/* Actions */}
                <div className="resume-inline-016">
                  <button
                    onClick={handlePrintResume}
                    className="btn-primary resume-inline-017"

                  >
                    <Printer size={16} /> Print / Save as PDF
                  </button>

                  <button
                    onClick={handleCopyText}
                    className="btn-secondary resume-inline-018"

                  >
                    {isCopied ? <Check size={16} color="var(--color-success)" /> : <Copy size={16} />}
                    {isCopied ? 'Resume copied' : 'Copy resume text'}
                  </button>

                  {selectedJob && (
                    <button
                      onClick={() => handleTailor(selectedJob)}
                      disabled={isLoadingTailor}
                      className="btn-secondary resume-inline-019"

                    >
                      <RefreshCw size={16} className={isLoadingTailor ? 'animate-spin' : ''} />
                      {isLoadingTailor ? 'Updating resume…' : 'Tailor again'}
                    </button>
                  )}

                  {tailoredCv && (
                    <button
                      onClick={() => handleDeleteTailoredCv(tailoredCv.id)}
                      className="btn-danger resume-inline-020"

                    >
                      <Trash2 size={15} /> Remove tailored resume
                    </button>
                  )}
                </div>
              </div>

              {/* Keyword Breakdown Card */}
              {tailoredCv && (
                <div className="glass-panel resume-inline-021" >
                  <h4 className="resume-inline-022">
                    Highlighted Keywords
                  </h4>
                  <div className="resume-inline-023">
                    {tailoredCv.highlightedSkills.flatMap(c => c.skills).map((skill, idx) => (
                      <span key={idx} className="badge badge-emerald resume-inline-024" >
                        ✓ {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: The Clean ATS Resume Document Sheet */}
            <div className="resume-paper print-resume-sheet resume-inline-025" >
              {isLoadingTailor ? (
                <div className="resume-inline-026">
                  <div className="jh-spinner resume-inline-027" ></div>
                  <div className="resume-inline-028">Preparing your profile and tailoring the resume…</div>
                </div>
              ) : tailoredCv ? (
                <div>
                  {/* Header / Contact */}
                  <div className="resume-inline-029">
                    <h1 className="resume-inline-030">
                      {tailoredCv.contact.name}
                    </h1>
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      title="Click to edit headline"
                      className="resume-inline-031"
                    >
                      {cleanProfessionalTitle(tailoredCv.targetRole, tailoredCv.company)}
                    </div>
                    <div className="resume-inline-032">
                      <span>{tailoredCv.contact.location}</span>
                      <span>•</span>
                      <span>{tailoredCv.contact.phone}</span>
                      <span>•</span>
                      <span>{tailoredCv.contact.email}</span>
                      <span>•</span>
                      <span>{tailoredCv.contact.github}</span>
                    </div>
                  </div>

                  {/* Professional Summary */}
                  <div className="resume-inline-033">
                    <h2 className="resume-inline-034">
                      Professional Summary
                    </h2>
                    <p
                      contentEditable
                      suppressContentEditableWarning
                      className="resume-inline-035"
                    >
                      {tailoredCv.professionalSummary}
                    </p>
                  </div>

                  {/* Core Technical Competencies */}
                  <div className="resume-inline-036">
                    <h2 className="resume-inline-037">
                      Technical Skills & Competencies
                    </h2>
                    <div className="resume-inline-038">
                      {tailoredCv.highlightedSkills.map((cat, idx) => (
                        <div key={idx}>
                          <strong className="resume-inline-039">{cat.category}: </strong>
                          <span
                            contentEditable
                            suppressContentEditableWarning
                            className="resume-inline-040"
                          >
                            {cat.skills.join(', ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Professional Experience */}
                  <div className="resume-inline-041">
                    <h2 className="resume-inline-042">
                      Professional Experience
                    </h2>
                    <div className="resume-inline-043">
                      {tailoredCv.tailoredExperiences.map((exp, idx) => (
                        <div key={idx}>
                          <div className="resume-inline-044">
                            <span className="resume-inline-045">
                              {exp.company}
                            </span>
                            <span className="resume-inline-046">
                              {exp.period} | {exp.location}
                            </span>
                          </div>
                          <div className="resume-inline-047">
                            {exp.role}
                          </div>
                          <ul className="resume-inline-048">
                            {exp.bullets.map((bullet, bIdx) => (
                              <li key={bIdx} className="resume-inline-049">
                                {bullet}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Education */}
                  <div className="resume-inline-050">
                    <h2 className="resume-inline-051">
                      Education
                    </h2>
                    {tailoredCv.education.map((edu, idx) => (
                      <div
                        key={idx}
                        contentEditable
                        suppressContentEditableWarning
                        className="resume-inline-052"
                      >
                        <div>
                          <strong>{edu.degree}</strong> — {edu.institution}
                        </div>
                        <div className="resume-inline-053">
                          {edu.graduationYear} | {edu.location}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Certifications */}
                  {tailoredCv.certifications && tailoredCv.certifications.length > 0 && (
                    <div>
                      <h2 className="resume-inline-054">
                        Certifications & Professional Development
                      </h2>
                      <div className="resume-inline-055">
                        {tailoredCv.certifications.map(c => `${c.name} (${c.issuer})`).join(' • ')}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="resume-inline-056">
                  <FileText size={48} className="resume-inline-057" />
                  <h3 className="resume-inline-058">No tailored resume yet</h3>
                  <p className="resume-inline-059">
                    Save a role first, then Jobhunter can shape your experience into a resume focused on that opportunity.
                  </p>
                  {selectedJob ? (
                    <button onClick={() => handleTailor(selectedJob)} className="btn-primary">
                      <Sparkles size={16} /> Tailor for {selectedJob.title}
                    </button>
                  ) : (
                    <button onClick={() => setActiveTab('jobs')} className="btn-secondary"><Briefcase size={15} /> Browse saved roles</button>
                  )}
                </div>
              )}
            </div>
          </div>
          </>
        )}

        {/* TAB 3: MASTER PROFILE HUB */}
        {activeTab === 'profile' && profile && (
          <div className="profile-workspace">
            <div className="page-heading profile-page-heading">
              <div>
                <h1>Career profile</h1>
                <p className="page-lede">Keep your experience accurate and up to date. Every tailored resume starts here.</p>
              </div>
            </div>
            {isEditingProfile && (
              <section className="glass-panel profile-editor-panel profile-inline-001" >
                <div className="profile-inline-002">
                  <div>
                    <h2 className="profile-inline-003">Your career details</h2>
                    <p className="profile-inline-004">
                      Add accurate details about your experience and skills. The tailoring tool will use this information to prepare a role-specific resume.
                    </p>
                  </div>
                  {profile.contact.name && (
                    <button className="btn-secondary" onClick={() => { setProfileDraft(profile); setIsEditingProfile(false); setProfileSaveMessage(''); }}>
                      Cancel
                    </button>
                  )}
                </div>

                <div role="group" aria-label="Choose how to add your profile" className="profile-inline-005">
                  <button type="button" aria-pressed={profileEntryMode === 'import'} onClick={() => { setProfileEntryMode('import'); setProfileImportMessage(''); }} className="profile-mode-option">
                    <strong className="profile-inline-006">Import an existing CV</strong><span className="profile-inline-007">Upload PDF, DOCX, or TXT</span>
                  </button>
                  <button type="button" aria-pressed={profileEntryMode === 'manual'} onClick={() => { setProfileEntryMode('manual'); setProfileImportMessage(''); }} className="profile-mode-option">
                    <strong className="profile-inline-008">Enter details manually</strong><span className="profile-inline-009">Add your information one section at a time</span>
                  </button>
                </div>

                {profileEntryMode === 'import' ? (
                  <div className="profile-inline-010">
                    <h3 className="profile-inline-011">Import your resume</h3>
                    <p className="profile-inline-012">Choose one or more files. You’ll be able to review and correct the extracted information before saving it to your profile.</p>
                    <div className="profile-field-label">CV files (PDF, DOCX, TXT)
                      <label className="profile-file-picker">
                        <FileText size={17} aria-hidden="true" />
                        <span>Choose file{profileFiles.length === 1 ? '' : 's'}</span>
                        <input className="profile-file-input" type="file" accept=".pdf,.docx,.txt,application/pdf,text/plain" multiple onChange={e => setProfileFiles(Array.from(e.target.files || []))} />
                      </label>
                    </div>
                    <p className={`profile-file-status${profileFiles.length ? ' is-selected' : ''}`} aria-live="polite">
                      {profileFiles.length > 0 ? <><CheckCircle2 size={16} aria-hidden="true" /> {profileFiles.length} file{profileFiles.length === 1 ? '' : 's'} selected: {profileFiles.map(file => file.name).join(', ')}</> : 'No files selected · PDF, DOCX, or TXT'}
                    </p>
                    <p className="profile-inline-014">When an OpenAI API key is configured, the CV text is sent to OpenAI for extraction. Without a key, basic details are extracted locally and you can complete the profile manually.</p>
                    <button className="btn-primary profile-inline-015"  onClick={importProfileCVs} disabled={isImportingProfile || profileFiles.length === 0}>
                      {isImportingProfile ? <><RefreshCw size={15} className="spin" /> Importing...</> : <><FileText size={15} /> Import and review</>}
                    </button>
                    {profileImportMessage && <p role="status" className="profile-feedback profile-feedback-spaced">{profileImportMessage}</p>}
                  </div>
                ) : (
                  <>
                {profileImportMessage && <p role="status" className="profile-inline-016">{profileImportMessage}</p>}
                <div className="profile-inline-017">
                  <label className="profile-field-label">Full name<input className="profile-field-input" value={profileDraft.contact.name} onChange={e => updateProfileContact('name', e.target.value)} placeholder="Your name" /></label>
                  <label className="profile-field-label">Professional titles<input className="profile-field-input" value={profileDraft.contact.titles.join(', ')} onChange={e => updateProfileContact('titles', e.target.value)} placeholder="e.g. Product Designer, UX Researcher" /></label>
                  <label className="profile-field-label">Email<input className="profile-field-input" type="email" value={profileDraft.contact.email} onChange={e => updateProfileContact('email', e.target.value)} placeholder="you@example.com" /></label>
                  <label className="profile-field-label">Phone<input className="profile-field-input" value={profileDraft.contact.phone} onChange={e => updateProfileContact('phone', e.target.value)} placeholder="Phone number" /></label>
                  <label className="profile-field-label">Location<input className="profile-field-input" value={profileDraft.contact.location} onChange={e => updateProfileContact('location', e.target.value)} placeholder="City, Country" /></label>
                  <label className="profile-field-label">LinkedIn<input className="profile-field-input" value={profileDraft.contact.linkedin || ''} onChange={e => updateProfileContact('linkedin', e.target.value)} placeholder="LinkedIn URL" /></label>
                  <label className="profile-field-label">Portfolio or website<input className="profile-field-input" value={profileDraft.contact.portfolio || ''} onChange={e => updateProfileContact('portfolio', e.target.value)} placeholder="Website URL" /></label>
                  <label className="profile-field-label">GitHub<input className="profile-field-input" value={profileDraft.contact.github || ''} onChange={e => updateProfileContact('github', e.target.value)} placeholder="GitHub URL" /></label>
                </div>

                <label className="profile-field-label profile-field-spaced">Professional summary
                  <textarea className="profile-field-input profile-field-spaced profile-summary-input" value={profileDraft.summaries.general || ''} onChange={e => setProfileDraft(current => ({ ...current, summaries: { ...current.summaries, general: e.target.value } }))} placeholder="Summarize your experience, strengths, and the work you do." />
                </label>

                <h3 className="profile-inline-018">Skills</h3>
                <p className="profile-inline-019">Separate skills with commas. Include only skills you can support with real experience.</p>
                <div className="profile-inline-020">
                  {([
                    ['languages', 'Languages / core skills'], ['frameworks', 'Tools / frameworks'], ['data_and_ai', 'Data / AI'],
                    ['cloud_and_devops', 'Cloud / operations'], ['databases', 'Databases'], ['practices', 'Methods / practices']
                  ] as [keyof MasterProfile['skills'], string][]).map(([key, label]) => (
                    <label key={key} className="profile-field-label">{label}<input className="profile-field-input" value={profileDraft.skills[key].join(', ')} onChange={e => updateProfileSkill(key, e.target.value)} placeholder="Add comma-separated skills" /></label>
                  ))}
                </div>

                <div className="profile-inline-021">
                  <div>
                    <h3 className="profile-inline-022">Work experience</h3>
                    <p className="profile-inline-023">Add the roles and achievements you want considered for tailored resumes.</p>
                  </div>
                  <button className="btn-secondary" onClick={addProfileExperience}><Plus size={15} /> Add role</button>
                </div>
                {profileDraft.experiences.map((experience, index) => (
                  <div key={experience.id} className="profile-inline-024">
                    <div className="profile-inline-025">
                      {([['role', 'Job title'], ['company', 'Company'], ['location', 'Location'], ['startDate', 'Start date'], ['endDate', 'End date']] as [keyof ExperienceItem, string][]).map(([key, label]) => (
                        <label key={key} className="profile-field-label">{label}<input className="profile-field-input" value={experience[key] as string} onChange={e => updateProfileExperience(index, key, e.target.value)} placeholder={label} /></label>
                      ))}
                    </div>
                    <label className="profile-field-label profile-field-spaced">Achievements (one per line)
                      <textarea className="profile-field-input profile-field-spaced profile-summary-input" value={experience.highlights.join('\n')} onChange={e => updateProfileExperience(index, 'highlights', e.target.value)} placeholder="Describe what you did and the results you achieved." />
                    </label>
                    <label className="profile-field-label profile-field-spaced">Relevant skills (comma-separated)
                      <input className="profile-field-input" value={experience.keywords.join(', ')} onChange={e => updateProfileExperience(index, 'keywords', e.target.value)} placeholder="Skills and tools used in this role" />
                    </label>
                    <button className="btn-danger profile-inline-026"  onClick={() => setProfileDraft(current => ({ ...current, experiences: current.experiences.filter((_, itemIndex) => itemIndex !== index) }))}><Trash2 size={14} /> Remove role</button>
                  </div>
                ))}
                {profileDraft.experiences.length === 0 && <p className="profile-inline-027">No roles added yet. Add at least one role for better tailoring.</p>}

                <div className="profile-inline-028">
                  <button className="btn-primary" onClick={saveProfileDetails} disabled={isSavingProfile || !profileDraft.contact.name.trim()}>
                    {isSavingProfile ? <><RefreshCw size={15} className="spin" /> Saving...</> : <><CheckCircle2 size={15} /> Save career details</>}
                  </button>
                  {!profileDraft.contact.name.trim() && <span className="profile-inline-029">Enter your name to save.</span>}
                  {profileSaveMessage && <span role="status" className="profile-feedback">{profileSaveMessage}</span>}
                </div>
                  </>
                )}
              </section>
            )}

            {!isEditingProfile && profile.contact.name && (
              <>
                <div className="profile-inline-030">
                  <button className="btn-primary" onClick={() => { setProfileDraft(profile); setIsEditingProfile(true); setProfileSaveMessage(''); }}><UserCheck size={15} /> Edit career details</button>
                </div>
                {profileSaveMessage && <p role="status" className="profile-inline-031">{profileSaveMessage}</p>}
            {/* Header info */}
            <div className="glass-panel profile-overview profile-inline-032" >
              <div>
                <h2 className="profile-inline-033">
                  {profile.contact.name}
                </h2>
                <div className="profile-inline-034">
                  {profile.contact.titles.join(' • ')}
                </div>
                <div className="profile-inline-035">
                  {profile.contact.location && <span>{profile.contact.location}</span>}
                  {profile.contact.phone && <a href={`tel:${profile.contact.phone}`}>{profile.contact.phone}</a>}
                  {profile.contact.email && <a href={`mailto:${profile.contact.email}`}>{profile.contact.email}</a>}
                  {profile.contact.github && <a href={profile.contact.github} target="_blank" rel="noreferrer">GitHub ↗</a>}
                </div>
              </div>

              <div className="profile-inline-036">
                <span className="badge badge-emerald profile-inline-037" >
                  {profile.metadata.sourceFiles.length} CV{profile.metadata.sourceFiles.length === 1 ? '' : 's'} saved
                </span>
                <div className="profile-inline-038">
                  Used when tailoring your resume
                </div>
              </div>
            </div>

            {/* Categorized Skills */}
            <div className="glass-panel profile-inline-039" >
              <h3 className="profile-inline-040">
                <Layers size={18} /> Skills
              </h3>
              <div className="profile-inline-041">
                <div>
                  <h4 className="profile-inline-042">Languages</h4>
                  <div className="profile-inline-043">
                    {profile.skills.languages.map((s, i) => <span key={i} className="badge badge-blue">{s}</span>)}
                  </div>
                </div>

                <div>
                  <h4 className="profile-inline-044">Frameworks & Libraries</h4>
                  <div className="profile-inline-045">
                    {profile.skills.frameworks.map((s, i) => <span key={i} className="badge badge-purple">{s}</span>)}
                  </div>
                </div>

                <div>
                  <h4 className="profile-inline-046">Data & AI Infrastructure</h4>
                  <div className="profile-inline-047">
                    {profile.skills.data_and_ai.map((s, i) => <span key={i} className="badge badge-emerald">{s}</span>)}
                  </div>
                </div>

                <div>
                  <h4 className="profile-inline-048">Cloud & DevOps</h4>
                  <div className="profile-inline-049">
                    {profile.skills.cloud_and_devops.map((s, i) => <span key={i} className="badge badge-amber">{s}</span>)}
                  </div>
                </div>
              </div>
            </div>

            {/* Work History Timeline */}
            <div className="glass-panel profile-inline-050" >
              <h3 className="profile-inline-051">
                <Briefcase size={18} /> Work experience ({profile.experiences.length})
              </h3>
              <div className="profile-inline-052">
                {profile.experiences.map(exp => (
                  <div key={exp.id} className="profile-inline-053">
                    <div className="profile-inline-054">
                      <strong className="profile-inline-055">{exp.role} — {exp.company}</strong>
                      <span className="profile-inline-056">{exp.startDate} – {exp.endDate} | {exp.location}</span>
                    </div>
                    <ul className="profile-inline-057">
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
              <h1>Bring Jobhunter to LinkedIn</h1>
              <p className="page-lede">Capture a role while you browse and tailor your resume without copying job links.</p>
            </div>
          </div>
          <div className="extension-workspace extension-inline-001" >
            <div className="glass-panel extension-inline-002" >
              <div className="extension-inline-003">
                <Chrome size={24} />
                <div>
                  <h2 className="extension-inline-004">Add Jobhunter to Chrome</h2>
                  <p className="extension-inline-005">Download it once, then load it into Chrome.</p>
                </div>
              </div>

              <section className="extension-inline-006">
                <h3 className="extension-inline-007">Step 1 · Download the extension</h3>
                <p className="extension-inline-008">Save the ZIP, then extract it to a folder you can find easily, such as Downloads.</p>
                <a
                  href="/downloads/jobhunter-chrome-extension.zip"
                  download="jobhunter-chrome-extension.zip"
                  className="btn-primary extension-inline-009"

                >
                  <Download size={16} /> Download Chrome extension (.zip)
                </a>
              </section>

              <section className="extension-inline-010">
                <h3 className="extension-inline-011">Step 2 · Add it to Chrome</h3>
                <p className="extension-inline-012">
                  Chrome blocks websites from opening its internal pages. Copy the address below, paste it into Chrome’s address bar, then turn on <strong>Developer mode</strong>, choose <strong>Load unpacked</strong>, and select the extracted <strong>extension</strong> folder. Open the extension and sign in to Jobhunter.
                </p>
                <div className="extension-inline-013">
                  <code className="extension-inline-014">chrome://extensions</code>
                  <button
                    type="button"
                    className="btn-primary extension-inline-015"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText('chrome://extensions');
                        setExtensionsLinkCopied(true);
                      } catch {
                        setExtensionsLinkCopied(false);
                      }
                    }}

                  >
                    {extensionsLinkCopied ? <Check size={16} /> : <Copy size={16} />}
                    {extensionsLinkCopied ? 'Copied — paste in address bar' : 'Copy Chrome Extensions address'}
                  </button>
                </div>
                <p className="extension-inline-016">If copying is blocked, select and copy the address above. After setup, visit <a href="https://www.linkedin.com/jobs" target="_blank" rel="noreferrer" className="extension-inline-017">LinkedIn Jobs</a> to use the helper.</p>
              </section>
            </div>
          </div>
          </>
        )}
      </main>

      {/* Manual Job Modal */}
      {showAddJobModal && (
        <div className="modal-backdrop modal-inline-001" >
          <div className="glass-panel job-modal modal-inline-002" >
            <h3 className="modal-inline-003">
              Add Job Posting Manually
            </h3>
            <form onSubmit={handleCreateJob} className="modal-inline-004">
              <div>
                <label className="modal-inline-005">Job Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Backend Engineer"
                  value={newJobTitle}
                  onChange={e => setNewJobTitle(e.target.value)}
                  className="modal-inline-006"
                />
              </div>

              <div className="modal-inline-007">
                <div>
                  <label className="modal-inline-008">Company</label>
                  <input
                    type="text"
                    placeholder="e.g. Stripe, Tesla"
                    value={newJobCompany}
                    onChange={e => setNewJobCompany(e.target.value)}
                    className="modal-inline-009"
                  />
                </div>
                <div>
                  <label className="modal-inline-010">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Remote or Düsseldorf"
                    value={newJobLocation}
                    onChange={e => setNewJobLocation(e.target.value)}
                    className="modal-inline-011"
                  />
                </div>
              </div>

              <div>
                <label className="modal-inline-012">Job Description</label>
                <textarea
                  required
                  rows={6}
                  placeholder="Paste the full job requirements and description here..."
                  value={newJobDesc}
                  onChange={e => setNewJobDesc(e.target.value)}
                  className="modal-inline-013"
                />
              </div>

              <div className="modal-inline-014">
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


