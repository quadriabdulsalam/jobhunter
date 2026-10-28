-- Run this once in the Supabase SQL Editor for the Jobhunter project.
-- The app accesses these tables only from server-side code with SUPABASE_SECRET_KEY.

create table if not exists public.app_profile (
  id text primary key check (id = 'default'),
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.job_postings (
  id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.tailored_resumes (
  id text primary key,
  job_id text not null,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists tailored_resumes_job_id_idx
  on public.tailored_resumes (job_id);

alter table public.app_profile enable row level security;
alter table public.job_postings enable row level security;
alter table public.tailored_resumes enable row level security;

revoke all on table public.app_profile from anon, authenticated;
revoke all on table public.job_postings from anon, authenticated;
revoke all on table public.tailored_resumes from anon, authenticated;
grant all on table public.app_profile to service_role;
grant all on table public.job_postings to service_role;
grant all on table public.tailored_resumes to service_role;
