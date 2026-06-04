# V29 Deploy-Ready Fix Notes

## Fixed

- Removed duplicate weapon card label repetition.
- Removed duplicated "Attachment Details" label inside attachment box.
- Centered and normalized weapon photo containers.
- Kept weapon image on top but reduced size to avoid oversized layout.
- Reverted uniforms to the side-image layout.
- Added deployed-site callback handling so Supabase session is used in production.
- Local fallback remains available only for localhost / 127.0.0.1.
- Added initial Admin Panel placeholder page.

## Important for deployment

After Vercel deployment, add the deployed URLs to Supabase:

```text
Authentication → URL Configuration
```

Add:

```text
https://YOUR-VERCEL-URL.vercel.app/login.html
https://YOUR-VERCEL-URL.vercel.app/callback.html
https://YOUR-VERCEL-URL.vercel.app/dashboard.html
```

The role lock should work only after real deployed login creates a Supabase session and calls:

```text
sync-discord-roles
```

## Admin panel

Admin panel exists as:

```text
admin.html
```

Full admin data tools should be enabled after the role-lock test confirms that profiles, user_access, and access_audit_logs populate correctly.
