# Admin roles

The project uses four role values stored as Firebase Auth custom claim `role`. This doc is the permissions matrix.

For the _why_ see [../explanation/security-model.md](../explanation/security-model.md). For assigning roles see [../how-to/manage-admin-roles.md](../how-to/manage-admin-roles.md).

---

## Role values

| Value | Population | Intent |
|---|---|---|
| `super_admin` | 1–3 people | Full control: user management, role assignment, all settings, all candidate operations |
| `admin` | The day-to-day admin team | Candidate CRUD, document generation, email sending, Telegram integration. Cannot manage users |
| `limited_admin` | Observers, trainees | Read most data. Can only edit comments and a small slice of candidate profile fields. Cannot react or change status |
| `user` | (not used for app access) | Reserved; treated as no role |

Users without the `role` claim cannot access any protected route — they hit the redirect at the route guard.

---

## Permissions matrix

Legend: ✅ allowed · ⚪ read-only · ❌ denied

### Candidate data

| Action | super_admin | admin | limited_admin |
|---|:---:|:---:|:---:|
| View candidate list | ✅ | ✅ | ✅ |
| Open candidate profile (`/generate/:major/:id`) | ✅ | ✅ | ✅ |
| Edit personal/contact fields | ✅ | ✅ | ⚪ limited set |
| Edit `commentar` + reactions | ✅ | ✅ | ✅ (comments only) |
| Change stage / stageOutcome | ✅ | ✅ | ❌ |
| Toggle favorite star | ✅ | ✅ | ❌ |
| Delete (soft → archived) | ✅ | ✅ | ❌ |
| Delete (hard → deleted_users) | ✅ | ❌ | ❌ |
| Restore from archive | ✅ | ✅ | ❌ |

### Documents

| Action | super_admin | admin | limited_admin |
|---|:---:|:---:|:---:|
| View generated PDFs | ✅ | ✅ | ✅ |
| Generate new PDFs | ✅ | ✅ | ❌ |
| Send documents (upload to outgoing) | ✅ | ✅ | ❌ |
| Edit document templates in `/settings/documents` | ✅ | ✅ | ❌ |
| Manage fillable-PDF defaults | ✅ | ✅ | ❌ |

### Berufsfelder (majors)

| Action | super_admin | admin | limited_admin |
|---|:---:|:---:|:---:|
| View Home table | ✅ | ✅ | ✅ |
| Create a new major | ✅ | ✅ | ❌ |
| Toggle `linkActive` | ✅ | ✅ | ❌ |
| Edit metadata | ✅ | ✅ | ❌ |
| Delete (soft) | ✅ | ✅ | ❌ |
| View archived directions | ✅ | ✅ | ❌ |

### Telegram

| Action | super_admin | admin | limited_admin |
|---|:---:|:---:|:---:|
| View groups/channels | ✅ | ✅ | ⚪ |
| Add/remove groups | ✅ | ✅ | ❌ |
| Generate invite links | ✅ | ✅ | ❌ |
| Send direct messages | ✅ | ✅ | ❌ |
| Discover chats from `getUpdates` | ✅ | ✅ | ❌ |
| Remove candidate from groups | ✅ | ✅ | ❌ |

### Email

| Action | super_admin | admin | limited_admin |
|---|:---:|:---:|:---:|
| View email templates | ✅ | ✅ | ⚪ |
| Edit email templates | ✅ | ✅ | ❌ |
| Send status emails to candidates | ✅ | ✅ | ❌ |

### User & role management

| Action | super_admin | admin | limited_admin |
|---|:---:|:---:|:---:|
| View admin list | ✅ | ⚪ | ❌ |
| Create user | ✅ | ❌ | ❌ |
| Delete user | ✅ | ❌ | ❌ |
| Enable / disable user | ✅ | ❌ | ❌ |
| Reset user password | ✅ | ❌ | ❌ |
| Assign / change role | ✅ | ❌ | ❌ |

### Statistics

| Action | super_admin | admin | limited_admin |
|---|:---:|:---:|:---:|
| View live stats | ✅ | ✅ | ✅ |
| View historical stats | ✅ | ✅ | ✅ |
| Export to Excel | ✅ | ✅ | ❌ |

---

## Where these checks live

- **Firestore rules** ([`firestore.rules`](../../firestore.rules)) — enforce most write restrictions at the database edge.
- **Storage rules** ([`storage.rules`](../../storage.rules)) — enforce authenticated-write on admin-only paths.
- **Cloud Functions** — verify ID token + role at the top of every admin endpoint. Admin SDK bypasses rules, so Functions checks are mandatory — not redundant.
- **UI** — routes are gated by `ProtectedRoutes`; buttons/actions that shouldn't be available are hidden/disabled based on `useUserRole()`.

---

## See also

- [../how-to/manage-admin-roles.md](../how-to/manage-admin-roles.md) — how to assign roles in practice
- [security-rules.md](security-rules.md) — rule-level enforcement summary
- [../explanation/security-model.md](../explanation/security-model.md) — design rationale
