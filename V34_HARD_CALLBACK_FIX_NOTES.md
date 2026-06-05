# V34 Hard Callback Fix

This version fixes the deployed login callback more aggressively.

It will:

1. Read `access_token` from the callback URL hash.
2. Store the token for the site session.
3. Try normal Supabase session.
4. Try Supabase `/auth/v1/user`.
5. Decode the JWT payload as a hard fallback.
6. Redirect to `dashboard.html` once a user ID is available.

This should prevent the site from getting stuck on the callback page.
