-- Red Squadron Armory Supabase Setup
-- Run this in Supabase SQL Editor.
-- This creates profiles, user access rows, armory sections, and RLS policies.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  discord_user_id text unique,
  discord_username text,
  display_name text,
  main_branch text default 'general',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.user_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  access_key text not null,
  created_at timestamptz default now(),
  unique(user_id, access_key)
);

create table if not exists public.armory_sections (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  access_key text not null,
  section_type text default 'branch',
  description text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.user_access enable row level security;
alter table public.armory_sections enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can view own access" on public.user_access;
drop policy if exists "Authenticated users can view armory sections they can access" on public.armory_sections;

create policy "Users can view own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Users can view own access"
on public.user_access
for select
to authenticated
using (auth.uid() = user_id);

create policy "Authenticated users can view armory sections they can access"
on public.armory_sections
for select
to authenticated
using (
  access_key = 'general'
  or exists (
    select 1
    from public.user_access ua
    where ua.user_id = auth.uid()
    and ua.access_key = armory_sections.access_key
  )
);

insert into public.armory_sections (slug, name, access_key, section_type, description)
values
('general', 'General Armory', 'general', 'branch', 'Faction-wide standard uniforms, weapons, and utilities.'),
('lrr', 'Light Reaction Regiment Armory', 'lrr', 'branch', 'LRR branch armory access.'),
('scout-ranger', 'Scout Ranger Company Armory', 'src', 'branch', 'SRC branch armory access.'),
('kalasag', 'Kalasag Element Armory', 'kalasag', 'branch', 'Kalasag Element armory access.'),
('haribon', 'Haribon Aviation Unit Armory', 'haribon', 'branch', 'Haribon Aviation Unit armory access.'),
('uav-operator', 'UAV Operator Certified Armory', 'uav_operator', 'certification', 'UAV Operator certified access.'),
('marksman', 'Marksman Certified Armory', 'marksman', 'certification', 'Marksman certified access.'),
('combat-medic', 'Combat Medic Certified Armory', 'combat_medic', 'certification', 'Combat Medic certified access.'),
('rto', 'RTO Certified Armory', 'rto', 'certification', 'Radio Telephone Operator certified access.')
on conflict (slug) do update set
  name = excluded.name,
  access_key = excluded.access_key,
  section_type = excluded.section_type,
  description = excluded.description;
