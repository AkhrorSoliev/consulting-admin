# How to manage admin roles

Grant, change, or revoke access for admin users.

**You need this when:** onboarding a new staff member, offboarding one, or changing someone's permissions.

**Requires:** `super_admin` role.

---

## Create a new admin user

### Via the admin UI (recommended)

1. Sign in as `super_admin`.
2. Go to **Settings → Admins**.
3. Click **Add admin**.
4. Fill in:
   - **Email** — the account's sign-in address.
   - **Password** — an initial password (user can change on first login).
   - **Role** — `super_admin` / `admin` / `limited_admin`.
   - **Display name** — shown on comments, reactions, profile.
5. Save.

Behind the scenes this calls the `createUser` super-admin callable, which:

1. Creates the Firebase Auth user.
2. Sets the custom claim `role`.
3. Creates the matching `users/<uid>` profile doc.

### Via CLI (if UI is unavailable)

```bash
# From the functions directory, using the Admin SDK in a one-off script
node scripts/create-admin.js --email=new@example.com --role=admin
```

Check `functions/scripts/` for the script — names vary.

---

## Change an existing user's role

1. **Settings → Admins**.
2. Find the user in the list.
3. Click the role badge or edit icon.
4. Select the new role and save.

The user's ID token must be refreshed for the new role to take effect. Options:

- The user signs out and back in.
- The user stays signed in — the app automatically force-refreshes tokens periodically, so the new role kicks in within a few minutes.

If you need the change to apply immediately, tell the user to sign out + sign in.

---

## Disable a user (preserve data)

Use this when someone leaves temporarily or you want to suspend access without deleting the account.

1. **Settings → Admins** → find the user.
2. Click **Disable**.

Disabled users cannot sign in. Their `users/<uid>` profile and all comments/actions remain visible in the audit trail.

Re-enable with **Enable** on the same row.

---

## Delete a user permanently

> [!WARNING]
> This is permanent. Comments and reactions authored by this user will still show their UID, but the `users/<uid>` profile doc is removed — their display name and avatar will fall back to "Unknown user."

1. **Settings → Admins** → find the user.
2. **Delete**.

Prefer **Disable** unless you have a reason to hard-delete.

---

## Reset someone's password

1. **Settings → Admins** → find the user.
2. **Reset password**.
3. Enter a new temporary password. Tell the user to change it on their next login.

---

## Troubleshooting

### New admin logs in but sees "access denied"

Their ID token is stale. Tell them to sign out and back in, or wait a few minutes for the automatic refresh.

### I lost the only super_admin account

Last-resort recovery:

1. Use the Firebase CLI to set the claim directly:
   ```bash
   gcloud auth application-default login
   node <<EOF
   const admin = require('firebase-admin');
   admin.initializeApp();
   admin.auth().setCustomUserClaims('<target-uid>', { role: 'super_admin' });
   EOF
   ```
2. Have the user sign out + sign in.

If you don't have CLI access to the Firebase project, contact the project owner.

### Role shows as `undefined` in the UI

The custom claim wasn't set (possibly because `createUser` was called directly against Firebase Auth, skipping the claim-set step). Re-set via the UI or via `setUserRole`.

### `setUserRole` callable returns `permission-denied`

You're not signed in as `super_admin`. Check `firebase auth:export` or the Firebase console.

---

## Where the role lives

Understanding where the role is stored helps when something is off:

1. **Firebase Auth custom claim** — the source of truth. `request.auth.token.role` in rules and Function handlers reads this.
2. **`users/<uid>.role`** — a mirror for display purposes only. If these disagree, the custom claim wins.
3. **`settings/admins.admins[]`** — a legacy/display list for the Admins settings UI. Not used for authorization.

Always update via the UI or `setUserRole` callable so all three stay aligned.

---

## See also

- [../reference/admin-roles.md](../reference/admin-roles.md) — permission matrix per role
- [../explanation/security-model.md](../explanation/security-model.md) — how the role is enforced
- [../reference/cloud-functions.md](../reference/cloud-functions.md) — `setUserRole` and related callables
