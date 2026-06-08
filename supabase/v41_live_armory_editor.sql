-- Red Squadron Armory V41 Live Editor
-- Run this AFTER the existing schema/role-sync SQL.
-- Gives Command / S4 - Research and Development / Admin editor access through the existing user_access system.

create table if not exists public.armory_items (
  id uuid primary key default gen_random_uuid(),
  unit_slug text not null references public.armory_sections(slug) on update cascade on delete cascade,
  item_type text not null check (item_type in ('uniform', 'weapon', 'utility')),
  name text not null,
  authorized text,
  image_url text,
  second_image_url text,
  details jsonb not null default '{}'::jsonb,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists armory_items_unit_type_idx
on public.armory_items (unit_slug, item_type, is_active, sort_order);

alter table public.armory_items enable row level security;

drop policy if exists "Users can view armory items they can access" on public.armory_items;
drop policy if exists "Armory editors can insert items" on public.armory_items;
drop policy if exists "Armory editors can update items" on public.armory_items;
drop policy if exists "Armory editors can delete items" on public.armory_items;

-- View rule: user can view general items, any section matching their access key, or everything if admin/editor.
create policy "Users can view armory items they can access"
on public.armory_items
for select
to authenticated
using (
  exists (
    select 1
    from public.armory_sections s
    where s.slug = armory_items.unit_slug
    and (
      s.access_key = 'general'
      or exists (
        select 1 from public.user_access ua
        where ua.user_id = auth.uid()
        and ua.access_key in (s.access_key, 'admin', 'command', 's4_rd')
      )
    )
  )
);

create policy "Armory editors can insert items"
on public.armory_items
for insert
to authenticated
with check (
  exists (
    select 1 from public.user_access ua
    where ua.user_id = auth.uid()
    and ua.access_key in ('admin', 'command', 's4_rd')
  )
);

create policy "Armory editors can update items"
on public.armory_items
for update
to authenticated
using (
  exists (
    select 1 from public.user_access ua
    where ua.user_id = auth.uid()
    and ua.access_key in ('admin', 'command', 's4_rd')
  )
)
with check (
  exists (
    select 1 from public.user_access ua
    where ua.user_id = auth.uid()
    and ua.access_key in ('admin', 'command', 's4_rd')
  )
);

create policy "Armory editors can delete items"
on public.armory_items
for delete
to authenticated
using (
  exists (
    select 1 from public.user_access ua
    where ua.user_id = auth.uid()
    and ua.access_key in ('admin', 'command', 's4_rd')
  )
);

-- Public bucket is used so item images can render on the static deployed site.
insert into storage.buckets (id, name, public)
values ('armory', 'armory', true)
on conflict (id) do update set public = true;

drop policy if exists "Authenticated users can view armory bucket" on storage.objects;
drop policy if exists "Armory editors can upload images" on storage.objects;
drop policy if exists "Armory editors can update images" on storage.objects;
drop policy if exists "Armory editors can delete images" on storage.objects;

create policy "Authenticated users can view armory bucket"
on storage.objects
for select
to authenticated
using (bucket_id = 'armory');

create policy "Armory editors can upload images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'armory'
  and exists (
    select 1 from public.user_access ua
    where ua.user_id = auth.uid()
    and ua.access_key in ('admin', 'command', 's4_rd')
  )
);

create policy "Armory editors can update images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'armory'
  and exists (
    select 1 from public.user_access ua
    where ua.user_id = auth.uid()
    and ua.access_key in ('admin', 'command', 's4_rd')
  )
);

create policy "Armory editors can delete images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'armory'
  and exists (
    select 1 from public.user_access ua
    where ua.user_id = auth.uid()
    and ua.access_key in ('admin', 'command', 's4_rd')
  )
);
