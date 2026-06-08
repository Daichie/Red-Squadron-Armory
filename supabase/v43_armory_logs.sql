-- Red Squadron Armory V43 Admin Monitor Logs
-- Run this after v41_live_armory_editor.sql.
-- This adds a safe audit log table for Command / S4 R&D / Admin actions.

create table if not exists public.armory_item_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null check (action in ('create', 'update', 'delete')),
  item_id uuid,
  item_name text,
  unit_slug text,
  item_type text,
  actor_id uuid references auth.users(id),
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists armory_item_logs_created_at_idx
on public.armory_item_logs (created_at desc);

alter table public.armory_item_logs enable row level security;

drop policy if exists "Armory editors can view logs" on public.armory_item_logs;
drop policy if exists "Armory editors can insert logs" on public.armory_item_logs;

create policy "Armory editors can view logs"
on public.armory_item_logs
for select
to authenticated
using (
  exists (
    select 1 from public.user_access ua
    where ua.user_id = auth.uid()
    and ua.access_key in ('admin', 'command', 's4_rd')
  )
);

create policy "Armory editors can insert logs"
on public.armory_item_logs
for insert
to authenticated
with check (
  exists (
    select 1 from public.user_access ua
    where ua.user_id = auth.uid()
    and ua.access_key in ('admin', 'command', 's4_rd')
  )
);
