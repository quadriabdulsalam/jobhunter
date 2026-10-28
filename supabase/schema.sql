-- Per-user Jobhunter storage. Run once in the Supabase SQL Editor.
create table if not exists public.app_profile (
  user_id uuid primary key references auth.users(id) on delete cascade,
  id text not null default 'default' check (id = 'default'),
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.job_postings (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.tailored_resumes (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  job_id text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists tailored_resumes_user_job_id_idx
  on public.tailored_resumes (user_id, job_id);

alter table public.app_profile enable row level security;
alter table public.job_postings enable row level security;
alter table public.tailored_resumes enable row level security;

drop policy if exists "Users manage their own profile" on public.app_profile;
create policy "Users manage their own profile" on public.app_profile
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users manage their own jobs" on public.job_postings;
create policy "Users manage their own jobs" on public.job_postings
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users manage their own resumes" on public.tailored_resumes;
create policy "Users manage their own resumes" on public.tailored_resumes
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

revoke all on table public.app_profile from anon;
revoke all on table public.job_postings from anon;
revoke all on table public.tailored_resumes from anon;
grant select, insert, update, delete on table public.app_profile to authenticated;
grant select, insert, update, delete on table public.job_postings to authenticated;
grant select, insert, update, delete on table public.tailored_resumes to authenticated;
