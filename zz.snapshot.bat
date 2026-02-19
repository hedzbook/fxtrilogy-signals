@echo off
powershell -ExecutionPolicy Bypass -File snapshot-all.ps1
if %errorlevel% neq 0 (
    echo Snapshot failed.
    pause
) else (
    exit
)
