# Final Steps: Upload, Download, and Install Software

Ye steps follow karne ke baad Windows engineer software repository se package download/install kar payega.

## 1. Environment configure karein

```bash
cp .env.example .env
```

`.env` mein ye values set karein:

- `JWT_SECRET` - long random secret.
- `GITHUB_TOKEN` - fine-grained token with release asset permissions.
- `GITHUB_OWNER` and `GITHUB_REPO` - release storage repository.
- `API_BASE_URL` and `NEXT_PUBLIC_API_BASE_URL` - public API URL.

## 2. Platform start karein

```bash
docker compose up --build
```

Web UI: `http://localhost:3000`
API: `http://localhost:4000`

## 3. Admin user create karein

```bash
npm run seed:admin --workspace apps/api -- admin@example.com StrongPassword123! "WinRepo Admin"
```

Login API se token lein:

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"StrongPassword123!"}'
```

Response ka `token` upload form ya API calls mein use hoga.

## 4. Software upload karein

### Web UI se

1. `http://localhost:3000` open karein.
2. Upload Software panel mein name, version, vendor, category, file, aur JWT token enter karein.
3. Upload button click karein.
4. File GitHub Releases par upload hogi aur local PostgreSQL inventory mein metadata save hoga.

### API se

```bash
curl -X POST http://localhost:4000/api/software/upload \
  -H "Authorization: Bearer <TOKEN>" \
  -F "name=Chrome" \
  -F "version=126.0.1" \
  -F "vendor=Google" \
  -F "category=Browsers" \
  -F "description=Enterprise Chrome installer" \
  -F "file=@./ChromeSetup.exe"
```

## 5. Windows machine par client load karein

PowerShell as Administrator open karein:

```powershell
iwr "http://localhost:4000/api/powershell/bootstrap?apiBaseUrl=http://localhost:4000" -UseBasicParsing | iex
```

## 6. Software list/download/install karein

```powershell
Get-WinRepoSoftware -Search Chrome
Install-App Chrome
Update-App Chrome
```

`Install-App Chrome` latest uploaded version find karega, download count increment karega, GitHub Release direct URL se file download karega, aur detected silent command run karega.

## 7. Inventory upload karein

```powershell
Send-WinRepoInventory
```

Inventory API computer name, OS version, installed software, installed updates, aur last check-in save karegi.

## 8. Update status check karein

```bash
curl http://localhost:4000/api/inventory/updates
```

Yah installed version ko repository latest version se compare karke `update_available` status return karta hai.
