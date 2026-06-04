# V33 Callback Force Continue Fix

Use this if deployed site still shows "Session verification failed" after Discord login.

This version:

- Adds visible callback version marker: `V33_CALLBACK_FORCE_CONTINUE`
- Accepts the Supabase `access_token` from the callback hash
- Tries normal Supabase session first
- Falls back to fetching user from `/auth/v1/user`
- Falls back to decoding the JWT payload if needed
- Stores token and redirects to dashboard if user id is available

After uploading to GitHub, confirm Vercel redeployed the latest commit before testing.
