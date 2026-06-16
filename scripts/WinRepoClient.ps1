param([string]$ApiBaseUrl = "http://localhost:4000")
$script:WinRepoApiBaseUrl = $ApiBaseUrl.TrimEnd('/')

function Set-WinRepoServer {
  param([Parameter(Mandatory)][string]$ApiBaseUrl)
  $script:WinRepoApiBaseUrl = $ApiBaseUrl.TrimEnd('/')
}

function Get-WinRepoSoftware {
  param([string]$Search = '')
  $uri = "$script:WinRepoApiBaseUrl/api/software"
  if ($Search) { $uri = "$uri?search=$([uri]::EscapeDataString($Search))" }
  Invoke-RestMethod -Method Get -Uri $uri
}

function Install-App {
  param([Parameter(Mandatory)][string]$Name)
  $apps = Get-WinRepoSoftware -Search $Name
  $app = $apps | Where-Object { $_.name -eq $Name } | Select-Object -First 1
  if (-not $app -or -not $app.latestVersion) { throw "Application not found or no version uploaded: $Name" }
  $download = Invoke-RestMethod -Method Get -Uri "$script:WinRepoApiBaseUrl/api/software/$($app.latestVersion.id)/download"
  $target = Join-Path $env:TEMP $app.latestVersion.file_name
  Invoke-WebRequest -Uri $download.downloadUrl -OutFile $target
  $InstallerPath = $target
  Invoke-Expression $app.latestVersion.silent_install_command
}

function Update-App { param([Parameter(Mandatory)][string]$Name) Install-App -Name $Name }

function Send-WinRepoInventory {
  $software = Get-ItemProperty HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*, HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\* -ErrorAction SilentlyContinue |
    Where-Object DisplayName |
    Sort-Object DisplayName -Unique |
    ForEach-Object { @{ name=$_.DisplayName; version=$_.DisplayVersion; vendor=$_.Publisher } }
  $payload = @{ computerName=$env:COMPUTERNAME; osVersion=(Get-CimInstance Win32_OperatingSystem).Caption; installedSoftware=$software; installedUpdates=(Get-HotFix | ForEach-Object HotFixID) }
  Invoke-RestMethod -Method Post -Uri "$script:WinRepoApiBaseUrl/api/inventory/check-in" -Body ($payload | ConvertTo-Json -Depth 6) -ContentType 'application/json'
}

Export-ModuleMember -Function Set-WinRepoServer,Get-WinRepoSoftware,Install-App,Update-App,Send-WinRepoInventory
