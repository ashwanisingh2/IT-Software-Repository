# Agent Deployment Guide

This guide explains how to deploy the WinRepo Agent to your Windows endpoints. 

## Automated Deployment (Single Machine)

1. Open the WinRepo Web Dashboard.
2. Navigate to **Endpoints**.
3. Click **Add Endpoint / Agent**.
4. Generate a new enrollment token.
5. Copy the provided PowerShell one-liner.
6. Open an elevated (Administrator) PowerShell prompt on the target machine.
7. Paste and run the command.

The agent will automatically:
- Download the client script.
- Register with the server and securely exchange credentials.
- Perform a complete software inventory scan.
- Install a background Scheduled Task running every 6 hours.

## Bulk Deployment (Active Directory GPO or PDQ Deploy)

To deploy to hundreds of machines at once, you can use Group Policy or another deployment tool.

1. Generate an enrollment token with a high `Max Uses` limit (e.g., 500).
2. Save the token string.
3. Use the following script as your deployment payload:

```powershell
$ApiUrl = "http://YOUR_SERVER_IP_OR_DOMAIN/api/agent"
$Token = "YOUR_GENERATED_TOKEN"
$OutPath = "$env:TEMP\WinRepoAgent_Setup.ps1"

Invoke-RestMethod -Uri "$ApiUrl/download?token=$Token" -OutFile $OutPath
& $OutPath
```

4. Assign this script as a Startup Script in your GPO or run it via PDQ Deploy. The script dynamically handles its own installation and cleanup.

## Troubleshooting

- **Agent not checking in?** Ensure the `WinRepoAgent` scheduled task is running successfully on the client (check Task Scheduler).
- **Network errors?** Ensure the endpoint can reach the server over port 80/443. Check for firewall blocks.
- **Uninstallation:** You can remotely uninstall the agent by clicking "Decommission" in the dashboard, or running `Invoke-RestMethod -Uri "$ApiUrl/uninstall" | iex` on the client.
