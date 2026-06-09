-- Red Squadron Armory V49 Auto Editor Role Sync Table Failsafe
-- Run after V48. This reinforces automatic Command/S4/Admin publishing.

alter table public.profiles
  add column if not exists last_detected_role_names text[] not null default '{}',
  add column if not exists last_detected_editor_keys text[] not null default '{}';

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
  ('command', '1500678852110975176', 'Red Squadron Command', true),
  ('s4_rd', '1454438689403834562', 'S4 - Research and Development', true)
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

-- Rebuild item policies with the helper.
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

-- Rebuild storage policies with the helper.
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
