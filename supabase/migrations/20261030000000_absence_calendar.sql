alter table public.subjects drop constraint if exists subjects_id_user_id_key;
alter table public.subjects add constraint subjects_id_user_id_key unique (id, user_id);

create table if not exists public.absence_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null,
  absence_date date not null default current_date check (absence_date <= current_date),
  created_at timestamptz not null default now(),
  constraint absence_records_subject_owner_fk foreign key (subject_id, user_id)
    references public.subjects(id, user_id) on delete cascade
);

create index if not exists absence_records_user_date_idx on public.absence_records(user_id, absence_date desc);
alter table public.absence_records enable row level security;

drop policy if exists "absence_records_select_own" on public.absence_records;
create policy "absence_records_select_own" on public.absence_records for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "absence_records_insert_own" on public.absence_records;
create policy "absence_records_insert_own" on public.absence_records for insert to authenticated with check ((select auth.uid()) = user_id);
grant select, insert on public.absence_records to authenticated;

create or replace function public.increment_subject_absences_on_record()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.subjects
  set absences = absences + 1
  where id = new.subject_id and user_id = new.user_id;
  return new;
end;
$$;

drop trigger if exists absence_records_increment_subject on public.absence_records;
create trigger absence_records_increment_subject
after insert on public.absence_records
for each row execute function public.increment_subject_absences_on_record();
