-- Red Squadron Armory V56
-- Fixes Discord role sync database writes without relying on SERVICE_ROLE_KEY.
-- The Edge Function now writes through this SECURITY DEFINER RPC using the logged-in user's JWT.

alter table public.profiles
  add column if not exists last_detected_roles text[] not null default '{}',
  add column if not exists last_detected_role_names text[] not null default '{}',
  add column if not exists last_detected_editor_keys text[] not null default '{}',
  add column if not exists last_role_sync timestamptz;

-- Allow authenticated users to read role mappings and profile data needed by the sync UI.
drop policy if exists "Authenticated users can read profile display names" on public.profiles;
create policy "Authenticated users can read profile display names"
on public.profiles
for select
to authenticated
using (true);

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

-- Keep current known editor role IDs. Update if Discord role IDs change.
insert into public.armory_editor_roles (access_key, discord_role_id, label, is_active)
values
  ('command', '1500678852110975176', 'Command', true),
  ('s4_rd', '1454438689403834562', 'S4 - Research & Development', true),
  ('admin', '1441784928319836363', 'Admin', true)
on conflict (discord_role_id) do update
set access_key = excluded.access_key,
    label = excluded.label,
    is_active = true;

create or replace function public.apply_discord_role_sync(
  p_discord_user_id text,
  p_discord_username text,
  p_display_name text,
  p_main_branch text,
  p_role_ids text[],
  p_role_names text[],
  p_editor_keys text[],
  p_access_keys text[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_key text;
  v_allowed text[] := array[
    'general','src','lrr','kalasag','haribon',
    'uav_operator','marksman','combat_medic','rto',
    'admin','command','s4_rd'
  ];
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.profiles (
    id,
    discord_user_id,
    discord_username,
    display_name,
    main_branch,
    is_active,
    last_detected_roles,
    last_detected_role_names,
    last_detected_editor_keys,
    last_role_sync,
    created_at,
    updated_at
  ) values (
    v_user,
    nullif(p_discord_user_id, ''),
    coalesce(nullif(p_discord_username, ''), 'Discord User'),
    coalesce(nullif(p_display_name, ''), nullif(p_discord_username, ''), 'Discord User'),
    coalesce(nullif(p_main_branch, ''), 'general'),
    true,
    coalesce(p_role_ids, '{}'::text[]),
    coalesce(p_role_names, '{}'::text[]),
    coalesce(p_editor_keys, '{}'::text[]),
    now(),
    now(),
    now()
  )
  on conflict (id) do update set
    discord_user_id = coalesce(excluded.discord_user_id, public.profiles.discord_user_id),
    discord_username = excluded.discord_username,
    display_name = excluded.display_name,
    main_branch = excluded.main_branch,
    is_active = true,
    last_detected_roles = excluded.last_detected_roles,
    last_detected_role_names = excluded.last_detected_role_names,
    last_detected_editor_keys = excluded.last_detected_editor_keys,
    last_role_sync = now(),
    updated_at = now();

  delete from public.user_access where user_id = v_user;

  foreach v_key in array coalesce(p_access_keys, '{}'::text[]) loop
    if v_key = any(v_allowed) then
      insert into public.user_access (user_id, access_key)
      values (v_user, v_key)
      on conflict do nothing;
    end if;
  end loop;

  -- If no mapped access was found, keep the user at least in General.
  if not exists (select 1 from public.user_access where user_id = v_user) then
    insert into public.user_access (user_id, access_key)
    values (v_user, 'general')
    on conflict do nothing;
  end if;
end;
$$;

grant execute on function public.apply_discord_role_sync(text, text, text, text, text[], text[], text[], text[]) to authenticated;

-- Recreate editor checker so database RLS trusts both user_access and last detected editor keys.
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
