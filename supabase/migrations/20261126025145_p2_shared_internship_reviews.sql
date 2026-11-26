-- P2: roles are provisioned by the database owner. New users can only become students.
create table if not exists public.p2_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'student' check (role in ('student', 'advisor')),
  advisor_id uuid references public.p2_profiles(user_id),
  created_at timestamptz not null default now(),
  check (role = 'student' or advisor_id is null)
);

create table if not exists public.p2_submissions (
  id uuid primary key,
  student_id uuid not null references public.p2_profiles(user_id),
  advisor_id uuid not null references public.p2_profiles(user_id),
  description text not null check (char_length(btrim(description)) between 5 and 500),
  hours numeric(5,2) not null check (hours > 0 and hours <= 24),
  created_at timestamptz not null default now()
);
create index if not exists p2_submissions_advisor_idx on public.p2_submissions(advisor_id, created_at desc);
create index if not exists p2_submissions_student_idx on public.p2_submissions(student_id, created_at desc);

create table if not exists public.p2_reviews (
  submission_id uuid primary key references public.p2_submissions(id) on delete cascade,
  advisor_id uuid not null references public.p2_profiles(user_id),
  decision text not null check (decision in ('approved', 'rejected')),
  note text not null default '' check (char_length(note) <= 500),
  created_at timestamptz not null default now()
);

alter table public.p2_profiles enable row level security;
alter table public.p2_submissions enable row level security;
alter table public.p2_reviews enable row level security;
revoke all on public.p2_profiles, public.p2_submissions, public.p2_reviews from anon, authenticated;
grant select, insert on public.p2_profiles to authenticated;
grant select, insert on public.p2_submissions to authenticated;
grant select, insert on public.p2_reviews to authenticated;

create policy p2_profiles_read_self on public.p2_profiles for select to authenticated
  using (user_id = (select auth.uid()));
create policy p2_profiles_join_as_student on public.p2_profiles for insert to authenticated
  with check (user_id = (select auth.uid()) and role = 'student' and advisor_id is null);

create policy p2_submissions_read_participants on public.p2_submissions for select to authenticated
  using (student_id = (select auth.uid()) or advisor_id = (select auth.uid()));
create policy p2_submissions_student_insert on public.p2_submissions for insert to authenticated
  with check (
    student_id = (select auth.uid())
    and exists (
      select 1 from public.p2_profiles p
      where p.user_id = (select auth.uid()) and p.role = 'student' and p.advisor_id = p2_submissions.advisor_id
    )
  );

create policy p2_reviews_read_participants on public.p2_reviews for select to authenticated
  using (exists (
    select 1 from public.p2_submissions s
    where s.id = submission_id and (s.student_id = (select auth.uid()) or s.advisor_id = (select auth.uid()))
  ));
create policy p2_reviews_advisor_insert on public.p2_reviews for insert to authenticated
  with check (
    advisor_id = (select auth.uid())
    and exists (select 1 from public.p2_profiles p where p.user_id = (select auth.uid()) and p.role = 'advisor')
    and exists (select 1 from public.p2_submissions s where s.id = submission_id and s.advisor_id = (select auth.uid()))
  );
