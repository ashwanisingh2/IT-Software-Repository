@echo off
setlocal
echo =========================================
echo WinRepo Platform - Agent Installer
echo =========================================

set SERVER_URL=http://localhost/api
set PS_SCRIPT="%PUBLIC%\WinRepoClient.ps1"
set SCHEDULE_NAME="WinRepoAgent"

echo Copying WinRepo Client script to Public directory...
copy "%~dp0WinRepoClient.ps1" %PS_SCRIPT% >nul

if not exist %PS_SCRIPT% (
    echo Failed to copy the script. Please ensure you are running this from the scripts folder.
    exit /b 1
)

echo Registering Scheduled Task to run every 6 hours...
schtasks /create /tn %SCHEDULE_NAME% /tr "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File %PS_SCRIPT% -ServerUrl %SERVER_URL%" /sc hourly /mo 6 /ru SYSTEM /f

echo Running initial check-in...
powershell -ExecutionPolicy Bypass -File %PS_SCRIPT% -ServerUrl %SERVER_URL%

echo Installation complete!
endlocal
pause
