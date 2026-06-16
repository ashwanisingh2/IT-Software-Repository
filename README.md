# WinRepo Platform

A professional self-hosted software repository and deployment platform for Windows System Engineers. It combines a lightweight Chocolatey-style repository, PDQ Deploy package generation, Intune-like inventory/update reporting, GitHub Releases-backed binary storage, and a documentation knowledge base.

## Features

- Upload and catalog EXE, MSI, ZIP, BAT, and PS1 assets with SHA256, size, vendor, category, versions, latest-version detection, and download counters.
- Store binaries in public or private GitHub Releases and sync release assets back into the local PostgreSQL inventory.
- Generate PowerShell commands such as `Install-App Chrome`, `Update-App VSCode`, deployment manifests, and bulk install scripts.
- Track endpoint inventory, installed software, OS versions, update status, and last check-ins.
- Manage KB articles, PDF guides, SOPs, Windows Server docs, and network documentation.
- Enterprise dashboard with totals, latest uploads, most downloaded apps, storage usage, categories, and update statistics.
- REST API for software list, download links, version checks, inventory upload, and update status.
- Admin login, role-based access controls, and audit logs.
- Modern responsive Next.js UI with TailwindCSS and dark/light mode.

## Quick start

1. Copy `.env.example` to `.env` and fill in database, JWT, and GitHub settings.
2. Start PostgreSQL and the apps:

```bash
docker compose up --build
```

3. Apply the schema if running manually:

```bash
psql "$DATABASE_URL" -f database/schema.sql
```

4. Open `http://localhost:3000` and sign in with the seeded admin account you create in PostgreSQL.

## Repository layout

- `apps/api` - Node.js/Express REST API.
- `apps/web` - Next.js/TypeScript/TailwindCSS frontend.
- `packages/shared` - Shared categories and TypeScript types.
- `database/schema.sql` - PostgreSQL schema, indexes, triggers, and enums.
- `scripts` - Windows PowerShell client and deployment helpers.
- `docs` - Installation and API documentation.

## Final usage steps

See `docs/FINAL_STEPS.md` for the exact flow to configure the platform, create an admin, upload packages, load the PowerShell client, and install software with `Install-App Chrome`.
