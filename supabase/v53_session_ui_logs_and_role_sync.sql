-- Red Squadron Armory V53
-- Session/UI polish + reliable Discord role sync schema + actor names in monitor logs.

alter table public.profiles
  add column if not exists last_detected_roles text[] not null default '{}',
  add column if not exists last_detected_role_names text[] not null default '{}',
  add column if not exists last_detected_editor_keys text[] not null default '{}',
  add column if not exists last_role_sync timestamptz;

alter table public.armory_item_logs
  add column if not exists actor_name text;

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
      select 1
      from public.user_access ua
      where ua.user_id = check_user
        and ua.access_key in ('admin', 'command', 's4_rd')
    )
    or exists (
      select 1
      from public.profiles p
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

-- Admin/editor users automatically receive all armory access rows.
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
      (new.id, 'general'),
      (new.id, 'src'),
      (new.id, 'lrr'),
      (new.id, 'kalasag'),
      (new.id, 'haribon'),
      (new.id, 'uav_operator'),
      (new.id, 'marksman'),
      (new.id, 'combat_medic'),
      (new.id, 'rto')
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

-- Policies for editor CRUD and storage uploads.
drop policy if exists "Armory editors can insert items" on public.armory_items;
drop policy if exists "Armory editors can update items" on public.armory_items;
drop policy if exists "Armory editors can delete items" on public.armory_items;

create policy "Armory editors can insert items"
on public.armory_items
for insert
to authenticated
with check (public.is_armory_editor(auth.uid()));

create policy "Armory editors can update items"
on public.armory_items
for update
to authenticated
using (public.is_armory_editor(auth.uid()))
with check (public.is_armory_editor(auth.uid()));

create policy "Armory editors can delete items"
on public.armory_items
for delete
to authenticated
using (public.is_armory_editor(auth.uid()));

insert into storage.buckets (id, name, public)
values ('armory', 'armory', true)
on conflict (id) do update set public = true;

drop policy if exists "Armory editors can upload images" on storage.objects;
drop policy if exists "Armory editors can update images" on storage.objects;
drop policy if exists "Armory editors can delete images" on storage.objects;

create policy "Armory editors can upload images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'armory' and public.is_armory_editor(auth.uid()));

create policy "Armory editors can update images"
on storage.objects
for update
to authenticated
using (bucket_id = 'armory' and public.is_armory_editor(auth.uid()))
with check (bucket_id = 'armory' and public.is_armory_editor(auth.uid()));

create policy "Armory editors can delete images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'armory' and public.is_armory_editor(auth.uid()));

-- Monitor logs policies.
alter table public.armory_item_logs enable row level security;

drop policy if exists "Armory editors can read logs" on public.armory_item_logs;
drop policy if exists "Armory editors can insert logs" on public.armory_item_logs;
drop policy if exists "Armory editors can clear logs" on public.armory_item_logs;

create policy "Armory editors can read logs"
on public.armory_item_logs
for select
to authenticated
using (public.is_armory_editor(auth.uid()));

create policy "Armory editors can insert logs"
on public.armory_item_logs
for insert
to authenticated
with check (public.is_armory_editor(auth.uid()));

create policy "Armory editors can clear logs"
on public.armory_item_logs
for delete
to authenticated
using (public.is_armory_editor(auth.uid()));

-- Rebuild access rows for profiles that already have detected roles.
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
  values
  ('general'), ('src'), ('lrr'), ('kalasag'), ('haribon'),
  ('uav_operator'), ('marksman'), ('combat_medic'), ('rto')
) as x(access_key)
on conflict do nothing;
