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
import { MasterProfile, JobPosting, TailoredCV } from '@/lib/types';
import { cleanProfessionalTitle } from '@/lib/cv-tailorer';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'jobs' | 'studio' | 'profile' | 'extension'>('jobs');
  const [profile, setProfile] = useState<MasterProfile | null>(null);
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
      }
    } catch (e) {
      console.error('Error fetching profile:', e);
    }
  }

  async function fetchJobs() {
    try {
      const res = await fetch('/api/jobs');
      if (res.ok) {
        const data = await res.json();
        let fetchedJobs = data.jobs || [];

        // If no jobs yet, seed a sample job so user has an immediate hands-on test
        if (fetchedJobs.length === 0) {
          const sampleJob: JobPosting = {
            id: 'job-tesla-sample',
            title: 'Senior Data Platform & Distributed Systems Engineer',
            company: 'Tesla',
            location: 'Berlin / Düsseldorf, Germany',
            workplaceType: 'Hybrid',
            url: 'https://www.linkedin.com/jobs/view/sample-tesla',
            source: 'linkedin',
            applyType: 'easy_apply',
            description: `We are looking for a Senior Data & Distributed Systems Engineer to scale our vehicle telemetry and real-time streaming infrastructure.
Responsibilities:
- Build high-throughput event streaming pipelines using Apache Kafka, Python, Go, and PostgreSQL.
- Optimize distributed storage, ETL/ELT pipelines, and query performance for terabytes of vehicle sensor data.
- Design resilient microservices with Docker, Kubernetes, and AWS cloud infrastructure.
- Lead architecture reviews, CQRS designs, and low-latency API development.
Requirements:
- 6+ years in backend/data platform engineering.
- Deep expertise in Python or Java/Kotlin, Kafka, SQL, Docker, and Kubernetes.
- Experience with real-time analytics, data modeling, and performance tuning.`,
            extractedAt: new Date().toISOString(),
            status: 'extracted'
          };
          await fetch('/api/jobs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sampleJob)
          });
          fetchedJobs = [sampleJob];
        }

        setJobs(fetchedJobs);
        if (fetchedJobs.length > 0 && !selectedJob) {
          setSelectedJob(fetchedJobs[0]);
        }
      }
    } catch (e) {
      console.error('Error fetching jobs:', e);
    }
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <header className="no-print" style={{
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
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '18px',
              boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)'
            }}>
              JH
            </div>
            <div>
              <div style={{ fontSize: '17px', fontWeight: 700, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                JobHunter AI <span className="badge badge-purple" style={{ fontSize: '10px' }}>Copilot</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                LinkedIn Discovery & Tailored ATS CV Engine
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav style={{ display: 'flex', gap: '6px', marginLeft: '20px' }}>
            <button 
              onClick={() => setActiveTab('jobs')}
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
              <Briefcase size={16} /> Job Pipeline ({jobs.length})
            </button>

            <button 
              onClick={() => setActiveTab('studio')}
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
              <FileText size={16} /> Tailored CV Studio
            </button>

            <button 
              onClick={() => setActiveTab('profile')}
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
              <UserCheck size={16} /> Master Profile ({profile?.metadata?.sourceFiles?.length || 5} CVs)
            </button>

            <button 
              onClick={() => setActiveTab('extension')}
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
              <Chrome size={16} /> Extension Setup
            </button>
          </nav>
        </div>

        {/* Profile Status Badge & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '20px',
            fontSize: '12px'
          }}>
            <span className="pulse-dot"></span>
            <span style={{ color: 'var(--text-muted)' }}>Master:</span>
            <strong style={{ color: '#ffffff' }}>{profile?.contact?.name || 'Timothy Owolabi S.'}</strong>
          </div>

          <button 
            onClick={() => setShowAddJobModal(true)}
            className="btn-primary"
            style={{ padding: '8px 14px', fontSize: '13px' }}
          >
            <Plus size={16} /> Add Job Manually
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '28px', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
        {/* TAB 1: JOB APPLICATIONS & PIPELINE */}
        {activeTab === 'jobs' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Metric Banner */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div className="glass-panel" style={{ padding: '18px 20px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Total Jobs Tracked</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff' }}>{jobs.length}</div>
                <div style={{ fontSize: '11px', color: 'var(--accent-blue)', marginTop: '4px' }}>Auto-synced with Extension</div>
              </div>

              <div className="glass-panel" style={{ padding: '18px 20px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Tailored CVs Generated</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#34d399' }}>
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
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#fbbf24' }}>5 CVs</div>
                <div style={{ fontSize: '11px', color: 'var(--accent-amber)', marginTop: '4px' }}>De-duplicated & Enriched</div>
              </div>
            </div>

            {/* Quick Import from LinkedIn URL Banner */}
            <div className="glass-panel" style={{
              padding: '18px 22px',
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(139, 92, 246, 0.12))',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '18px' }}>🔗</span>
                  <div>
                    <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: '#ffffff' }}>
                      Import Directly via LinkedIn Job URL
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Paste any LinkedIn job posting link to auto-extract requirements, calculate match score, and tailor your CV.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleImportFromUrl} style={{ display: 'flex', gap: '10px', width: '100%' }}>
                <input 
                  type="url"
                  required
                  placeholder="https://www.linkedin.com/jobs/view/4123456789/... or any LinkedIn job link"
                  value={linkedinUrlInput}
                  onChange={e => setLinkedinUrlInput(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '11px 16px',
                    backgroundColor: 'rgba(10, 14, 23, 0.7)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '13.5px',
                    outline: 'none'
                  }}
                />
                <button 
                  type="submit" 
                  disabled={isImportingUrl}
                  className="btn-primary"
                  style={{ padding: '11px 22px', whiteSpace: 'nowrap' }}
                >
                  <Sparkles size={16} /> {isImportingUrl ? 'Fetching & Tailoring...' : 'Fetch & Tailor CV'}
                </button>
              </form>
            </div>

            {/* Filter & Search Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
              <div style={{ position: 'relative', width: '360px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Filter by job title, company, or keywords..."
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '18px' }}>
              {filteredJobs.map(job => (
                <div key={job.id} className="glass-panel" style={{ padding: '22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
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
                          {job.applyType === 'easy_apply' ? '⚡ Easy Apply' : '🔗 External Link'}
                        </span>
                        {job.matchScore && (
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#34d399' }}>
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
                        className="btn-secondary"
                        style={{ padding: '7px 10px', fontSize: '12px', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.25)' }}
                        title="Remove job from pipeline"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: TAILORED CV STUDIO */}
        {activeTab === 'studio' && (
          <div className="studio-grid" style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '28px' }}>
            {/* Left Controls & Analysis Panel */}
            <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#34d399' }}>
                      {tailoredCv ? `${tailoredCv.matchScore}%` : '88%'}
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#a7f3d0', maxWidth: '160px', textAlign: 'right' }}>
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
                    {isCopied ? <Check size={16} color="#34d399" /> : <Copy size={16} />}
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
                      className="btn-secondary" 
                      style={{ width: '100%', padding: '10px', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.25)', marginTop: '4px' }}
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
            <div style={{
              backgroundColor: '#ffffff',
              color: '#111827',
              borderRadius: '12px',
              padding: '48px 56px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              minHeight: '1000px',
              fontFamily: '"Times New Roman", Times, Georgia, serif',
              lineHeight: '1.4'
            }} className="print-resume-sheet">
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
                  <FileText size={48} style={{ margin: '0 auto 16px auto', color: '#9ca3af' }} />
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
            {/* Header info */}
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', marginBottom: '4px' }}>
                  {profile.contact.name}
                </h2>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  {profile.contact.titles.join(' • ')}
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--accent-blue)', flexWrap: 'wrap' }}>
                  <span>📍 {profile.contact.location}</span>
                  <span>📞 {profile.contact.phone}</span>
                  <span>✉️ {profile.contact.email}</span>
                  <a href={profile.contact.github} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)', textDecoration: 'none' }}>
                    GitHub ↗
                  </a>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span className="badge badge-emerald" style={{ marginBottom: '6px' }}>
                  ✓ 5 Source CVs Synthesized
                </span>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                  De-duplicated & stored in data/master_profile.json
                </div>
              </div>
            </div>

            {/* Categorized Skills */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} color="#8b5cf6" /> Consolidated Skill Banks
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
                <Briefcase size={18} color="#06b6d4" /> Consolidated Career Experience ({profile.experiences.length} Roles)
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
          </div>
        )}

        {/* TAB 4: CHROME EXTENSION SETUP GUIDE */}
        {activeTab === 'extension' && (
          <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="glass-panel" style={{ padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff'
                }}>
                  <Chrome size={24} />
                </div>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Install Chrome Extension (Option A)</h2>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Extract jobs directly on LinkedIn and tailor your CV with 1 click.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'rgba(59, 130, 246, 0.2)',
                    color: '#60a5fa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '13px',
                    flexShrink: 0
                  }}>1</div>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>Open Extensions in Chrome</h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      In Google Chrome, navigate to <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>chrome://extensions</code>
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'rgba(59, 130, 246, 0.2)',
                    color: '#60a5fa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '13px',
                    flexShrink: 0
                  }}>2</div>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>Enable "Developer mode"</h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      Toggle the switch in the top-right corner of the Extensions page.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'rgba(59, 130, 246, 0.2)',
                    color: '#60a5fa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '13px',
                    flexShrink: 0
                  }}>3</div>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>Click "Load unpacked"</h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      Select this exact folder from your Mac:
                    </p>
                    <code style={{
                      display: 'block',
                      background: 'rgba(0,0,0,0.5)',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      color: '#34d399',
                      fontSize: '12px',
                      fontFamily: 'monospace'
                    }}>
                      /Users/timothyowolabi/Documents/jobhunter/extension
                    </code>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#34d399',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '13px',
                    flexShrink: 0
                  }}>4</div>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>Ready! Open LinkedIn Jobs</h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      Go to <a href="https://www.linkedin.com/jobs" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)' }}>linkedin.com/jobs</a>. You will see the floating <strong>JobHunter AI Copilot</strong> widget in the bottom-right corner!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Manual Job Modal */}
      {showAddJobModal && (
        <div style={{
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
          <div className="glass-panel" style={{ width: '100%', maxWidth: '580px', padding: '28px' }}>
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
