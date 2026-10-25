-- Red Squadron Armory V45 RLS + Admin Polish
-- Run after V41/V43/V44 SQL.
-- Fixes publish/upload RLS by using a SECURITY DEFINER helper for editor checks.

create or replace function public.is_armory_editor(check_user uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_access ua
    where ua.user_id = check_user
      and ua.access_key in ('admin', 'command', 's4_rd')
  );
$$;

grant execute on function public.is_armory_editor(uuid) to authenticated;

-- Armory item policies
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

-- Storage policies
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
  and public.is_armory_editor(auth.uid())
);

create policy "Armory editors can update images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'armory'
  and public.is_armory_editor(auth.uid())
)
with check (
  bucket_id = 'armory'
  and public.is_armory_editor(auth.uid())
);

create policy "Armory editors can delete images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'armory'
  and public.is_armory_editor(auth.uid())
);

-- Log policies
drop policy if exists "Armory editors can view logs" on public.armory_item_logs;
drop policy if exists "Armory editors can insert logs" on public.armory_item_logs;
drop policy if exists "Armory editors can clear logs" on public.armory_item_logs;

create policy "Armory editors can view logs"
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
