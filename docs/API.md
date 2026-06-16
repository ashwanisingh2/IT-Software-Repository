# API Documentation

## Authentication

- `POST /api/auth/login` - returns JWT for admin, engineer, or viewer users.

## Software Repository

- `GET /api/software` - list software; supports `search`, `category`, `vendor`, and `version` filters.
- `POST /api/software/upload` - authenticated multipart upload for EXE, MSI, ZIP, BAT, and PS1 files.
- `GET /api/software/:id/download` - increments download count and returns a direct GitHub release asset URL.
- `GET /api/software/sync/github` - authenticated GitHub Releases inventory sync preview.
- `GET /api/software/powershell/package?apps=Chrome,VSCode` - generated bulk deployment script.

## PowerShell Client

- `GET /api/powershell/client.ps1` - generated PowerShell module with `Install-App`, `Update-App`, and inventory upload functions.
- `GET /api/powershell/bootstrap?apiBaseUrl=http://localhost:4000` - one-line bootstrap command payload for Windows clients.

## Inventory and Updates

- `POST /api/inventory/check-in` - upload computer name, OS version, installed software, and installed updates.
- `GET /api/inventory` - list checked-in computers.
- `GET /api/inventory/updates` - compare installed software versions with repository latest versions.

## Dashboard and Documentation

- `GET /api/dashboard` - dashboard metrics, latest uploads, categories, storage usage, and update statistics.
- `GET /api/documents` - list KB articles, PDFs, SOPs, Windows Server, and network documentation.
- `POST /api/documents` - authenticated creation of documentation records.
