# V30 Beta Deployment Notes

## Fixed / Added

- Reduced the weapon image border so it fits closer to the actual image.
- Centered weapon images regardless of different photo dimensions.
- Added weapon category dropdown:
  - Primaries
  - SMGs
  - Support Weapons
  - Sniper / Marksman
  - Secondaries
  - Melee
- Added weapon selection dropdown after choosing category.
- Removed duplicate attachment details label inside weapon cards.
- Admin Panel link is hidden from normal navigation.
- Admin page blocks non-admin users after deployment role sync is working.

## Admin Panel

Admin Panel exists at:

```text
admin.html
```

But normal users will not see it in the sidebar. If they open it directly without admin access, they will see a locked page.

Full admin tools should be added after deployment confirms:

```text
profiles
user_access
access_audit_logs
```

are correctly populated.

## Deployment

Deploy the `rs_armory_final` folder to Vercel, then add the deployed URLs to Supabase Authentication URL Configuration.
