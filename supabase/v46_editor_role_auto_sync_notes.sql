-- V46 Admin/Command/S4 auto-sync notes
-- No table changes required if V45 SQL already ran successfully.
-- Required Edge Function secrets for automatic editor publishing:
-- ROLE_COMMAND = Discord role ID for Command
-- ROLE_S4_RD = Discord role ID for S4 - Research and Development
-- ROLE_ADMIN = Discord role ID for Admin (add this if you have a separate Admin Discord role)
-- Optional: ROLE_STAFF can map a Discord staff role to admin/editor access if you decide to use it.

-- After deploying V46 Edge Function, users must logout/login or open admin.html once
-- to trigger sync-discord-roles and populate public.user_access automatically.

select 'V46 has no required SQL migration. Deploy sync-discord-roles and set ROLE_ADMIN if needed.' as note;
