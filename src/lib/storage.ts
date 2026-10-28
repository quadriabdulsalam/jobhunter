import fs from 'fs';
import path from 'path';
import { MasterProfile, JobPosting, TailoredCV } from './types';
import type { StorageContext } from './supabase-server';

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

export async function getMasterProfile(context: StorageContext): Promise<MasterProfile | null> {
  if (context.supabase) {
    const { data, error } = await context.supabase.from('app_profile').select('data').eq('user_id', context.userId).maybeSingle();
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

export async function saveMasterProfile(context: StorageContext, profile: MasterProfile): Promise<void> {
  if (context.supabase) {
    const { error } = await context.supabase.from('app_profile').upsert({
      user_id: context.userId,
      id: 'default',
      data: profile,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });
    throwIfError(error);
    return;
  }

  ensureDirectories();
  fs.writeFileSync(PROFILE_FILE, JSON.stringify(profile, null, 2), 'utf-8');
}

export async function getAllJobs(context: StorageContext): Promise<JobPosting[]> {
  if (context.supabase) {
    const { data, error } = await context.supabase.from('job_postings').select('data').eq('user_id', context.userId).order('created_at', { ascending: false });
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

async function saveJob(context: StorageContext, job: JobPosting): Promise<void> {
  if (context.supabase) {
    const { error } = await context.supabase.from('job_postings').upsert({
      user_id: context.userId,
      id: job.id,
      data: job,
      created_at: job.extractedAt
    }, { onConflict: 'user_id,id' });
    throwIfError(error);
    return;
  }

  const jobs = await getAllJobs(context);
  const index = jobs.findIndex(item => item.id === job.id);
  if (index >= 0) jobs[index] = job;
  else jobs.unshift(job);
  ensureDirectories();
  fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2), 'utf-8');
}

export async function upsertJob(context: StorageContext, job: JobPosting): Promise<JobPosting> {
  const jobs = await getAllJobs(context);
  const existing = jobs.find(item => item.id === job.id || (job.url && item.url === job.url));
  const savedJob = existing ? { ...existing, ...job, id: existing.id } : job;
  await saveJob(context, savedJob);
  return savedJob;
}

export async function getJobById(context: StorageContext, id: string): Promise<JobPosting | null> {
  if (context.supabase) {
    const { data, error } = await context.supabase.from('job_postings').select('data').eq('user_id', context.userId).eq('id', id).maybeSingle();
    throwIfError(error);
    return (data?.data as JobPosting | undefined) ?? null;
  }
  return (await getAllJobs(context)).find(job => job.id === id) || null;
}

export async function saveTailoredCV(context: StorageContext, cv: TailoredCV): Promise<void> {
  if (context.supabase) {
    const { error } = await context.supabase.from('tailored_resumes').upsert({
      user_id: context.userId,
      id: cv.id,
      job_id: cv.jobId,
      data: cv,
      created_at: cv.tailoredAt
    }, { onConflict: 'user_id,id' });
    throwIfError(error);
  } else {
    ensureDirectories();
    fs.writeFileSync(path.join(TAILORED_DIR, `${path.basename(cv.id)}.json`), JSON.stringify(cv, null, 2), 'utf-8');
  }

  const job = await getJobById(context, cv.jobId);
  if (job) {
    job.tailoredCvId = cv.id;
    if (job.status === 'extracted') job.status = 'tailored';
    job.matchScore = cv.matchScore;
    await saveJob(context, job);
  }
}

export async function getTailoredCV(context: StorageContext, id: string): Promise<TailoredCV | null> {
  if (context.supabase) {
    const { data, error } = await context.supabase.from('tailored_resumes').select('data').eq('user_id', context.userId).eq('id', id).maybeSingle();
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

export async function deleteJob(context: StorageContext, id: string): Promise<boolean> {
  const job = await getJobById(context, id);
  if (!job) return false;

  if (context.supabase) {
    if (job.tailoredCvId) {
      const { error: cvError } = await context.supabase.from('tailored_resumes').delete().eq('user_id', context.userId).eq('id', job.tailoredCvId);
      throwIfError(cvError);
    }
    const { error } = await context.supabase.from('job_postings').delete().eq('user_id', context.userId).eq('id', id);
    throwIfError(error);
    return true;
  }

  if (job.tailoredCvId) {
    const filePath = path.join(TAILORED_DIR, `${path.basename(job.tailoredCvId)}.json`);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  const remaining = (await getAllJobs(context)).filter(item => item.id !== id);
  ensureDirectories();
  fs.writeFileSync(JOBS_FILE, JSON.stringify(remaining, null, 2), 'utf-8');
  return true;
}

export async function deleteTailoredCV(context: StorageContext, id: string): Promise<boolean> {
  if (context.supabase) {
    const { error } = await context.supabase.from('tailored_resumes').delete().eq('user_id', context.userId).eq('id', id);
    throwIfError(error);
  } else {
    ensureDirectories();
    const filePath = path.join(TAILORED_DIR, `${path.basename(id)}.json`);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  const job = (await getAllJobs(context)).find(item => item.tailoredCvId === id);
  if (job) {
    delete job.tailoredCvId;
    delete job.matchScore;
    job.status = 'extracted';
    await saveJob(context, job);
  }
  return true;
}
