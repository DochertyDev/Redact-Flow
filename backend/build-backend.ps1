# RedactFlow Backend Build Script
# This script builds the backend into a standalone executable using PyInstaller

Write-Host "=== RedactFlow Backend Build ===" -ForegroundColor Cyan
Write-Host ""

# Ensure we're in the backend directory
$backendDir = "C:\Users\Sean\Projects\Redact-Flow\backend"
Set-Location $backendDir

# Check if virtual environment is activated
if (-not $env:VIRTUAL_ENV) {
    Write-Host "Activating virtual environment..." -ForegroundColor Yellow
    & ".\venv\Scripts\Activate.ps1"
}

# Verify PyInstaller is installed
Write-Host "Checking PyInstaller..." -ForegroundColor Yellow
try {
    $pyinstallerVersion = pyinstaller --version 2>&1
    Write-Host "✓ PyInstaller $pyinstallerVersion" -ForegroundColor Green
}
catch {
    Write-Host "✗ PyInstaller not found. Installing..." -ForegroundColor Red
    pip install pyinstaller
}

Write-Host ""
Write-Host "Cleaning previous builds..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
}
if (Test-Path "build") {
    Remove-Item -Recurse -Force "build"
}

Write-Host "✓ Cleanup complete" -ForegroundColor Green
Write-Host ""

Write-Host "Building backend executable..." -ForegroundColor Yellow
Write-Host "This will take several minutes (bundling ~600MB of dependencies)..." -ForegroundColor Yellow
Write-Host ""

# Run PyInstaller with the spec file
pyinstaller backend.spec --clean

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=== Build Complete! ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "Backend executable location:" -ForegroundColor White
    Write-Host "  $backendDir\dist\redactflow-backend\" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Executable file:" -ForegroundColor White
    Write-Host "  redactflow-backend.exe" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor White
    Write-Host "1. Test the backend: cd dist\redactflow-backend && .\redactflow-backend.exe" -ForegroundColor White
    Write-Host "2. The backend should start on http://127.0.0.1:8000" -ForegroundColor White
    Write-Host "3. Test the health endpoint: http://127.0.0.1:8000/api/health" -ForegroundColor White
    Write-Host ""
}
else {
    Write-Host ""
    Write-Host "=== Build Failed ===" -ForegroundColor Red
    Write-Host "Check the output above for errors." -ForegroundColor Red
    Write-Host ""
}
