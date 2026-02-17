$path = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $path

Write-Host "FXHEDZ Auto Git running..."
Write-Host "Watching for changes..."

$global:isRunning = $false
$global:lastChange = Get-Date

$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $path
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true
$watcher.Filter = "*.*"

$action = {
    $global:lastChange = Get-Date
}

Register-ObjectEvent $watcher Changed -Action $action | Out-Null
Register-ObjectEvent $watcher Created -Action $action | Out-Null
Register-ObjectEvent $watcher Deleted -Action $action | Out-Null
Register-ObjectEvent $watcher Renamed -Action $action | Out-Null

while ($true) {

    Wait-Event -Timeout 1 | Out-Null

    if ((Get-Date) - $global:lastChange -gt [TimeSpan]::FromSeconds(2)) {

        if (-not $global:isRunning) {

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
            $global:lastChange = Get-Date
        }
    }
}
