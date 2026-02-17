# autopush.ps1

$path = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $path

Write-Host "FXHEDZ Auto Git running..."

$global:timer = $null
$global:isRunning = $false

function Start-DebounceTimer {

    if ($global:timer) {
        $global:timer.Stop()
        $global:timer.Dispose()
    }

    $global:timer = New-Object Timers.Timer
    $global:timer.Interval = 2000   # 2 seconds after last change
    $global:timer.AutoReset = $false

    Register-ObjectEvent $global:timer Elapsed -Action {

        if ($global:isRunning) { return }

        $global:isRunning = $true

        $status = git status --porcelain

        if ($status) {
            $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

            git add .
            git commit -m "auto update $timestamp" 2>$null
            git push 2>$null

            Write-Host "$timestamp - Auto pushed"
        }

        $global:isRunning = $false
    } | Out-Null

    $global:timer.Start()
}

$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $path
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true
$watcher.Filter = "*.*"

$action = {
    Start-DebounceTimer
}

Register-ObjectEvent $watcher Created -Action $action | Out-Null
Register-ObjectEvent $watcher Changed -Action $action | Out-Null
Register-ObjectEvent $watcher Deleted -Action $action | Out-Null
Register-ObjectEvent $watcher Renamed -Action $action | Out-Null

Write-Host "Watching for changes. Press Ctrl+C to exit."

while ($true) { Start-Sleep 1 }
