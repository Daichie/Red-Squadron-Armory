# V35 Standalone Callback Fix

This version makes `callback.html` directly process the Supabase OAuth URL hash.

It does not wait for the external auth helper before continuing. It:

- Reads `#access_token=...`
- Stores the token in localStorage
- Decodes the user id from the JWT
- Redirects to dashboard.html

After deployment, verify:

```text
https://red-squadron-armory.vercel.app/callback.html
```

shows version:

```text
V35_STANDALONE_CALLBACK
```

when opened without a token.
