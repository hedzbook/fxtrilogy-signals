$root = Get-Location
$outputFile = Join-Path $root "PROJECT_SNAPSHOT.txt"

# Clear previous snapshot
"" | Out-File $outputFile -Encoding utf8

# Folders to scan
$folders = @("app", "components")

foreach ($folder in $folders) {
    $path = Join-Path $root $folder

    if (Test-Path $path) {
        Get-ChildItem -Path $path -Recurse -Include *.ts,*.tsx |
        Sort-Object FullName |
        ForEach-Object {

            $relativePath = $_.FullName.Replace("$root\", "")

            Add-Content $outputFile "`r`n// $relativePath"
            Add-Content $outputFile "// --------------------------------------------------`r`n"

            Get-Content $_.FullName | Add-Content $outputFile

            Add-Content $outputFile "`r`n"
        }
    }
}

Write-Host "Snapshot created: PROJECT_SNAPSHOT.txt"
