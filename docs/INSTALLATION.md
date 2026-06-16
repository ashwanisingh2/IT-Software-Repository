# Installation Guide

## Docker deployment

1. Create a GitHub repository for release assets.
2. Create a fine-grained GitHub token with repository release permissions.
3. Copy `.env.example` to `.env` and set `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_TOKEN`, `JWT_SECRET`, and URLs.
4. Run `docker compose up --build`.
5. Create an initial admin in PostgreSQL using a bcrypt password hash.

## PowerShell client

Import `scripts/WinRepoClient.ps1` on managed Windows computers, then run:

```powershell
Install-App Chrome
Update-App VSCode
Send-Inventory -ApiBaseUrl https://repo.example.com
```
