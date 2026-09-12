create extension if not exists pgcrypto;

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  weather_city text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  teacher text not null default '',
  absences integer not null default 0 check (absences >= 0),
  absence_limit integer not null default 0 check (absence_limit >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  due_label text not null default 'Hoje',
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.internships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  company text not null check (char_length(trim(company)) > 0),
  target_hours integer not null check (target_hours > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.internships drop constraint if exists internships_id_user_id_key;
alter table public.internships add constraint internships_id_user_id_key unique (id, user_id);

create table if not exists public.internship_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  internship_id uuid not null,
  date_label text not null,
  description text not null check (char_length(trim(description)) > 0),
  hours numeric(6,2) not null check (hours > 0),
  created_at timestamptz not null default now(),
  constraint internship_days_owner_fk foreign key (internship_id, user_id) references public.internships(id, user_id) on delete cascade
);

create index if not exists subjects_user_id_idx on public.subjects(user_id);
create index if not exists reminders_user_id_idx on public.reminders(user_id, created_at desc);
create index if not exists activities_user_id_idx on public.activities(user_id, created_at desc);
create index if not exists internship_days_user_id_idx on public.internship_days(user_id, created_at desc);

alter table public.subjects enable row level security;
alter table public.reminders enable row level security;
alter table public.activities enable row level security;
alter table public.internships enable row level security;
alter table public.internship_days enable row level security;
alter table public.user_preferences enable row level security;

drop policy if exists "user_preferences_select_own" on public.user_preferences;
create policy "user_preferences_select_own" on public.user_preferences for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "user_preferences_insert_own" on public.user_preferences;
create policy "user_preferences_insert_own" on public.user_preferences for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "user_preferences_update_own" on public.user_preferences;
create policy "user_preferences_update_own" on public.user_preferences for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "subjects_select_own" on public.subjects;
create policy "subjects_select_own" on public.subjects for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "subjects_insert_own" on public.subjects;
create policy "subjects_insert_own" on public.subjects for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "subjects_update_own" on public.subjects;
create policy "subjects_update_own" on public.subjects for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "subjects_delete_own" on public.subjects;
create policy "subjects_delete_own" on public.subjects for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "reminders_select_own" on public.reminders;
create policy "reminders_select_own" on public.reminders for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "reminders_insert_own" on public.reminders;
create policy "reminders_insert_own" on public.reminders for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "reminders_update_own" on public.reminders;
create policy "reminders_update_own" on public.reminders for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "reminders_delete_own" on public.reminders;
create policy "reminders_delete_own" on public.reminders for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "activities_select_own" on public.activities;
create policy "activities_select_own" on public.activities for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "activities_insert_own" on public.activities;
create policy "activities_insert_own" on public.activities for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "activities_delete_own" on public.activities;
create policy "activities_delete_own" on public.activities for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "internships_select_own" on public.internships;
create policy "internships_select_own" on public.internships for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "internships_insert_own" on public.internships;
create policy "internships_insert_own" on public.internships for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "internships_update_own" on public.internships;
create policy "internships_update_own" on public.internships for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "internships_delete_own" on public.internships;
create policy "internships_delete_own" on public.internships for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "internship_days_select_own" on public.internship_days;
create policy "internship_days_select_own" on public.internship_days for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "internship_days_insert_own" on public.internship_days;
create policy "internship_days_insert_own" on public.internship_days for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "internship_days_update_own" on public.internship_days;
create policy "internship_days_update_own" on public.internship_days for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "internship_days_delete_own" on public.internship_days;
create policy "internship_days_delete_own" on public.internship_days for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.subjects to authenticated;
grant select, insert, update, delete on public.reminders to authenticated;
grant select, insert, delete on public.activities to authenticated;
grant select, insert, update, delete on public.internships to authenticated;
grant select, insert, update, delete on public.internship_days to authenticated;
grant select, insert, update on public.user_preferences to authenticated;
