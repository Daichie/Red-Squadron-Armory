-- Red Squadron Armory V54
-- Discord role sync reliability + monitor log actor names.

alter table public.profiles
  add column if not exists last_detected_roles text[] not null default '{}',
  add column if not exists last_detected_role_names text[] not null default '{}',
  add column if not exists last_detected_editor_keys text[] not null default '{}',
  add column if not exists last_role_sync timestamptz;

alter table public.armory_item_logs
  add column if not exists actor_name text;

-- Allow authenticated app pages to resolve display names for monitor logs.
drop policy if exists "Authenticated users can read profile display names" on public.profiles;
create policy "Authenticated users can read profile display names"
on public.profiles
for select
to authenticated
using (true);

-- Backfill old monitor logs so they show usernames instead of UUIDs.
update public.armory_item_logs l
set actor_name = coalesce(p.display_name, p.discord_username, l.actor_name)
from public.profiles p
where l.actor_id = p.id
  and (l.actor_name is null or l.actor_name = '' or l.actor_name = l.actor_id::text);

-- Ensure the editor role mapping table exists and remains readable.
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

-- Keep current known editor roles. Update these values if Discord role IDs change.
insert into public.armory_editor_roles (access_key, discord_role_id, label, is_active)
values
  ('command', '1500678852110975176', 'Command', true),
  ('s4_rd', '1454438689403834562', 'S4 - Research & Development', true),
  ('admin', '1441784928319836363', 'Admin', true)
on conflict (discord_role_id) do update
set access_key = excluded.access_key,
    label = excluded.label,
    is_active = true;

-- Editor check: user_access, detected editor keys, or detected Discord role IDs.
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

-- Sync editor access rows automatically whenever roles are written to profiles.
create or replace function public.sync_editor_user_access_from_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(array_length(new.last_detected_roles, 1), 0) = 0
     and coalesce(array_length(new.last_detected_editor_keys, 1), 0) = 0 then
    return new;
  end if;

  insert into public.user_access (user_id, access_key)
  select distinct new.id, er.access_key
  from public.armory_editor_roles er
  where er.is_active = true
    and er.discord_role_id = any(coalesce(new.last_detected_roles, '{}'::text[]))
  on conflict do nothing;

  insert into public.user_access (user_id, access_key)
  select distinct new.id, key
  from unnest(coalesce(new.last_detected_editor_keys, '{}'::text[])) as key
  where key in ('admin', 'command', 's4_rd')
  on conflict do nothing;

  if public.is_armory_editor(new.id) then
    insert into public.user_access (user_id, access_key)
    values
      (new.id, 'general'), (new.id, 'src'), (new.id, 'lrr'), (new.id, 'kalasag'),
      (new.id, 'haribon'), (new.id, 'uav_operator'), (new.id, 'marksman'),
      (new.id, 'combat_medic'), (new.id, 'rto')
    on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_editor_user_access_from_profile on public.profiles;
create trigger trg_sync_editor_user_access_from_profile
after insert or update of last_detected_roles, last_detected_editor_keys
on public.profiles
for each row
execute function public.sync_editor_user_access_from_profile();

-- Rebuild access rows for users already synced.
insert into public.user_access (user_id, access_key)
select distinct p.id, er.access_key
from public.profiles p
join public.armory_editor_roles er
  on er.is_active = true
 and er.discord_role_id = any(coalesce(p.last_detected_roles, '{}'::text[]))
on conflict do nothing;

insert into public.user_access (user_id, access_key)
select distinct p.id, key
from public.profiles p
cross join lateral unnest(coalesce(p.last_detected_editor_keys, '{}'::text[])) as key
where key in ('admin', 'command', 's4_rd')
on conflict do nothing;

insert into public.user_access (user_id, access_key)
select distinct p.id, x.access_key
from public.profiles p
join public.user_access ua on ua.user_id = p.id and ua.access_key in ('admin','command','s4_rd')
cross join (
  values ('general'), ('src'), ('lrr'), ('kalasag'), ('haribon'), ('uav_operator'), ('marksman'), ('combat_medic'), ('rto')
) as x(access_key)
on conflict do nothing;
