# Red Squadron Centralized Armory Website

Dedicated front-end armory system for Red Squadron personnel.

## Pages

- `index.html` — simple landing page
- `login.html` — Discord-style login screen, front-end preview only
- `dashboard.html` — main armory dashboard
- `armory.html?unit=general` — General Armory
- `armory.html?unit=lrr` — Light Reaction Regiment / LRR Armory
- `armory.html?unit=scout-ranger` — Scout Ranger Company Armory
- `armory.html?unit=kalasag` — Kalasag Element Armory
- `armory.html?unit=haribon` — Haribon Aviation Unit Armory

## Current Login Flow

The Discord login button is a front-end preview only. When clicked, it stores a temporary preview session in browser `localStorage` and opens the dashboard.

Real Discord login, Supabase Auth, backend role checking, and Discord bot access will be added later.

## How to Edit Armory Content

Open `data.js`.

Each armory unit has these sections:

- `uniforms`
- `weapons`
- `equipment`
- `accessories`

Example uniform entry:

```js
uniform(
  'Black Standard Uniform',
  'General Personnel / Operation Use',
  'Required vest setup here',
  'Required belt setup here',
  'Helmet/headgear here',
  'Accessories here',
  'Notes or restrictions here'
)
```

## How to Replace Placeholder Images

Recommended folders:

```text
assets/uniforms/
assets/weapons/
assets/equipment/
assets/accessories/
```

Then update the image path in `data.js`.

Example:

```js
uniformImage: 'assets/uniforms/black-standard.png'
wornImage: 'assets/uniforms/black-standard-worn.png'
```

Weapon image example:

```js
image: 'assets/weapons/example-primary.png'
```

Equipment image example:

```js
image: 'assets/equipment/vest-example.png'
```

## Favicon

Current favicon files:

- `assets/favicon.png`
- `assets/favicon.ico`

Replace these with the official Red Squadron logo/favicon later. Keep the same filenames to avoid editing the HTML.

## Testing Locally

Open `index.html` directly, or use VS Code Live Server.

Best method:

1. Open this folder in VS Code.
2. Install Live Server.
3. Right-click `index.html`.
4. Click **Open with Live Server**.

## Future Secure Version

For real access protection, move private armory content into Supabase tables and enable Row Level Security. The front-end files can be inspected by users, so do not place confidential final armory data in `data.js` once deployed publicly.

Recommended future stack:

- Supabase Auth with Discord provider
- Supabase profiles table
- Discord bot or Edge Function role checker
- Supabase Row Level Security
- Branch-based access rules


## V7 Content Update

This version includes the current collected uniform and weapon details for:

- General Armory
- Scout Ranger Company
- Light Reaction Regiment
- Kalasag Element
- Haribon Aviation Unit

Branch logos are stored here:

```text
assets/units/src-logo.png
assets/units/lrr-logo.png
assets/units/kalasag-logo.png
assets/units/haribon-logo.png
```

The General Armory uses:

```text
assets/logo.png
```

To replace placeholder uniform or weapon images, add files to:

```text
assets/uniforms/
assets/weapons/
assets/equipment/
assets/accessories/
```

Then edit the image path in `data.js`.

Important: this is still front-end preview data. Once Supabase login and RLS are connected, sensitive armory records should be moved from `data.js` into Supabase tables.


## V8 Utilities and Certification Armories

The previous `Accessories` section has been renamed to `Utilities`.

Armory tabs are now:

```text
Uniforms
Weapons / Armaments
Utilities
```

Added certification-based armory panels:

```text
UAV Operator Certified Armory
Marksman Certified Armory
Combat Medic Certified Armory
RTO Certified Armory
```

These are front-end preview sections for now. Later, Discord role checking can unlock them based on role IDs such as:

```text
ROLE_UAV_OPERATOR
ROLE_MARKSMAN
ROLE_COMBAT_MEDIC
ROLE_RTO
```

Utilities are edited in `data.js` inside the `utilities(section)` function.


## V9 RTO Certified Armory

Added:

```text
RTO Certified Armory
```

This panel is for certified Radio Telephone Operators and includes placeholder records for radio/comms equipment, PTT/headset setup, signal utilities, and role-based communication loadout.


## V10 Equipment Tab Removed

The `Equipment` tab was removed because most equipment details are already included inside each uniform setup. The armory now uses:

```text
Uniforms
Weapons / Armaments
Utilities
```

Uniform image placeholders were renamed to:

```text
Front View
Back View
```

Use `uniformImage` for the front view and `wornImage` for the back view inside `data.js`.


## V11 RTO Utility Update

Removed from RTO utilities:

```text
Spare Radio Battery
```


## V12 Supabase Discord Login Ready

Added files:

```text
config.js
auth.js
supabase/schema.sql
```

### Setup

1. Open `config.js`.
2. Paste your Supabase publishable key:

```js
publishableKey: "sb_publishable_..."
```

3. Do not paste secret keys, service role keys, or database passwords.
4. In Supabase SQL Editor, run:

```text
supabase/schema.sql
```

5. In Supabase, enable Discord Provider:

```text
Authentication → Providers → Discord
```

6. Add your Discord Application Client ID and Client Secret in Supabase.
7. Add the Supabase callback URL in Discord Developer Portal OAuth2 Redirects.
8. Add your local/site URL in Supabase Authentication URL Configuration.

Current login flow:

```text
Login with Discord → Supabase OAuth → dashboard.html
```

This version has real Supabase login wiring. Automatic Discord role checking/bot sync is not yet added.


## V12 Fixed Config

`config.js` has been fixed to use:

```js
window.RS_SUPABASE_CONFIG = { ... }
```

This allows `auth.js` to read the Supabase settings correctly.

