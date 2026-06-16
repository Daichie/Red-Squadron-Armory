-- Red Squadron Armory V51 Sync Schema Compatibility Check
-- Optional diagnostic query after deploying V51. No destructive changes.

select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
order by ordinal_position;

select discord_username, last_detected_roles, last_role_sync
from public.profiles
order by updated_at desc
limit 20;
