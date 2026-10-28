import fs from 'fs';
import path from 'path';
import { MasterProfile, JobPosting, TailoredCV } from './types';
import { getSupabaseAdmin } from './supabase-admin';

const DATA_DIR = path.join(process.cwd(), 'data');
const PROFILE_FILE = path.join(DATA_DIR, 'master_profile.json');
const JOBS_FILE = path.join(DATA_DIR, 'jobs.json');
const TAILORED_DIR = path.join(DATA_DIR, 'tailored');

function ensureDirectories() {
  fs.mkdirSync(TAILORED_DIR, { recursive: true });
}

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(`Supabase storage error: ${error.message}`);
}

export async function getMasterProfile(): Promise<MasterProfile | null> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase.from('app_profile').select('data').eq('id', 'default').maybeSingle();
    throwIfError(error);
    return (data?.data as MasterProfile | undefined) ?? null;
  }

  ensureDirectories();
  if (!fs.existsSync(PROFILE_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(PROFILE_FILE, 'utf-8').replace(/^\uFEFF/, '')) as MasterProfile;
  } catch (error) {
    console.error('Error reading master profile:', error);
    return null;
  }
}

export async function saveMasterProfile(profile: MasterProfile): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase.from('app_profile').upsert({
      id: 'default',
      data: profile,
      updated_at: new Date().toISOString()
    });
    throwIfError(error);
    return;
  }

  ensureDirectories();
  fs.writeFileSync(PROFILE_FILE, JSON.stringify(profile, null, 2), 'utf-8');
}

export async function getAllJobs(): Promise<JobPosting[]> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase.from('job_postings').select('data').order('created_at', { ascending: false });
    throwIfError(error);
    return (data || []).map(row => row.data as JobPosting);
  }

  ensureDirectories();
  if (!fs.existsSync(JOBS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(JOBS_FILE, 'utf-8').replace(/^\uFEFF/, '')) as JobPosting[];
  } catch (error) {
    console.error('Error reading jobs:', error);
    return [];
  }
}

async function saveJob(job: JobPosting): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase.from('job_postings').upsert({
      id: job.id,
      data: job,
      created_at: job.extractedAt
    });
    throwIfError(error);
    return;
  }

  const jobs = await getAllJobs();
  const index = jobs.findIndex(item => item.id === job.id);
  if (index >= 0) jobs[index] = job;
  else jobs.unshift(job);
  ensureDirectories();
  fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2), 'utf-8');
}

export async function upsertJob(job: JobPosting): Promise<JobPosting> {
  const jobs = await getAllJobs();
  const existing = jobs.find(item => item.id === job.id || (job.url && item.url === job.url));
  const savedJob = existing ? { ...existing, ...job, id: existing.id } : job;
  await saveJob(savedJob);
  return savedJob;
}

export async function getJobById(id: string): Promise<JobPosting | null> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase.from('job_postings').select('data').eq('id', id).maybeSingle();
    throwIfError(error);
    return (data?.data as JobPosting | undefined) ?? null;
  }
  return (await getAllJobs()).find(job => job.id === id) || null;
}

export async function saveTailoredCV(cv: TailoredCV): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase.from('tailored_resumes').upsert({
      id: cv.id,
      job_id: cv.jobId,
      data: cv,
      created_at: cv.tailoredAt
    });
    throwIfError(error);
  } else {
    ensureDirectories();
    fs.writeFileSync(path.join(TAILORED_DIR, `${path.basename(cv.id)}.json`), JSON.stringify(cv, null, 2), 'utf-8');
  }

  const job = await getJobById(cv.jobId);
  if (job) {
    job.tailoredCvId = cv.id;
    if (job.status === 'extracted') job.status = 'tailored';
    job.matchScore = cv.matchScore;
    await saveJob(job);
  }
}

export async function getTailoredCV(id: string): Promise<TailoredCV | null> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase.from('tailored_resumes').select('data').eq('id', id).maybeSingle();
    throwIfError(error);
    return (data?.data as TailoredCV | undefined) ?? null;
  }

  ensureDirectories();
  const filePath = path.join(TAILORED_DIR, `${path.basename(id)}.json`);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as TailoredCV;
  } catch {
    return null;
  }
}

export async function deleteJob(id: string): Promise<boolean> {
  const job = await getJobById(id);
  if (!job) return false;

  const supabase = getSupabaseAdmin();
  if (supabase) {
    if (job.tailoredCvId) {
      const { error: cvError } = await supabase.from('tailored_resumes').delete().eq('id', job.tailoredCvId);
      throwIfError(cvError);
    }
    const { error } = await supabase.from('job_postings').delete().eq('id', id);
    throwIfError(error);
    return true;
  }

  if (job.tailoredCvId) {
    const filePath = path.join(TAILORED_DIR, `${path.basename(job.tailoredCvId)}.json`);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  const remaining = (await getAllJobs()).filter(item => item.id !== id);
  ensureDirectories();
  fs.writeFileSync(JOBS_FILE, JSON.stringify(remaining, null, 2), 'utf-8');
  return true;
}

export async function deleteTailoredCV(id: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase.from('tailored_resumes').delete().eq('id', id);
    throwIfError(error);
  } else {
    ensureDirectories();
    const filePath = path.join(TAILORED_DIR, `${path.basename(id)}.json`);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  const job = (await getAllJobs()).find(item => item.tailoredCvId === id);
  if (job) {
    delete job.tailoredCvId;
    delete job.matchScore;
    job.status = 'extracted';
    await saveJob(job);
  }
  return true;
}
