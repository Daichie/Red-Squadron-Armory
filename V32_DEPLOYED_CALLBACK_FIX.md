# V32 Deployed Callback Fix

This version fixes the deployed callback flow when Supabase returns an `access_token` in the URL hash but does not create a normal stored browser session.

What changed:

- Stores the returned Supabase access token securely in browser localStorage for the active session.
- Fetches the Supabase user from `/auth/v1/user`.
- Syncs profile using an authenticated Supabase client with the returned token.
- Calls the `sync-discord-roles` Edge Function using the returned token.
- Clears token storage on sign out.

After uploading this version to GitHub/Vercel, redeploy and test Discord login again.
