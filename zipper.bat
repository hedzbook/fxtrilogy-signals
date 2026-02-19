@echo off
cd /d "%~dp0"

REM =====================================
REM FXHEDZ BACKUP SCRIPT
REM =====================================

set BACKUP_DIR=z.backup

REM Create backup folder if it does not exist
if not exist "%BACKUP_DIR%" (
    mkdir "%BACKUP_DIR%"
)

REM Generate timestamp
for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd_HH-mm-ss"') do set NOW=%%i

set ZIP_NAME=%BACKUP_DIR%\backup_%NOW%.zip

echo Creating backup...

REM Added GAS.txt and MT5.txt to the path list below
powershell -NoProfile -Command ^
"Compress-Archive -Path 'app','components','GAS.txt','MT5.txt' -DestinationPath '%ZIP_NAME%' -Force"

echo Backup created:
echo %ZIP_NAME%

exit