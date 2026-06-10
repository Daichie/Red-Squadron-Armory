-- Red Squadron Armory V55
-- Role sync diagnostics + required profile columns + log display name support.

alter table public.profiles
  add column if not exists last_detected_roles text[] not null default '{}',
  add column if not exists last_detected_role_names text[] not null default '{}',
  add column if not exists last_detected_editor_keys text[] not null default '{}',
  add column if not exists last_role_sync timestamptz;

alter table public.armory_item_logs
  add column if not exists actor_name text;

-- Let logged-in users resolve profile display names for monitor logs.
drop policy if exists "Authenticated users can read profile display names" on public.profiles;
create policy "Authenticated users can read profile display names"
on public.profiles
for select
to authenticated
using (true);

-- Backfill monitor logs with current username when possible.
update public.armory_item_logs l
set actor_name = coalesce(p.display_name, p.discord_username, l.actor_name)
from public.profiles p
where l.actor_id = p.id
  and (l.actor_name is null or l.actor_name = '' or l.actor_name = l.actor_id::text);

-- Ensure editor role table exists.
create table if not exists public.armory_editor_roles (
  id uuid primary key default gen_random_uuid(),
  access_key text not null check (access_key in ('admin', 'command', 's4_rd')),
  discord_role_id text not null unique,
  label text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.armory_editor_roles enable row level security;
drop policy if exists "Authenticated users can view editor role ids" on public.armory_editor_roles;
create policy "Authenticated users can view editor role ids"
on public.armory_editor_roles
for select
to authenticated
using (true);

-- Current known editor roles. Update values if Discord role IDs change.
insert into public.armory_editor_roles (access_key, discord_role_id, label, is_active)
values
  ('command', '1500678852110975176', 'Command', true),
  ('s4_rd', '1454438689403834562', 'S4 - Research & Development', true),
  ('admin', '1441784928319836363', 'Admin', true)
on conflict (discord_role_id) do update
set access_key = excluded.access_key,
    label = excluded.label,
    is_active = true;

create or replace function public.is_armory_editor(check_user uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
as $$
  select
    exists (
      select 1 from public.user_access ua
      where ua.user_id = check_user
        and ua.access_key in ('admin', 'command', 's4_rd')
    )
    or exists (
      select 1 from public.profiles p
      where p.id = check_user
        and coalesce(p.last_detected_editor_keys, '{}'::text[]) && array['admin','command','s4_rd']::text[]
    )
    or exists (
      select 1
      from public.profiles p
      join public.armory_editor_roles er
        on er.is_active = true
       and er.discord_role_id = any(coalesce(p.last_detected_roles, '{}'::text[]))
      where p.id = check_user
    );
$$;

grant execute on function public.is_armory_editor(uuid) to authenticated;
