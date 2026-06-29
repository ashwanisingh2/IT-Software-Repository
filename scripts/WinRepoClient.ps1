<#
.SYNOPSIS
WinRepo PowerShell Client for managing software deployments.

.DESCRIPTION
Provides commands to list, install, and update software from the WinRepo server.
Requires an API token and URL to be configured.

.PARAMETER ApiUrl
The base URL of the WinRepo API. Defaults to $env:WINREPO_API_URL

.PARAMETER ApiToken
The API token for authentication. Defaults to $env:WINREPO_API_TOKEN
#>

param(
    [string]$ApiUrl = $env:WINREPO_API_URL,
    [string]$ApiToken = $env:WINREPO_API_TOKEN
)

if ([string]::IsNullOrEmpty($ApiUrl)) {
    throw "ApiUrl is required. Pass -ApiUrl or set WINREPO_API_URL environment variable."
}

$Global:WinRepoHeaders = @{
    "Authorization" = "Bearer $ApiToken"
    "Accept"        = "application/json"
}
$Global:WinRepoApi = $ApiUrl.TrimEnd('/')

# Setup Transcript Logging
$LogDir = Join-Path $env:APPDATA "WinRepo\logs"
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
}
$LogFile = Join-Path $LogDir "WinRepoClient_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"
try {
    Start-Transcript -Path $LogFile -Append -NoClobber -IncludeInvocationHeader | Out-Null
} catch {
    Write-Warning "Failed to start transcript logging."
}

function Get-RepoList {
    $response = Invoke-RestMethod -Uri "$Global:WinRepoApi/software" -Headers $Global:WinRepoHeaders -Method Get
    if ($response.success) {
        return $response.data.items
    }
    throw "Failed to fetch software list: $($response.error.message)"
}

function Verify-FileHash {
    param(
        [string]$FilePath,
        [string]$ExpectedHash
    )
    $actualHash = (Get-FileHash -Path $FilePath -Algorithm SHA256).Hash
    return $actualHash -eq $ExpectedHash
}

function Install-App {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Name
    )
    
    $apps = Get-RepoList
    $app = $apps | Where-Object { $_.name -ieq $Name } | Select-Object -First 1

    if (-not $app) {
        throw "Application '$Name' not found in repository."
    }

    Write-Host "Found $($app.name) version $($app.latest_version). Preparing to download..."

    # Get Download URL
    $dlResponse = Invoke-RestMethod -Uri "$Global:WinRepoApi/software/$($app.id)/download" -Headers $Global:WinRepoHeaders -Method Get
    if (-not $dlResponse.success) {
        throw "Failed to get download URL: $($dlResponse.error.message)"
    }
    $downloadUrl = $dlResponse.data.url

    # Download File
    $tempFile = Join-Path $env:TEMP "$($app.name)_$($app.latest_version)_$([Guid]::NewGuid().ToString().Substring(0,8)).tmp"
    Write-Host "Downloading from $downloadUrl to $tempFile"
    Invoke-WebRequest -Uri $downloadUrl -OutFile $tempFile

    # Verify Hash
    Write-Host "Verifying SHA256 hash..."
    if (-not (Verify-FileHash -FilePath $tempFile -ExpectedHash $app.sha256)) {
        Remove-Item $tempFile -Force
        throw "Hash mismatch! Downloaded file is corrupt or compromised."
    }
    Write-Host "Hash verified successfully."

    # Install Silently
    $ext = [System.IO.Path]::GetExtension($app.storage_url)
    Write-Host "Installing application..."
    try {
        if ($ext -ieq ".msi") {
            Start-Process -FilePath "msiexec.exe" -ArgumentList "/i `"$tempFile`" /qn /norestart" -Wait -NoNewWindow
        } elseif ($ext -ieq ".exe") {
            Start-Process -FilePath $tempFile -ArgumentList "/S /quiet /silent" -Wait -NoNewWindow
        } elseif ($ext -ieq ".ps1") {
            & $tempFile
        } else {
            throw "Unsupported file extension for silent install: $ext"
        }
        Write-Host "Installation completed successfully."
    } finally {
        if (Test-Path $tempFile) {
            Remove-Item $tempFile -Force
        }
    }
}

function Check-Updates {
    $response = Invoke-RestMethod -Uri "$Global:WinRepoApi/inventory/updates-needed" -Headers $Global:WinRepoHeaders -Method Get
    if ($response.success) {
        return $response.data
    }
    throw "Failed to check updates: $($response.error.message)"
}

function Update-App {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Name
    )
    # Similar to Install-App, check version and update if newer
    Write-Host "Updating application $Name..."
    Install-App -Name $Name
}

function Update-All {
    $updates = Check-Updates
    foreach ($update in $updates) {
        Update-App -Name $update.software_name
    }
}

function Submit-Inventory {
    # Basic inventory collection
    $osInfo = Get-CimInstance Win32_OperatingSystem
    $machineId = (Get-CimInstance Win32_ComputerSystemProduct).UUID
    $hostname = $env:COMPUTERNAME
    
    # Collect installed software from registry
    $paths = @("HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*", "HKLM:\Software\Wow6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*")
    $installed = Get-ItemProperty $paths | Where-Object { $_.DisplayName } | Select-Object @{Name="name";Expression={$_.DisplayName}}, @{Name="version";Expression={$_.DisplayVersion}} | Sort-Object name -Unique

    $payload = @{
        machineId = $machineId
        hostname = $hostname
        osVersion = $osInfo.Caption
        installedSoftware = $installed
    }

    $jsonPayload = $payload | ConvertTo-Json -Depth 5
    $response = Invoke-RestMethod -Uri "$Global:WinRepoApi/inventory/endpoints/$machineId/checkin" -Headers $Global:WinRepoHeaders -Method Post -Body $jsonPayload -ContentType "application/json"
    
    if ($response.success) {
        Write-Host "Inventory submitted successfully."
    } else {
        throw "Failed to submit inventory: $($response.error.message)"
    }
}

Export-ModuleMember -Function Get-RepoList, Install-App, Update-App, Update-All, Check-Updates, Submit-Inventory
