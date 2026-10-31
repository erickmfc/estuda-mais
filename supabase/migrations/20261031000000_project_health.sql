-- A public, read-only row for scheduled uptime checks. It contains no user data.
create table if not exists public.project_health (
  id smallint primary key default 1 check (id = 1)
);

insert into public.project_health (id)
values (1)
on conflict (id) do nothing;

alter table public.project_health enable row level security;

drop policy if exists project_health_public_read on public.project_health;
create policy project_health_public_read
  on public.project_health
  for select
  to anon
  using (id = 1);

revoke all privileges on table public.project_health
  from public, anon, authenticated, service_role;
grant select on public.project_health to anon;

