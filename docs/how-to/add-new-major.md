# How to add a new Berufsfeld (major)

A "major" is a job field — e.g., `pflegefachkraft`, `kfz_mechatroniker`. Each has its own candidate collection and its own public registration link.

**You need this when:** the business adds a new job profile (e.g., a new healthcare specialization).

**Time:** ~5 minutes via the UI.

---

## Step 1 — Create the major via the admin UI

1. Log in as `super_admin` or `admin`.
2. On the Home page (`/`), click **Add Berufsfeld** (or the `+` in the table header).
3. Fill in:
   - **Name** (internal key): lowercase, underscore-separated. Example: `elektroniker_2026`. This becomes the Firestore collection name — **it cannot be changed later**.
   - **Title** (display): human-readable. Example: "Elektroniker für Betriebstechnik".
   - **Description** (optional): notes for admins.
4. Save.

Behind the scenes, this creates:

- A `meta/<docId>` document with `name`, `collectionName`, `title`, `linkActive: true`, a generated `linkId`, and `uuid`.
- An empty candidate collection with the name you chose (created lazily on first candidate write).

---

## Step 2 — Copy the registration link

1. On the Home page, find the new row.
2. Click the **copy link** icon. A modal offers two link flavors:
   - **Regular link**: `https://admin.consultinguz.de/create?linkId=<uuid>`
   - **Telegram link**: `https://t.me/consultinguz_bot?start=<name>`
3. Distribute the appropriate one (prefer the Telegram link — see [setup-telegram-bot.md](setup-telegram-bot.md)).

---

## Step 3 — Verify registration works

1. Open the registration link in an incognito browser.
2. Fill the `/create` form with test data.
3. Submit.
4. Back in the admin UI, open `/collectionCv/<name>` — the new candidate should appear.

---

## Step 4 (optional) — Attach email templates

If you want stage-transition emails to be tailored for this major:

1. Go to **Settings → Template Emails**.
2. Either use the existing default templates (they substitute `{firstName}` etc. automatically) or create major-specific variants.

Email templates live in `settings/email_templates` — see [../reference/firestore-collections.md](../reference/firestore-collections.md).

---

## Step 5 (optional) — Configure Telegram integration

If this major uses a dedicated Telegram group:

1. Add the bot as admin to the group.
2. **Settings → Telegram Groups → Add group** with the group's `chat_id`.
3. Toggle `active: on`.

See [setup-telegram-bot.md](setup-telegram-bot.md) for the full flow and [configure-telegram-auto-remove.md](configure-telegram-auto-remove.md) for the rejection path.

---

## Naming conventions

The `name` field becomes a Firestore collection name. Stick to:

- Lowercase only.
- Underscores for separation (no dashes, no camelCase).
- ASCII only (no umlauts — use `ue` / `ae` / `oe`).
- Start with a letter.
- Keep it short but unambiguous.

**Good:** `pflegefachkraft`, `kfz_mechatroniker`, `altenpfleger_2026`.

**Avoid:** `Pflegefachkraft`, `kfz-mechatroniker`, `krankenpfleger (new)`, `müller`.

If you pick a bad name, the only fix is to archive the major and create a new one — **there is no rename** because the collection name is baked into every candidate document reference.

---

## Deactivating a major

To pause accepting new candidates without deleting anything:

1. **Settings → Directions** (or the major settings icon on the Home row).
2. Toggle **Link active** off.

The `/create?linkId=<uuid>` URL returns a "link blocked" page; existing candidates stay fully functional.

---

## Deleting a major

From the Home row's delete icon. Confirmation moves the `meta/` entry to `archived_directions` (soft delete). Candidates in the collection are **not** deleted — they stay in place and remain editable.

To permanently remove a major + candidates, you need manual Firestore cleanup — there's no UI for hard delete.

---

## See also

- [../reference/firestore-collections.md](../reference/firestore-collections.md) — `meta` and candidate collection shapes
- [../reference/routes.md](../reference/routes.md) — where the major appears in the URL scheme
- [setup-telegram-bot.md](setup-telegram-bot.md) — adding the Telegram deep-link path
