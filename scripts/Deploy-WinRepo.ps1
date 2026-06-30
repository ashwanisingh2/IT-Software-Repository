<#
.SYNOPSIS
Enterprise deployment script for WinRepo Agent.

.DESCRIPTION
This script is designed to be deployed via Active Directory GPO (Startup Script), Microsoft Intune, or PDQ Deploy.
It securely downloads the agent template from the WinRepo server, injects the server URL and API key, 
and installs it as a persistent background Scheduled Task (SYSTEM context) on the target Windows endpoint.

.PARAMETER ServerUrl
The base URL of your WinRepo API server (e.g., https://winrepo.yourcompany.local/api)

.PARAMETER ApiKey
The machine authentication API key configured on your server.
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$ServerUrl,

    [Parameter(Mandatory=$true)]
    [string]$ApiKey
)

$ErrorActionPreference = "Stop"

# Paths
$installDir = "$env:ProgramFiles\WinRepo"
$agentPath = "$installDir\WinRepoAgent.ps1"
$configDir = "$env:ProgramData\WinRepo"

Write-Host "Starting WinRepo Agent Deployment..."

# 1. Create Directories
if (-not (Test-Path $installDir)) {
    New-Item -ItemType Directory -Path $installDir -Force | Out-Null
    Write-Host "Created install directory: $installDir"
}
if (-not (Test-Path $configDir)) {
    New-Item -ItemType Directory -Path $configDir -Force | Out-Null
    Write-Host "Created config directory: $configDir"
}

# 2. Save Configuration
$configPayload = @{
    API_URL = $ServerUrl
    API_KEY = $ApiKey
} | ConvertTo-Json
Set-Content -Path "$configDir\config.json" -Value $configPayload -Force
Write-Host "Saved configuration to $configDir\config.json"

# 3. Download Agent Script from Server
$agentDownloadUrl = "$ServerUrl/agent/install" # We will fetch the raw script from the server
try {
    # If downloading fails (e.g. self-signed cert), bypass SSL
    [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    
    Invoke-WebRequest -Uri $agentDownloadUrl -OutFile $agentPath -UseBasicParsing
    Write-Host "Successfully downloaded Agent script to $agentPath"
} catch {
    Write-Error "Failed to download Agent script from $agentDownloadUrl. $_"
    exit 1
}

# 4. Install as a persistent Scheduled Task running as SYSTEM
$taskName = "WinRepo_Agent_Daemon"

# Remove existing task if present
Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue | Unregister-ScheduledTask -Confirm:$false -ErrorAction SilentlyContinue

$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -WindowStyle Hidden -NoProfile -NonInteractive -File `"$agentPath`""
$trigger1 = New-ScheduledTaskTrigger -AtStartup
$trigger2 = New-ScheduledTaskTrigger -AtLogOn
$principal = New-ScheduledTaskPrincipal -UserId "NT AUTHORITY\SYSTEM" -LogonType ServiceAccount -RunLevel Highest

$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -DontStopOnIdleEnd -ExecutionTimeLimit 0

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger @($trigger1, $trigger2) -Principal $principal -Settings $settings -Force | Out-Null

Write-Host "Successfully registered Scheduled Task: $taskName"

# 5. Start the Agent immediately
Start-ScheduledTask -TaskName $taskName
Write-Host "Agent started successfully. Deployment Complete!"
