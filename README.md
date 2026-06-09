# Red Squadron Centralized Armory

A private Red Squadron armory portal with Discord login, Supabase profile storage, and Discord role-based armory access.

## Main pages

```text
index.html       Landing page
login.html       Discord login
callback.html    OAuth callback handler
dashboard.html   Armory dashboard
armory.html      Armory details
admin.html       Admin panel placeholder / restricted page
```

## Main folders

```text
assets/          Images, logos, placeholders, uniforms, weapons
css/             Stylesheet
js/              Frontend logic, auth, role lock, data
supabase/        SQL files and Edge Function source
docs/            Deployment and setup notes
```

## Current access behavior

```text
General Armory = open to verified users
Other armories = locked unless Discord role sync grants access
Command/Admin = unlocks all armories and admin tools
```

## Deployment

Read:

```text
docs/DEPLOYMENT_GUIDE.md
docs/SUPABASE_EDGE_FUNCTION.md
```

## Supabase function deploy

From inside `rs_armory_final`:

```powershell
supabase.cmd functions deploy sync-discord-roles --project-ref gcvmszkvdphsidcfkwuq
```

## Notes

Do not commit or expose Discord bot tokens, service role keys, or secret keys. Only the Supabase publishable key belongs in `js/config.js`.
