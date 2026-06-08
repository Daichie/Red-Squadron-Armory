# Supabase Edge Function Setup

The Edge Function source is here:

```text
supabase/functions/sync-discord-roles/index.ts
```

Deploy it from inside `rs_armory_final`:

```powershell
supabase.cmd functions deploy sync-discord-roles --project-ref gcvmszkvdphsidcfkwuq
```

Required Edge Function secrets:

```text
DISCORD_BOT_TOKEN
DISCORD_GUILD_ID
ROLE_GENERAL
ROLE_SRC
ROLE_LRR
ROLE_KALASAG
ROLE_HARIBON
ROLE_UAV_OPERATOR
ROLE_MARKSMAN
ROLE_COMBAT_MEDIC
ROLE_RTO
ROLE_ADMIN
SERVICE_ROLE_KEY
```

The site calls the function to read Discord roles and populate `user_access`.
