@echo off
setlocal
echo =========================================
echo WinRepo Platform - Agent Installer
echo =========================================

set SERVER_URL=http://localhost:4000/api
set PS_SCRIPT="%PUBLIC%\WinRepoClient.ps1"
set SCHEDULE_NAME="WinRepoAgent"

echo Downloading WinRepo Client script...
powershell -Command "(New-Object Net.WebClient).DownloadFile('%SERVER_URL%/docs/WinRepoClient.ps1', '%PS_SCRIPT%')"

if not exist %PS_SCRIPT% (
    echo Failed to download the script. Please ensure the server is reachable.
    exit /b 1
)

echo Registering Scheduled Task to run every 6 hours...
schtasks /create /tn %SCHEDULE_NAME% /tr "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File %PS_SCRIPT% -ServerUrl %SERVER_URL%" /sc hourly /mo 6 /ru SYSTEM /f

echo Running initial check-in...
powershell -ExecutionPolicy Bypass -File %PS_SCRIPT% -ServerUrl %SERVER_URL%

echo Installation complete!
endlocal
pause
