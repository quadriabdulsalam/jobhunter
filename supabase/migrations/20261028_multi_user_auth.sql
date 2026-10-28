-- Preserve existing single-user records in inaccessible archive tables, then
-- install clean ownership-scoped tables for authenticated accounts.
begin;

do $$ begin
  if to_regclass('public.app_profile_legacy_20261028') is not null
    or to_regclass('public.job_postings_legacy_20261028') is not null
    or to_regclass('public.tailored_resumes_legacy_20261028') is not null then
    raise exception 'Legacy archive tables already exist; refusing to run this migration twice.';
  end if;
end $$;

alter table public.app_profile rename to app_profile_legacy_20261028;
alter table public.job_postings rename to job_postings_legacy_20261028;
alter table public.tailored_resumes rename to tailored_resumes_legacy_20261028;

revoke all on table public.app_profile_legacy_20261028 from public, anon, authenticated, service_role;
revoke all on table public.job_postings_legacy_20261028 from public, anon, authenticated, service_role;
revoke all on table public.tailored_resumes_legacy_20261028 from public, anon, authenticated, service_role;

create table public.app_profile (
  user_id uuid primary key references auth.users(id) on delete cascade,
  id text not null default 'default' check (id = 'default'),
  data jsonb not null,
  updated_at timestamptz not null default now()
);
create table public.job_postings (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);
create table public.tailored_resumes (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  job_id text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index tailored_resumes_user_job_id_idx on public.tailored_resumes (user_id, job_id);
alter table public.app_profile enable row level security;
alter table public.job_postings enable row level security;
alter table public.tailored_resumes enable row level security;

create policy "Users manage their own profile" on public.app_profile
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage their own jobs" on public.job_postings
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage their own resumes" on public.tailored_resumes
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

revoke all on table public.app_profile from anon;
revoke all on table public.job_postings from anon;
revoke all on table public.tailored_resumes from anon;
grant select, insert, update, delete on table public.app_profile to authenticated;
grant select, insert, update, delete on table public.job_postings to authenticated;
grant select, insert, update, delete on table public.tailored_resumes to authenticated;

commit;
