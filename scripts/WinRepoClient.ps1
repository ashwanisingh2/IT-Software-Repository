<#
.SYNOPSIS
WinRepo Platform Endpoint Client
.DESCRIPTION
Reports endpoint telemetry and pulls required software updates.
#>
param (
    [string]$ServerUrl = "http://localhost:4000/api",
    [string]$MachineId = (Get-WmiObject -Class Win32_ComputerSystemProduct).UUID
)

$ErrorActionPreference = "Stop"

function Get-InstalledSoftware {
    $software = @()
    $keys = @(
        "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*",
        "HKLM:\Software\Wow6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*"
    )
    
    foreach ($key in $keys) {
        if (Test-Path $key) {
            $items = Get-ItemProperty $key -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName }
            foreach ($item in $items) {
                $software += @{
                    name = $item.DisplayName
                    version = if ($item.DisplayVersion) { $item.DisplayVersion } else { "Unknown" }
                    vendor = if ($item.Publisher) { $item.Publisher } else { "Unknown" }
                }
            }
        }
    }
    return $software | Sort-Object -Unique name
}

function Invoke-Checkin {
    $os = Get-CimInstance Win32_OperatingSystem
    
    $payload = @{
        hostname = $env:COMPUTERNAME
        ipAddress = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi","Ethernet" -ErrorAction SilentlyContinue).IPAddress[0]
        osName = $os.Caption
        osVersion = $os.Version
        osArch = $os.OSArchitecture
        installedSoftware = @(Get-InstalledSoftware)
    }

    $json = $payload | ConvertTo-Json -Depth 5 -Compress
    
    Write-Host "Reporting to WinRepo at $ServerUrl/inventory/checkin/$MachineId"
    try {
        $response = Invoke-RestMethod -Uri "$ServerUrl/inventory/checkin/$MachineId" -Method Post -Body $json -ContentType "application/json"
        
        if ($response.success -and $response.data.updatesNeeded) {
            Write-Host "Updates needed found!" -ForegroundColor Yellow
            # Loop through updates and pull them
            foreach ($update in $response.data.updatesNeeded) {
                Write-Host "Needs update: $($update.software_name) -> $($update.latest_version)"
            }
        } else {
            Write-Host "Endpoint is fully up to date." -ForegroundColor Green
        }
    } catch {
        Write-Error "Failed to check-in: $_"
    }
}

Invoke-Checkin