If login still says Supabase is not configured, hard refresh the browser with:

```text
Ctrl + F5
```


## V13 OAuth Callback Fix

Updated `auth.js` to explicitly handle the Supabase OAuth callback:

```text
dashboard.html?code=...
```

The site now exchanges the OAuth code for a session before redirecting users away from the dashboard.


## V14 OAuth Code Exchange Fix

Updated `auth.js` to call:

```js
exchangeCodeForSession(url.searchParams.get("code"))
```

instead of passing the full callback URL. This fixes cases where Discord/Supabase returns to `dashboard.html?code=...` but the app redirects back to login.


## V15 Dedicated OAuth Callback

Login now returns to:

```text
callback.html
```

Then `callback.html` completes the Supabase session and redirects to:

```text
dashboard.html
```

Add these local redirect URLs in Supabase Authentication URL Configuration:

```text
http://127.0.0.1:5500/rs_armory_final/callback.html
http://localhost:5500/rs_armory_final/callback.html
http://127.0.0.1:5500/rs_armory_final/dashboard.html
http://localhost:5500/rs_armory_final/dashboard.html
```


## V16 Local OAuth Flow Patch

Updated login callback handling for local static testing:

- Uses browser implicit OAuth flow for local Live Server testing.
- Hides technical Supabase/PKCE errors from the user interface.
- Shows a clean message: `Session verification failed. Please return to login and try again.`


## V17 Hash Token Callback Fix

The Discord/Supabase callback may return tokens like this:

```text
callback.html#access_token=...&refresh_token=...
```

`callback.html` now reads those tokens, creates a Supabase session with `setSession()`, then redirects to:

```text
dashboard.html
```


## V18 Local Discord Login Fallback

Discord login already returns an `access_token` locally. Some static Live Server setups do not persist the Supabase browser session correctly, so V18 adds a local fallback:

```text
Discord authorize → callback.html receives access_token → local authorized session → dashboard.html
```

This is for local testing only. For final deployed security, use Supabase session + RLS and later the Discord role-checking bot/Edge Function.


## V19 Force Local Access Token Redirect

This version fixes the local Live Server callback loop.

If `callback.html` receives:

```text
#access_token=...
```

it immediately stores a local authorized session and redirects to:

```text
dashboard.html
```

This confirms Discord login works locally. Final deployed security should still use Supabase session + RLS + role-checking backend later.


## V20 Automatic Discord Role Access Ready

Added:

```text
supabase/v20_role_sync.sql
supabase/functions/sync-discord-roles/index.ts
supabase/edge-function-secrets.example.env
SUPABASE_DISCORD_ROLE_SETUP.md
```

The website now has locked card UI ready for real Discord role access.

Read:

```text
SUPABASE_DISCORD_ROLE_SETUP.md
```


## V21 Dashboard Render Fix

Fixed a JavaScript syntax issue from V20:

```js
async async function renderArmoryPage()
```

It is now:

```js
async function renderArmoryPage()
```

Also added a safe local fallback so dashboard cards still render while the Edge Function / Discord bot role sync is not deployed yet.


## V22 Organized Project Structure

The project has been cleaned up:

```text
HTML files stay in the root folder
CSS moved to css/styles.css
JavaScript moved to js/
Page startup scripts moved to js/page-init.js
Supabase backend files stay inside supabase/
Assets stay inside assets/
```

Read:

```text
FILE_STRUCTURE.md
```


## V23 Discord Role IDs Added

The Red Squadron Discord Server ID and Role IDs have been added to setup files.

New/updated:

```text
supabase/edge-function-secrets.example.env
supabase/discord-role-mapping.md
SUPABASE_DISCORD_ROLE_SETUP.md
```

Private values are still placeholders:

```text
DISCORD_BOT_TOKEN
SUPABASE_SERVICE_ROLE_KEY
```


## V24 Supabase Secret Name Fix

Changed backend secret name to:

```text
SERVICE_ROLE_KEY
```

because Supabase blocks custom secrets starting with `SUPABASE_`.

Use:

```text
Name: SERVICE_ROLE_KEY
Value: your sb_secret_... key
```


## V25 Photos + Organized Attachment Details

Added uploaded company photos into clean folders under:

```text
assets/companies/
```

Updated:

```text
js/data.js
js/app.js
css/styles.css
```

Weapon attachment details now display as organized spec rows for easier reading.

Read:

```text
PHOTO_UPDATE_NOTES.md
```


## V28 Layout Correction

Changes:

```text
Uniforms returned to side-image layout
Weapon photo remains on top
Weapon photo height balanced so the weapon is visible without being oversized
```


## V29 Deploy-Ready Fix

Fixed duplicate weapon labels/details, centered weapon photos, restored uniform side-layout, and adjusted OAuth callback behavior so deployed site uses real Supabase session instead of local fallback.

Added:

```text
admin.html
V29_DEPLOY_READY_NOTES.md
```


## V30 Beta Deployment Fix

Added weapon category + weapon selection dropdowns, centered weapon photos, reduced weapon image border, cleaned duplicate weapon labels, and hid Admin Panel from normal navigation.


## V32 Deployed Callback Fix

Fixed deployed OAuth callback handling when Supabase returns an access token in the URL hash but no normal browser session is detected.


## V33 Callback Force Continue Fix

Adds stronger deployed callback handling and version marker `V33_CALLBACK_FORCE_CONTINUE`.


## V34 Hard Callback Fix

Added a hard callback fallback that stores the returned access token and decodes the Supabase JWT if normal session/user lookup fails.


## V35 Standalone Callback Fix

The callback page now directly handles Supabase OAuth access tokens and redirects to dashboard without depending on the external callback function first.
