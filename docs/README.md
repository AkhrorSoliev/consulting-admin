# Documentation

Canonical documentation for the Consulting Admin project. Organized by the [Diátaxis framework](https://diataxis.fr/) — four document types, each with a distinct purpose.

> [!NOTE]
> If code and docs disagree, **code is authoritative**. Update docs in the same PR as the refactor that invalidated them.

## 📚 Tutorials — _learn by doing_

Step-by-step lessons for newcomers. Read these to build working knowledge.

- [Getting started](tutorials/getting-started.md) — clone, install, run locally, make your first change

## 🔧 How-to guides — _solve a specific task_

Task-oriented recipes. Read these when you already know the system and need to accomplish something concrete.

- [Set up reCAPTCHA](how-to/setup-recaptcha.md) — register keys, configure frontend + Functions
- [Set up the Telegram bot](how-to/setup-telegram-bot.md) — bot token, webhook, deep links
- [Configure Telegram auto-remove](how-to/configure-telegram-auto-remove.md) — remove candidates from groups on rejection
- [Add a new Berufsfeld (major)](how-to/add-new-major.md) — create a job field with its own candidate collection
- [Add a new document template](how-to/add-document-template.md) — wire a PDF template into the admin UI
- [Manage admin roles](how-to/manage-admin-roles.md) — assign `super_admin` / `admin` / `limited_admin`
- [Deploy to production](how-to/deploy-to-production.md) — frontend, Functions, and PDF backend

## 📖 Reference — _look up facts_

Information-oriented. Read these when you need precise names, shapes, and contracts.

- [Routes](reference/routes.md) — every frontend route and its access rules
- [Cloud Functions API](reference/cloud-functions.md) — HTTP, callable, and trigger functions
- [Firestore collections](reference/firestore-collections.md) — document shapes
- [Cloud Storage paths](reference/storage-paths.md) — where files live
- [Security rules](reference/security-rules.md) — Firestore + Storage rule summary
- [Environment variables](reference/environment-variables.md) — all `VITE_*` and Functions secrets
- [Candidate stages](reference/candidate-stages.md) — `stage_1` … `stage_4` with labels
- [Admin roles](reference/admin-roles.md) — permissions matrix
- [Project structure](reference/project-structure.md) — file tree with entry points

## 💡 Explanation — _understand the system_

Discussion-oriented. Read these when you want to understand _why_, not just _what_.

- [Architecture](explanation/architecture.md) — runtime boundaries, trust zones, data flow
- [Candidate lifecycle](explanation/candidate-lifecycle.md) — registration → placement end-to-end
- [Document generation](explanation/document-generation.md) — how PDFs are produced and delivered
- [Security model](explanation/security-model.md) — authN/Z, rule posture, public surfaces
- [Localization](explanation/localization.md) — German-first UI, Uzbek consent forms

## Quick links by role

**New developer?** → [Getting started](tutorials/getting-started.md) → [Architecture](explanation/architecture.md)

**Operating production?** → [Deploy](how-to/deploy-to-production.md) → [Security rules](reference/security-rules.md) → [Environment variables](reference/environment-variables.md)

**Debugging a candidate flow?** → [Candidate lifecycle](explanation/candidate-lifecycle.md) → [Cloud Functions API](reference/cloud-functions.md) → [Firestore collections](reference/firestore-collections.md)

**Adding a feature?** → [Routes](reference/routes.md) → [Project structure](reference/project-structure.md) → [Architecture](explanation/architecture.md)
