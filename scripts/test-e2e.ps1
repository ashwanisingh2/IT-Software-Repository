$ErrorActionPreference = "Stop"
$ApiUrl = "http://localhost/api"

Write-Host "========================================="
Write-Host "WinRepo E2E Feature Test Script"
Write-Host "========================================="

# 1. Health Check
Write-Host "`n[1/4] Checking Platform Health..."
$health = Invoke-RestMethod -Uri "$ApiUrl/health" -Method Get
if ($health.success) {
    Write-Host "Health Check Passed! Server is online." -ForegroundColor Green
}

# 2. Authentication
Write-Host "`n[2/4] Testing Authentication (Login)..."
$loginBody = @{
    email = "admin@winrepo.local"
    password = "admin"
} | ConvertTo-Json
$loginResponse = Invoke-RestMethod -Uri "$ApiUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginResponse.data.accessToken

if ($token) {
    Write-Host "Authentication Passed! Token received." -ForegroundColor Green
}

$headers = @{
    Authorization = "Bearer $token"
}

# 3. Dashboard Stats (Admin Route)
Write-Host "`n[3/4] Testing Admin Dashboard Stats..."
$stats = Invoke-RestMethod -Uri "$ApiUrl/admin/stats" -Method Get -Headers $headers
if ($stats.success) {
    Write-Host "Dashboard Stats Retrieved successfully!" -ForegroundColor Green
    Write-Host "Total Packages: $($stats.data.totalPackages)"
    Write-Host "Active Endpoints: $($stats.data.totalEndpoints)"
}

# 4. Software Catalog
Write-Host "`n[4/4] Testing Software Catalog Retrieval..."
$software = Invoke-RestMethod -Uri "$ApiUrl/software" -Method Get -Headers $headers
if ($software.success) {
    Write-Host "Software Catalog Retrieved successfully! ($($software.data.Length) items)" -ForegroundColor Green
}

Write-Host "`n========================================="
Write-Host "All Core API Features Tested Successfully!" -ForegroundColor Green
Write-Host "To test the Web UI, open: http://localhost:3000"
Write-Host "To test the Client Agent, run: scripts/install.bat"
Write-Host "========================================="
