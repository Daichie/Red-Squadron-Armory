# Red Squadron Armory V20 — Automatic Discord Role Access Setup

This version prepares the site for automatic Discord role-based access.

## What this version adds

- Locked/unlocked armory cards based on Discord role access
- Supabase SQL update file
- Supabase Edge Function: `sync-discord-roles`
- Discord Role ID to access key mapping
- Local fallback still works for testing

## Final access flow

```text
Member logs in with Discord
↓
Supabase verifies the user
↓
Website calls sync-discord-roles Edge Function
↓
Edge Function asks Discord API for the user's server roles
↓
Supabase updates user_access
↓
Website unlocks allowed armories
```

## Required Discord Role IDs

Get these from Discord:

```text
Server ID / Guild ID =
Scout Ranger Company Role ID =
Light Reaction Regiment Role ID =
Kalasag Element Role ID =
Haribon Aviation Unit Role ID =
UAV Operator Role ID =
Marksman Role ID =
Combat Medic Role ID =
RTO Role ID =
Command/Admin Role ID optional =
```

To copy IDs:

```text
Discord Settings → Advanced → Developer Mode ON
Right-click server → Copy Server ID
Server Settings → Roles → right-click role → Copy Role ID
```

## Step 1 — Run Supabase SQL

Open Supabase SQL Editor and run:

```text
supabase/v20_role_sync.sql
```

This adds:

```text
last_role_sync
last_detected_roles
access_audit_logs
user_access_overview
```

## Step 2 — Create/Add Discord Bot

In Discord Developer Portal:

```text
https://discord.com/developers/applications
```

Open your app:

```text
Red Squadron Armory Access
```

Go to:

```text
Bot → Add Bot
```

Copy the Bot Token. Do not share it publicly.

Enable:

```text
Server Members Intent
```

Invite bot to your server from:

```text
OAuth2 → URL Generator
```

Scopes:

```text
bot
```

Bot permissions:

```text
View Channels
```

The bot does not need Administrator.

## Step 3 — Add Supabase Edge Function secrets

In Supabase, secrets are backend-only. Do not put bot token in browser files.

Use these values from:

```text
supabase/edge-function-secrets.example.env
```

Required secrets:

```text
DISCORD_BOT_TOKEN
DISCORD_GUILD_ID
ROLE_SRC
ROLE_LRR
ROLE_KALASAG
ROLE_HARIBON
ROLE_UAV_OPERATOR
ROLE_MARKSMAN
ROLE_COMBAT_MEDIC
ROLE_RTO
ROLE_ADMIN optional
SERVICE_ROLE_KEY
```

You can set them through Supabase CLI:

```bash
supabase secrets set DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
supabase secrets set DISCORD_GUILD_ID="YOUR_SERVER_ID"
supabase secrets set ROLE_SRC="ROLE_ID"
supabase secrets set ROLE_LRR="ROLE_ID"
supabase secrets set ROLE_KALASAG="ROLE_ID"
supabase secrets set ROLE_HARIBON="ROLE_ID"
supabase secrets set ROLE_UAV_OPERATOR="ROLE_ID"
supabase secrets set ROLE_MARKSMAN="ROLE_ID"
supabase secrets set ROLE_COMBAT_MEDIC="ROLE_ID"
supabase secrets set ROLE_RTO="ROLE_ID"
supabase secrets set SERVICE_ROLE_KEY="YOUR_BACKEND_SECRET_KEY"
```

## Step 4 — Deploy Edge Function

From the project folder:

```bash
supabase functions deploy sync-discord-roles
```

If you are not using Supabase CLI yet, install/login/link first:

```bash
npm install -g supabase
supabase login
supabase link --project-ref gcvmszkvdphsidcfkwuq
```

## Step 5 — Test

1. Deploy the site or run locally.
2. Login with Discord.
3. The website will call `sync-discord-roles`.
4. Check Supabase tables:

```text
profiles
user_access
access_audit_logs
```

## Important

Local fallback may still show all armories for testing. Real locking works best after deployment with a real Supabase session.

For final production:

```text
Deploy website to Vercel
Add Vercel URLs in Supabase URL Configuration
Test Discord login
Deploy Edge Function
Add bot secrets
Test automatic role access
```


# V23 Pre-Filled Red Squadron Role IDs

These IDs are already added inside:

```text
supabase/edge-function-secrets.example.env
supabase/discord-role-mapping.md
```

Use these Supabase CLI secret commands later:

```bash
supabase secrets set DISCORD_GUILD_ID="1441770925728071752"
supabase secrets set ROLE_GENERAL="1441963405476106320"
supabase secrets set ROLE_SRC="1441965170204082248"
supabase secrets set ROLE_LRR="1441965172792234138"
supabase secrets set ROLE_KALASAG="1441965171349127192"
supabase secrets set ROLE_HARIBON="1441965171466567801"
supabase secrets set ROLE_UAV_OPERATOR="1487116113732177980"
supabase secrets set ROLE_MARKSMAN="1441969067832639508"
supabase secrets set ROLE_COMBAT_MEDIC="1441968314166411325"
supabase secrets set ROLE_RTO="1441969064938311822"
supabase secrets set ROLE_ADMIN="1441784928319836363"
```

You still need to add these private secrets yourself:

```bash
supabase secrets set DISCORD_BOT_TOKEN="YOUR_PRIVATE_BOT_TOKEN"
supabase secrets set SERVICE_ROLE_KEY="YOUR_PRIVATE_SERVICE_ROLE_KEY"
```

Never place the private bot token or service role key in browser files.


## V24 Secret Name Fix

Supabase does not allow custom secret names that start with:

```text
SUPABASE_
```

So use this instead:

```text
SERVICE_ROLE_KEY
```

Use your `sb_secret_...` Supabase secret key as the value.

Correct:

```text
Name: SERVICE_ROLE_KEY
Value: your sb_secret_... key
```

Wrong:

```text
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_SECRET_KEY
```
