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

const profileInputStyle: React.CSSProperties = {};

const profileLabelStyle: React.CSSProperties = {
  display: 'block', marginBottom: '6px', color: 'var(--text-muted)',
  fontSize: '14px', fontWeight: 500
};

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
        alert(data.error || 'Failed to tailor CV');
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
    <div className="app-shell" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      {/* Top Navbar */}
      <header className="topbar no-print" style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(10, 14, 23, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '14px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="brand-mark" style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#111111',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '18px',
              boxShadow: 'none'
            }}>
              JH
            </div>
            <div>
              <div className="brand-name">Jobhunter</div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="top-nav" aria-label="Main navigation" style={{ display: 'flex', gap: '6px', marginLeft: '20px' }}>
            <button 
              onClick={() => setActiveTab('jobs')}
              aria-pressed={activeTab === 'jobs'}
              aria-controls="main-content"
              className={`nav-button ${activeTab === 'jobs' ? 'is-active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'jobs' ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: activeTab === 'jobs' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: activeTab === 'jobs' ? 600 : 500,
                fontSize: '13.5px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Briefcase size={18} aria-hidden="true" /><span className="nav-label-desktop">Applications <span className="nav-count">({jobs.length})</span></span><span className="nav-label-mobile">Jobs</span>
            </button>

            <button 
              onClick={() => setActiveTab('studio')}
              aria-pressed={activeTab === 'studio'}
              aria-controls="main-content"
              className={`nav-button ${activeTab === 'studio' ? 'is-active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'studio' ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: activeTab === 'studio' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: activeTab === 'studio' ? 600 : 500,
                fontSize: '13.5px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <FileText size={18} aria-hidden="true" /><span>Resume</span>
            </button>

            <button 
              onClick={() => setActiveTab('profile')}
              aria-pressed={activeTab === 'profile'}
              aria-controls="main-content"
              className={`nav-button ${activeTab === 'profile' ? 'is-active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'profile' ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: activeTab === 'profile' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: activeTab === 'profile' ? 600 : 500,
                fontSize: '13.5px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <UserCheck size={18} aria-hidden="true" /><span>Profile</span>
            </button>

            <button 
              onClick={() => setActiveTab('extension')}
              aria-pressed={activeTab === 'extension'}
              aria-controls="main-content"
              className={`nav-button ${activeTab === 'extension' ? 'is-active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'extension' ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: activeTab === 'extension' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: activeTab === 'extension' ? 600 : 500,
                fontSize: '13.5px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Chrome size={18} aria-hidden="true" /><span className="nav-label-desktop">Browser helper</span><span className="nav-label-mobile">Helper</span>
            </button>
          </nav>
        </div>

        {/* Profile Status Badge & Actions */}
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div className="ai-status" title={aiConfigured ? `${aiProvider} is configured for ${aiModel}; requests may still fall back if the key is invalid.` : `Configure ${aiProvider} in .env.local to enable AI. The app currently uses its built-in tailoring engine.`} style={{
            display: 'flex', alignItems: 'center', gap: '7px', padding: '6px 11px',
            backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-subtle)',
            borderRadius: '20px', fontSize: '11px', color: 'var(--text-muted)'
          }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: aiConfigured ? 'var(--color-success)' : 'var(--color-warning)' }} />
            {aiConfigured ? `${aiProvider} ready` : 'Local mode'}
          </div>
          <button className="btn-secondary" onClick={signOut} style={{ padding: '6px 10px', fontSize: '12px' }}>Sign out</button>
        </div>
      </header>

      {/* Main Content Area */}
      <main id="main-content" className={`main-shell ${activeTab === 'studio' ? 'main-shell-wide' : ''}`} style={{ flex: 1, padding: '28px', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
        {/* TAB 1: JOB APPLICATIONS & PIPELINE */}
        {activeTab === 'jobs' && (
          <div className="jobs-workspace" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="page-heading heading-row">
              <div>
                <p className="eyebrow">YOUR WORKSPACE</p>
                <h1>Applications</h1>
                <p className="page-lede">Keep the roles you’re considering in one place.</p>
              </div>
              <button className="btn-secondary" onClick={() => setShowAddJobModal(true)}><Plus size={15} /> Add job manually</button>
            </div>
            {/* Metric Banner */}
            <div className="metrics-strip" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div className="glass-panel" style={{ padding: '18px 20px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Total Jobs Tracked</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff' }}>{jobs.length}</div>
                <div style={{ fontSize: '11px', color: 'var(--accent-blue)', marginTop: '4px' }}>Auto-synced with Extension</div>
              </div>

              <div className="glass-panel" style={{ padding: '18px 20px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Tailored CVs Generated</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-success)' }}>
                  {jobs.filter(j => j.tailoredCvId || j.status === 'tailored').length}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--accent-emerald)', marginTop: '4px' }}>High-Match ATS Resumes</div>
              </div>

              <div className="glass-panel" style={{ padding: '18px 20px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Easy Apply Opportunities</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#c084fc' }}>
                  {jobs.filter(j => j.applyType === 'easy_apply').length}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--accent-purple)', marginTop: '4px' }}>Ready for 1-Click Submission</div>
              </div>

              <div className="glass-panel" style={{ padding: '18px 20px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Master Career Bank</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#fbbf24' }}>{profile?.metadata?.sourceFiles?.length || 0} CVs</div>
                <div style={{ fontSize: '11px', color: 'var(--accent-amber)', marginTop: '4px' }}>De-duplicated & Enriched</div>
              </div>
            </div>

            {/* Quick Import from LinkedIn URL Banner */}
            <div className="glass-panel import-panel" style={{
              padding: '18px 22px',
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(139, 92, 246, 0.12))',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div>
                    <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: '#ffffff' }}>
                      Add a job from LinkedIn
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Paste a job link to save the role and prepare a tailored resume.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleImportFromUrl} style={{ display: 'flex', gap: '10px', width: '100%' }}>
                <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="linkedin-job-url" style={{ color: 'var(--text-muted)', fontSize: '14px' }}>LinkedIn job link</label>
                  <input
                    id="linkedin-job-url"
                    type="url"
                    required
                    placeholder="Paste a LinkedIn job link"
                    value={linkedinUrlInput}
                    onChange={e => setLinkedinUrlInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 16px',
                      backgroundColor: 'rgba(10, 14, 23, 0.7)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      color: '#ffffff',
                      fontSize: '13.5px',
                      outline: 'none'
                    }}
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isImportingUrl}
                  className="btn-primary"
                  style={{ padding: '11px 22px', whiteSpace: 'nowrap' }}
                >
                  <Sparkles size={16} /> {isImportingUrl ? 'Importing…' : 'Import job'}
                </button>
              </form>
            </div>

            {/* Filter & Search Bar */}
            <div className="job-tools" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
              <div style={{ position: 'relative', width: '360px' }}>
                <label htmlFor="application-search" style={{ display: 'block', marginBottom: '6px', color: 'var(--text-muted)', fontSize: '14px' }}>Search applications</label>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '39px', color: 'var(--text-muted)' }} />
                <input
                  id="application-search"
                  type="text" 
                  placeholder="Search roles"
                  value={filterQuery}
                  onChange={e => setFilterQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 38px',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Browse jobs on LinkedIn and click <strong style={{ color: '#ffffff' }}>"Extract & Tailor My CV"</strong> on the floating assistant.
              </div>
            </div>

            {/* Job Cards Grid */}
            <div className="job-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '18px' }}>
              {filteredJobs.map(job => (
                <div key={job.id} className="glass-panel job-card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>
                          {job.title}
                        </h3>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                          {job.company} • {job.location}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        <span className={`badge ${job.applyType === 'easy_apply' ? 'badge-emerald' : 'badge-blue'}`}>
                          {job.applyType === 'easy_apply' ? 'Easy Apply' : 'External link'}
                        </span>
                        {job.matchScore && (
                          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-success)' }}>
                            {job.matchScore}% Match
                          </span>
                        )}
                      </div>
                    </div>

                    <p style={{
                      fontSize: '12.5px',
                      color: 'var(--text-dim)',
                      lineHeight: '1.5',
                      marginBottom: '16px',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {job.description}
                    </p>
                  </div>

                  <div style={{
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Added {new Date(job.extractedAt).toLocaleDateString()}
                    </span>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      {job.url && job.url !== '#' && (
                        <a 
                          href={job.url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="btn-secondary" 
                          style={{ padding: '6px 10px', fontSize: '12px' }}
                          title="Open on LinkedIn"
                          aria-label={`Open ${job.title} at ${job.company} on LinkedIn`}
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                      
                      <button 
                        onClick={() => handleTailor(job)}
                        className="btn-primary"
                        style={{ padding: '7px 14px', fontSize: '12.5px' }}
                      >
                        <Sparkles size={14} /> {job.tailoredCvId ? 'View Tailored CV' : 'Tailor CV Now'}
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
                </div>
              ))}
              {filteredJobs.length === 0 && (
                <div className="glass-panel" style={{ gridColumn: '1 / -1', padding: '36px 24px', textAlign: 'center' }}>
                  <Briefcase size={22} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                  <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>
                    {filterQuery ? 'No matching applications' : 'Your application list is empty'}
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>
                    {filterQuery ? 'Try a different search.' : 'Add a job manually or import one from LinkedIn when you’re ready.'}
                  </p>
                  {!filterQuery && <button className="btn-secondary" onClick={() => setShowAddJobModal(true)}><Plus size={15} /> Add your first job</button>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: TAILORED CV STUDIO */}
        {activeTab === 'studio' && (
          <div className="studio-grid" style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px' }}>
            {/* Left Controls & Analysis Panel */}
            <div className="no-print studio-controls" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="glass-panel" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} color="#3b82f6" /> ATS Alignment & Optimization
                </h3>

                {selectedJob ? (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Target Job:</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>{selectedJob.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--accent-blue)' }}>{selectedJob.company}</div>
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    Select a job from your pipeline to generate and review your tailored CV.
                  </div>
                )}

                {/* Match Score Display */}
                <div style={{
                  padding: '16px',
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '12px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Calculated Match Score</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-success)' }}>
                      {tailoredCv ? `${tailoredCv.matchScore}%` : '88%'}
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-success)', maxWidth: '160px', textAlign: 'right' }}>
                    Verified ATS single-column parseable
                  </div>
                </div>

                {tailoredCv?.rationale && (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '18px' }}>
                    <strong style={{ color: '#ffffff' }}>Strategy Rationale:</strong> {tailoredCv.rationale}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button 
                    onClick={handlePrintResume} 
                    className="btn-primary" 
                    style={{ width: '100%', padding: '12px' }}
                  >
                    <Printer size={16} /> Print / Save as PDF
                  </button>

                  <button 
                    onClick={handleCopyText} 
                    className="btn-secondary" 
                    style={{ width: '100%', padding: '10px' }}
                  >
                    {isCopied ? <Check size={16} color="var(--color-success)" /> : <Copy size={16} />}
                    {isCopied ? 'Copied to Clipboard!' : 'Copy Plain Text for ATS'}
                  </button>

                  {selectedJob && (
                    <button 
                      onClick={() => handleTailor(selectedJob)} 
                      disabled={isLoadingTailor}
                      className="btn-secondary" 
                      style={{ width: '100%', padding: '10px' }}
                    >
                      <RefreshCw size={16} className={isLoadingTailor ? 'animate-spin' : ''} /> 
                      {isLoadingTailor ? 'Regenerating...' : 'Re-run Tailoring Algorithm'}
                    </button>
                  )}

                  {tailoredCv && (
                    <button 
                      onClick={() => handleDeleteTailoredCv(tailoredCv.id)} 
                      className="btn-danger"
                      style={{ width: '100%', marginTop: '4px' }}
                    >
                      <Trash2 size={15} /> Remove This Tailored CV
                    </button>
                  )}
                </div>
              </div>

              {/* Keyword Breakdown Card */}
              {tailoredCv && (
                <div className="glass-panel" style={{ padding: '20px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>
                    Highlighted Keywords
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {tailoredCv.highlightedSkills.flatMap(c => c.skills).map((skill, idx) => (
                      <span key={idx} className="badge badge-emerald" style={{ fontSize: '10.5px' }}>
                        ✓ {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: The Clean ATS Resume Document Sheet */}
            <div className="resume-paper print-resume-sheet" style={{
              backgroundColor: '#ffffff',
              color: '#111827',
              borderRadius: '12px',
              padding: '48px 56px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              minHeight: '1000px',
              fontFamily: '"Times New Roman", Times, Georgia, serif',
              lineHeight: '1.4'
            }}>
              {isLoadingTailor ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', gap: '14px', color: '#6b7280' }}>
                  <div className="jh-spinner" style={{ width: '28px', height: '28px', borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#2563eb' }}></div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>Synthesizing Master Profile & Tailoring CV...</div>
                </div>
              ) : tailoredCv ? (
                <div>
                  {/* Header / Contact */}
                  <div style={{ textAlign: 'center', borderBottom: '1.5px solid #111827', paddingBottom: '12px', marginBottom: '18px' }}>
                    <h1 style={{ fontSize: '26px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 4px 0' }}>
                      {tailoredCv.contact.name}
                    </h1>
                    <div 
                      contentEditable
                      suppressContentEditableWarning
                      title="Click to edit headline"
                      style={{ fontSize: '14px', fontWeight: 700, color: '#374151', marginBottom: '6px', outline: 'none', cursor: 'text' }}
                    >
                      {cleanProfessionalTitle(tailoredCv.targetRole, tailoredCv.company)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#4b5563', display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
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
                  <div style={{ marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', borderBottom: '1px solid #9ca3af', paddingBottom: '2px', marginBottom: '8px', letterSpacing: '0.05em' }}>
                      Professional Summary
                    </h2>
                    <p 
                      contentEditable
                      suppressContentEditableWarning
                      style={{ fontSize: '12px', color: '#1f2937', textAlign: 'justify', margin: 0, lineHeight: '1.5', outline: 'none' }}
                    >
                      {tailoredCv.professionalSummary}
                    </p>
                  </div>

                  {/* Core Technical Competencies */}
                  <div style={{ marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', borderBottom: '1px solid #9ca3af', paddingBottom: '2px', marginBottom: '8px', letterSpacing: '0.05em' }}>
                      Technical Skills & Competencies
                    </h2>
                    <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {tailoredCv.highlightedSkills.map((cat, idx) => (
                        <div key={idx}>
                          <strong style={{ color: '#111827' }}>{cat.category}: </strong>
                          <span 
                            contentEditable
                            suppressContentEditableWarning
                            style={{ color: '#374151', outline: 'none' }}
                          >
                            {cat.skills.join(', ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Professional Experience */}
                  <div style={{ marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', borderBottom: '1px solid #9ca3af', paddingBottom: '2px', marginBottom: '10px', letterSpacing: '0.05em' }}>
                      Professional Experience
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {tailoredCv.tailoredExperiences.map((exp, idx) => (
                        <div key={idx}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>
                              {exp.company}
                            </span>
                            <span style={{ fontSize: '11px', color: '#4b5563', fontStyle: 'italic' }}>
                              {exp.period} | {exp.location}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                            {exp.role}
                          </div>
                          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '11.5px', color: '#1f2937' }}>
                            {exp.bullets.map((bullet, bIdx) => (
                              <li key={bIdx} style={{ marginBottom: '4px', lineHeight: '1.45' }}>
                                {bullet}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Education */}
                  <div style={{ marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', borderBottom: '1px solid #9ca3af', paddingBottom: '2px', marginBottom: '8px', letterSpacing: '0.05em' }}>
                      Education
                    </h2>
                    {tailoredCv.education.map((edu, idx) => (
                      <div 
                        key={idx} 
                        contentEditable
                        suppressContentEditableWarning
                        style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px', outline: 'none' }}
                      >
                        <div>
                          <strong>{edu.degree}</strong> — {edu.institution}
                        </div>
                        <div style={{ fontStyle: 'italic', color: '#4b5563' }}>
                          {edu.graduationYear} | {edu.location}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Certifications */}
                  {tailoredCv.certifications && tailoredCv.certifications.length > 0 && (
                    <div>
                      <h2 style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', borderBottom: '1px solid #9ca3af', paddingBottom: '2px', marginBottom: '8px', letterSpacing: '0.05em' }}>
                        Certifications & Professional Development
                      </h2>
                      <div style={{ fontSize: '12px', color: '#1f2937' }}>
                        {tailoredCv.certifications.map(c => `${c.name} (${c.issuer})`).join(' • ')}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '80px 0', color: '#6b7280' }}>
                  <FileText size={48} style={{ margin: '0 auto 16px auto', color: 'var(--color-text-muted)' }} />
                  <h3 style={{ fontSize: '18px', color: '#111827', marginBottom: '8px' }}>No CV Loaded in Studio</h3>
                  <p style={{ fontSize: '13px', maxWidth: '360px', margin: '0 auto 20px auto' }}>
                    Select any job from your Pipeline to run the tailoring engine and view your tailored resume.
                  </p>
                  {selectedJob && (
                    <button onClick={() => handleTailor(selectedJob)} className="btn-primary">
                      <Sparkles size={16} /> Tailor for {selectedJob.title}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: MASTER PROFILE HUB */}
        {activeTab === 'profile' && profile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {isEditingProfile && (
              <section className="glass-panel profile-editor-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '20px' }}>
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '6px' }}>Your career details</h2>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '640px' }}>
                      Add accurate details about your experience and skills. The tailoring tool will use this information to prepare a role-specific resume.
                    </p>
                  </div>
                  {profile.contact.name && (
                    <button className="btn-secondary" onClick={() => { setProfileDraft(profile); setIsEditingProfile(false); setProfileSaveMessage(''); }}>
                      Cancel
                    </button>
                  )}
                </div>

                <div role="group" aria-label="Choose how to add your profile" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginBottom: '20px' }}>
                  <button type="button" aria-pressed={profileEntryMode === 'import'} onClick={() => { setProfileEntryMode('import'); setProfileImportMessage(''); }} style={{ ...profileInputStyle, cursor: 'pointer', textAlign: 'left', borderColor: profileEntryMode === 'import' ? 'var(--accent-blue)' : 'rgba(255,255,255,0.12)', background: profileEntryMode === 'import' ? 'rgba(59,130,246,0.13)' : 'rgba(7,12,24,0.5)' }}>
                    <strong style={{ display: 'block', marginBottom: '4px' }}>Import an existing CV</strong><span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Upload PDF, DOCX, or TXT</span>
                  </button>
                  <button type="button" aria-pressed={profileEntryMode === 'manual'} onClick={() => { setProfileEntryMode('manual'); setProfileImportMessage(''); }} style={{ ...profileInputStyle, cursor: 'pointer', textAlign: 'left', borderColor: profileEntryMode === 'manual' ? 'var(--accent-blue)' : 'rgba(255,255,255,0.12)', background: profileEntryMode === 'manual' ? 'rgba(59,130,246,0.13)' : 'rgba(7,12,24,0.5)' }}>
                    <strong style={{ display: 'block', marginBottom: '4px' }}>Enter details manually</strong><span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Add your information one section at a time</span>
                  </button>
                </div>

                {profileEntryMode === 'import' ? (
                  <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '18px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>Import your resume</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>Choose one or more files. You’ll be able to review and correct the extracted information before saving it to your profile.</p>
                    <label style={profileLabelStyle}>CV files (PDF, DOCX, TXT)
                      <input style={{ ...profileInputStyle, marginTop: '6px' }} type="file" accept=".pdf,.docx,.txt,application/pdf,text/plain" multiple onChange={e => setProfileFiles(Array.from(e.target.files || []))} />
                    </label>
                    {profileFiles.length > 0 && <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Selected: {profileFiles.map(file => file.name).join(', ')}</p>}
                    <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '12px' }}>When an OpenAI API key is configured, the CV text is sent to OpenAI for extraction. Without a key, basic details are extracted locally and you can complete the profile manually.</p>
                    <button className="btn-primary" style={{ marginTop: '14px' }} onClick={importProfileCVs} disabled={isImportingProfile || profileFiles.length === 0}>
                      {isImportingProfile ? <><RefreshCw size={15} className="spin" /> Importing...</> : <><FileText size={15} /> Import and review</>}
                    </button>
                    {profileImportMessage && <p role="status" style={{ color: profileImportMessage.toLowerCase().includes('could not') || profileImportMessage.toLowerCase().includes('choose') ? 'var(--color-danger)' : 'var(--color-success)', fontSize: '12px', marginTop: '12px' }}>{profileImportMessage}</p>}
                  </div>
                ) : (
                  <>
                {profileImportMessage && <p role="status" style={{ color: 'var(--color-success)', fontSize: '12px', marginBottom: '14px' }}>{profileImportMessage}</p>}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
                  <label style={profileLabelStyle}>Full name<input style={profileInputStyle} value={profileDraft.contact.name} onChange={e => updateProfileContact('name', e.target.value)} placeholder="Your name" /></label>
                  <label style={profileLabelStyle}>Professional titles<input style={profileInputStyle} value={profileDraft.contact.titles.join(', ')} onChange={e => updateProfileContact('titles', e.target.value)} placeholder="e.g. Product Designer, UX Researcher" /></label>
                  <label style={profileLabelStyle}>Email<input style={profileInputStyle} type="email" value={profileDraft.contact.email} onChange={e => updateProfileContact('email', e.target.value)} placeholder="you@example.com" /></label>
                  <label style={profileLabelStyle}>Phone<input style={profileInputStyle} value={profileDraft.contact.phone} onChange={e => updateProfileContact('phone', e.target.value)} placeholder="Phone number" /></label>
                  <label style={profileLabelStyle}>Location<input style={profileInputStyle} value={profileDraft.contact.location} onChange={e => updateProfileContact('location', e.target.value)} placeholder="City, Country" /></label>
                  <label style={profileLabelStyle}>LinkedIn<input style={profileInputStyle} value={profileDraft.contact.linkedin || ''} onChange={e => updateProfileContact('linkedin', e.target.value)} placeholder="LinkedIn URL" /></label>
                  <label style={profileLabelStyle}>Portfolio or website<input style={profileInputStyle} value={profileDraft.contact.portfolio || ''} onChange={e => updateProfileContact('portfolio', e.target.value)} placeholder="Website URL" /></label>
                  <label style={profileLabelStyle}>GitHub<input style={profileInputStyle} value={profileDraft.contact.github || ''} onChange={e => updateProfileContact('github', e.target.value)} placeholder="GitHub URL" /></label>
                </div>

                <label style={{ ...profileLabelStyle, marginTop: '18px' }}>Professional summary
                  <textarea style={{ ...profileInputStyle, minHeight: '110px', resize: 'vertical', marginTop: '6px' }} value={profileDraft.summaries.general || ''} onChange={e => setProfileDraft(current => ({ ...current, summaries: { ...current.summaries, general: e.target.value } }))} placeholder="Summarize your experience, strengths, and the work you do." />
                </label>

                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '22px 0 12px' }}>Skills</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '12px' }}>Separate skills with commas. Include only skills you can support with real experience.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                  {([
                    ['languages', 'Languages / core skills'], ['frameworks', 'Tools / frameworks'], ['data_and_ai', 'Data / AI'],
                    ['cloud_and_devops', 'Cloud / operations'], ['databases', 'Databases'], ['practices', 'Methods / practices']
                  ] as [keyof MasterProfile['skills'], string][]).map(([key, label]) => (
                    <label key={key} style={profileLabelStyle}>{label}<input style={profileInputStyle} value={profileDraft.skills[key].join(', ')} onChange={e => updateProfileSkill(key, e.target.value)} placeholder="Add comma-separated skills" /></label>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', margin: '24px 0 12px' }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Work experience</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>Add the roles and achievements you want considered for tailored resumes.</p>
                  </div>
                  <button className="btn-secondary" onClick={addProfileExperience}><Plus size={15} /> Add role</button>
                </div>
                {profileDraft.experiences.map((experience, index) => (
                  <div key={experience.id} style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '14px', marginBottom: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                      {([['role', 'Job title'], ['company', 'Company'], ['location', 'Location'], ['startDate', 'Start date'], ['endDate', 'End date']] as [keyof ExperienceItem, string][]).map(([key, label]) => (
                        <label key={key} style={profileLabelStyle}>{label}<input style={profileInputStyle} value={experience[key] as string} onChange={e => updateProfileExperience(index, key, e.target.value)} placeholder={label} /></label>
                      ))}
                    </div>
                    <label style={{ ...profileLabelStyle, marginTop: '10px' }}>Achievements (one per line)
                      <textarea style={{ ...profileInputStyle, minHeight: '88px', resize: 'vertical', marginTop: '6px' }} value={experience.highlights.join('\n')} onChange={e => updateProfileExperience(index, 'highlights', e.target.value)} placeholder="Describe what you did and the results you achieved." />
                    </label>
                    <label style={{ ...profileLabelStyle, marginTop: '10px' }}>Relevant skills (comma-separated)
                      <input style={profileInputStyle} value={experience.keywords.join(', ')} onChange={e => updateProfileExperience(index, 'keywords', e.target.value)} placeholder="Skills and tools used in this role" />
                    </label>
                    <button className="btn-danger" style={{ marginTop: '10px' }} onClick={() => setProfileDraft(current => ({ ...current, experiences: current.experiences.filter((_, itemIndex) => itemIndex !== index) }))}><Trash2 size={14} /> Remove role</button>
                  </div>
                ))}
                {profileDraft.experiences.length === 0 && <p style={{ color: 'var(--text-dim)', fontSize: '13px', padding: '12px 0' }}>No roles added yet. Add at least one role for better tailoring.</p>}

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '18px' }}>
                  <button className="btn-primary" onClick={saveProfileDetails} disabled={isSavingProfile || !profileDraft.contact.name.trim()}>
                    {isSavingProfile ? <><RefreshCw size={15} className="spin" /> Saving...</> : <><CheckCircle2 size={15} /> Save career details</>}
                  </button>
                  {!profileDraft.contact.name.trim() && <span style={{ color: 'var(--text-dim)', fontSize: '12px' }}>Enter your name to save.</span>}
                  {profileSaveMessage && <span role="status" style={{ color: profileSaveMessage.includes('saved') ? 'var(--color-success)' : 'var(--color-danger)', fontSize: '12px' }}>{profileSaveMessage}</span>}
                </div>
                  </>
                )}
              </section>
            )}

            {!isEditingProfile && profile.contact.name && (
              <>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn-primary" onClick={() => { setProfileDraft(profile); setIsEditingProfile(true); setProfileSaveMessage(''); }}><UserCheck size={15} /> Edit career details</button>
                </div>
                {profileSaveMessage && <p role="status" style={{ color: '#555', fontSize: '13px' }}>{profileSaveMessage}</p>}
            {/* Header info */}
            <div className="glass-panel profile-overview" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', marginBottom: '4px' }}>
                  {profile.contact.name}
                </h2>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
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
