# Deployment Guide

## Vercel

Deploy the contents of `rs_armory_final` as a static site.

Recommended Vercel settings:

```text
Framework / Preset: Other
Root Directory: ./
Build Command: blank
Output Directory: blank
Install Command: blank
```

## Supabase Redirect URLs

In Supabase:

```text
Authentication → URL Configuration
```

Set Site URL:

```text
https://red-squadron-armory.vercel.app
```

Add Redirect URLs:

```text
https://red-squadron-armory.vercel.app/login.html
https://red-squadron-armory.vercel.app/callback.html
https://red-squadron-armory.vercel.app/dashboard.html
https://red-squadron-armory.vercel.app/admin.html
```

Keep local URLs if local testing is still needed.
