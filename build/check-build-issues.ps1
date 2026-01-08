# PowerShell script to check for build issues
Write-Host "Checking for running DevTools App instances..." -ForegroundColor Yellow

# Check for running DevTools App processes
$processes = Get-Process | Where-Object { $_.ProcessName -like "*DevTools*" -or $_.MainWindowTitle -like "*DevTools*" }

if ($processes) {
    Write-Host "Found running DevTools App processes:" -ForegroundColor Red
    $processes | ForEach-Object {
        Write-Host "  - PID: $($_.Id) | Name: $($_.ProcessName)" -ForegroundColor Red
    }
    Write-Host "`nPlease close all DevTools App instances before building." -ForegroundColor Yellow
    Write-Host "You can close them manually or run: Stop-Process -Name '*DevTools*' -Force" -ForegroundColor Yellow
} else {
    Write-Host "No running DevTools App instances found." -ForegroundColor Green
}

# Check for locked DLL files
Write-Host "`nChecking for locked DLL files..." -ForegroundColor Yellow
$dllPath = "dist-electron\pack\win-unpacked\dxcompiler.dll"
if (Test-Path $dllPath) {
    try {
        $file = [System.IO.File]::Open($dllPath, 'Open', 'ReadWrite', 'None')
        $file.Close()
        Write-Host "dxcompiler.dll is not locked." -ForegroundColor Green
    } catch {
        Write-Host "dxcompiler.dll is locked by another process." -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "dxcompiler.dll not found at expected path." -ForegroundColor Yellow
}

Write-Host "`nBuild warnings about missing locale files are usually non-fatal." -ForegroundColor Cyan
Write-Host "If the build completes successfully, you can ignore these warnings." -ForegroundColor Cyan



