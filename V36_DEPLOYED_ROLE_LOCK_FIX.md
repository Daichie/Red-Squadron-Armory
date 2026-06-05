# V36 Deployed Role Lock Fix

This version fixes deployed access behavior.

- Deployed site now fails closed.
- General Armory stays open.
- Other armories lock unless Discord role sync grants access.
- Admin unlocks all.
- Localhost/127.0.0.1 still uses preview fallback for development.
- `rsGetAllowedSections()` no longer reads all `armory_sections`.
- Access now reads from cached `rsArmoryAccessKeys` or `user_access` for the logged-in user.
