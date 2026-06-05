# V38 Role Sync Read Fix

This fixes the next access issue.

## Changes

- Removed `.eq("is_active", true)` from `user_access` reading because your table does not have `is_active`.
- `rsSyncDiscordRoles()` now uses direct `fetch()` to the Edge Function with:
  - Authorization bearer token
  - apikey header
  - JSON body
- Console will now show detailed role sync result or error.

## After deployment

Open dashboard, press F12 Console, run:

```js
await rsSyncDiscordRoles()
```

Expected success result:

```json
{
  "ok": true,
  "access_keys": ["general", "..."]
}
```
