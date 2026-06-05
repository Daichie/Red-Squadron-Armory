-- Red Squadron Armory V20 Automatic Discord Role Access
-- Run this in Supabase SQL Editor after the earlier schema.sql.
-- Safe to run multiple times.

alter table public.profiles
  add column if not exists last_role_sync timestamptz,
  add column if not exists last_detected_roles text[] default '{}';

create table if not exists public.access_audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  action text not null,
  details jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.access_audit_logs enable row level security;

drop policy if exists "Users can view own audit logs" on public.access_audit_logs;

create policy "Users can view own audit logs"
on public.access_audit_logs
for select
to authenticated
using (auth.uid() = user_id);

-- Optional helper view for admin/manual checking inside Supabase.
create or replace view public.user_access_overview as
select
  p.id as user_id,
  p.discord_username,
  p.discord_user_id,
  p.main_branch,
  p.last_role_sync,
  coalesce(array_agg(ua.access_key order by ua.access_key) filter (where ua.access_key is not null), '{}') as access_keys
from public.profiles p
left join public.user_access ua on ua.user_id = p.id
group by p.id, p.discord_username, p.discord_user_id, p.main_branch, p.last_role_sync;
