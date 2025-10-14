# Test script for the bundled backend
# This will start the backend and test the health endpoint

Write-Host "=== Testing RedactFlow Backend ===" -ForegroundColor Cyan
Write-Host ""

$backendExe = "C:\Users\Sean\Projects\Redact-Flow\backend\dist\redactflow-backend\redactflow-backend.exe"

if (-not (Test-Path $backendExe)) {
    Write-Host "✗ Backend executable not found at:" -ForegroundColor Red
    Write-Host "  $backendExe" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please run build-backend.ps1 first." -ForegroundColor Yellow
    exit 1
}

Write-Host "Starting backend..." -ForegroundColor Yellow
Write-Host "This may take 10-30 seconds on first run (loading spaCy model)..." -ForegroundColor Yellow
Write-Host ""

# Start the backend in a new window
$backendProcess = Start-Process -FilePath $backendExe -PassThru -WindowStyle Normal

# Wait for backend to start
Write-Host "Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Check if the backend port file was created
$portFile = "C:\Users\Sean\Projects\Redact-Flow\backend\dist\redactflow-backend\backend.port"
if (Test-Path $portFile) {
    $port = Get-Content $portFile
    Write-Host "✓ Backend started on port: $port" -ForegroundColor Green
} else {
    $port = "8000"
    Write-Host "Using default port: $port" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Testing health endpoint..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:$port/api/health" -UseBasicParsing
    $healthData = $response.Content | ConvertFrom-Json
    
    Write-Host "✓ Health check successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Backend Status:" -ForegroundColor White
    Write-Host "  Status: $($healthData.status)" -ForegroundColor Cyan
    Write-Host "  Version: $($healthData.version)" -ForegroundColor Cyan
    Write-Host "  Presidio: $($healthData.presidio_status)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "=== Test Passed! ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "Backend is running successfully." -ForegroundColor White
    Write-Host "You can test it at: http://127.0.0.1:$port" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Press any key to stop the backend and exit..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    
} catch {
    Write-Host "✗ Health check failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "The backend may still be starting. Check the backend window for errors." -ForegroundColor Yellow
}

# Stop the backend
Write-Host ""
Write-Host "Stopping backend..." -ForegroundColor Yellow
Stop-Process -Id $backendProcess.Id -Force
Write-Host "✓ Backend stopped" -ForegroundColor Green
