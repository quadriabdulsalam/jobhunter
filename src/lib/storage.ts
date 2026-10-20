import fs from 'fs';
import path from 'path';
import { MasterProfile, JobPosting, TailoredCV } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const PROFILE_FILE = path.join(DATA_DIR, 'master_profile.json');
const JOBS_FILE = path.join(DATA_DIR, 'jobs.json');
const TAILORED_DIR = path.join(DATA_DIR, 'tailored');

function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(TAILORED_DIR)) {
    fs.mkdirSync(TAILORED_DIR, { recursive: true });
  }
}

export function getMasterProfile(): MasterProfile | null {
  ensureDirectories();
  if (!fs.existsSync(PROFILE_FILE)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(PROFILE_FILE, 'utf-8');
    return JSON.parse(raw) as MasterProfile;
  } catch (e) {
    console.error('Error reading master profile:', e);
    return null;
  }
}

export function saveMasterProfile(profile: MasterProfile): void {
  ensureDirectories();
  fs.writeFileSync(PROFILE_FILE, JSON.stringify(profile, null, 2), 'utf-8');
}

export function getAllJobs(): JobPosting[] {
  ensureDirectories();
  if (!fs.existsSync(JOBS_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(JOBS_FILE, 'utf-8');
    return JSON.parse(raw) as JobPosting[];
  } catch (e) {
    console.error('Error reading jobs:', e);
    return [];
  }
}

export function saveJobs(jobs: JobPosting[]): void {
  ensureDirectories();
  fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2), 'utf-8');
}

export function upsertJob(job: JobPosting): JobPosting {
  const jobs = getAllJobs();
  const index = jobs.findIndex(j => j.id === job.id || (j.url && j.url === job.url));
  if (index >= 0) {
    jobs[index] = { ...jobs[index], ...job };
  } else {
    jobs.unshift(job);
  }
  saveJobs(jobs);
  return job;
}

export function getJobById(id: string): JobPosting | null {
  const jobs = getAllJobs();
  return jobs.find(j => j.id === id) || null;
}

export function saveTailoredCV(cv: TailoredCV): void {
  ensureDirectories();
  const filePath = path.join(TAILORED_DIR, `${cv.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(cv, null, 2), 'utf-8');

  // Also update corresponding job reference if exists
  const jobs = getAllJobs();
  const job = jobs.find(j => j.id === cv.jobId);
  if (job) {
    job.tailoredCvId = cv.id;
    job.status = job.status === 'extracted' ? 'tailored' : job.status;
    job.matchScore = cv.matchScore;
    saveJobs(jobs);
  }
}

export function getTailoredCV(id: string): TailoredCV | null {
  ensureDirectories();
  const filePath = path.join(TAILORED_DIR, `${id}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as TailoredCV;
  } catch {
    return null;
  }
}

export function deleteJob(id: string): boolean {
  ensureDirectories();
  const jobs = getAllJobs();
  const job = jobs.find(j => j.id === id);
  if (!job) return false;

  // Also remove any associated tailored CV file
  if (job.tailoredCvId) {
    const cvFile = path.join(TAILORED_DIR, `${job.tailoredCvId}.json`);
    if (fs.existsSync(cvFile)) {
      try { fs.unlinkSync(cvFile); } catch {}
    }
  }

  const updated = jobs.filter(j => j.id !== id);
  saveJobs(updated);
  return true;
}

export function deleteTailoredCV(id: string): boolean {
  ensureDirectories();
  const filePath = path.join(TAILORED_DIR, `${id}.json`);
  if (fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath); } catch {}
  }

  // Update corresponding job reference
  const jobs = getAllJobs();
  let modified = false;
  jobs.forEach(job => {
    if (job.tailoredCvId === id) {
      delete job.tailoredCvId;
      job.status = 'extracted';
      delete job.matchScore;
      modified = true;
    }
  });

  if (modified) {
    saveJobs(jobs);
  }

  return true;
}
