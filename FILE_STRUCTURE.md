# Red Squadron Armory File Structure

The project files are now organized by type.

```text
rs_armory_final/
├── index.html
├── login.html
├── callback.html
├── dashboard.html
├── armory.html
├── css/
│   └── styles.css
├── js/
│   ├── config.js
│   ├── auth.js
│   ├── data.js
│   ├── app.js
│   └── page-init.js
├── assets/
│   ├── logos
│   ├── uniform images
│   └── background images
└── supabase/
    ├── v20_role_sync.sql
    ├── edge-function-secrets.example.env
    └── functions/
        └── sync-discord-roles/
            └── index.ts
```

## File purpose

```text
HTML files = page layout only
css/styles.css = all styling
js/config.js = Supabase public frontend configuration
js/auth.js = Discord login, callback, session, sign out, access checks
js/data.js = armory content data
js/app.js = dashboard and armory UI rendering
js/page-init.js = page-specific startup logic
assets/ = logos, icons, backgrounds, images
supabase/ = SQL and Edge Function backend files
```

## Notes

- HTML files no longer contain inline JavaScript.
- JavaScript files are grouped in `js/`.
- CSS is grouped in `css/`.
- Existing links were updated so the website remains connected.
