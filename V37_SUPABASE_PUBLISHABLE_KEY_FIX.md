# V37 Supabase Publishable Key Fix

Updated:

```text
js/config.js
```

Fixed:

```text
publishableKey
```

This should resolve:

```text
Invalid API key
401 Unauthorized
```

After uploading to GitHub and Vercel redeploys, verify:

```text
https://red-squadron-armory.vercel.app/js/config.js
```

Then test:

```text
https://red-squadron-armory.vercel.app/login.html
```
