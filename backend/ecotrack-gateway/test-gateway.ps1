# EcoTrack Gateway - Health Check Script (PowerShell)
# Usage: .\test-gateway.ps1

Write-Host "🔍 Testing EcoTrack Gateway..." -ForegroundColor Yellow
Write-Host ""

# Test 1: Gateway Health
Write-Host "[1/5] Testing Gateway Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -Method Get -ErrorAction Stop
    $content = $response.Content | ConvertFrom-Json
    
    if ($content.status -eq "healthy" -or $content.status -eq "degraded") {
        Write-Host "✓ Gateway is responding" -ForegroundColor Green
        Write-Host "    Status: $($content.status)"
        Write-Host "    Timestamp: $($content.timestamp)"
    } else {
        Write-Host "⚠ Unexpected status: $($content.status)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ Gateway health check failed" -ForegroundColor Red
    Write-Host "    Error: $($_.Exception.Message)"
}
Write-Host ""

# Test 2: Auth Service
Write-Host "[2/5] Testing Auth Service (via Gateway)..." -ForegroundColor Yellow
try {
    $body = @{
        email = "test@example.com"
        password = "test123"
        name = "Test User"
        role = "CITOYEN"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/register" `
        -Method Post `
        -Body $body `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    Write-Host "✓ Auth service is responding" -ForegroundColor Green
    Write-Host "    Status Code: $($response.StatusCode)"
} catch {
    if ($_.Exception.Response.StatusCode -in 400..499) {
        Write-Host "✓ Auth service is responding (validation error expected)" -ForegroundColor Green
        Write-Host "    Status Code: $($_.Exception.Response.StatusCode)"
    } else {
        Write-Host "⚠ Auth service error" -ForegroundColor Yellow
        Write-Host "    Error: $($_.Exception.Message)"
    }
}
Write-Host ""

# Test 3: Container Service
Write-Host "[3/5] Testing Container Service (via Gateway)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/zones" -Method Get -ErrorAction Stop
    Write-Host "✓ Container service is responding" -ForegroundColor Green
    Write-Host "    Status Code: $($response.StatusCode)"
} catch {
    Write-Host "⚠ Container service error" -ForegroundColor Yellow
    Write-Host "    Error: $($_.Exception.Message)"
}
Write-Host ""

# Test 4: Tour Service
Write-Host "[4/5] Testing Tour Service (via Gateway)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/tournees" -Method Get -ErrorAction Stop
    Write-Host "✓ Tour service is responding" -ForegroundColor Green
    Write-Host "    Status Code: $($response.StatusCode)"
} catch {
    Write-Host "⚠ Tour service error" -ForegroundColor Yellow
    Write-Host "    Error: $($_.Exception.Message)"
}
Write-Host ""

# Test 5: Signal Service
Write-Host "[5/5] Testing Signal Service (via Gateway)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/signalements" -Method Get -ErrorAction Stop
    Write-Host "✓ Signal service is responding" -ForegroundColor Green
    Write-Host "    Status Code: $($response.StatusCode)"
} catch {
    Write-Host "⚠ Signal service error" -ForegroundColor Yellow
    Write-Host "    Error: $($_.Exception.Message)"
}
Write-Host ""

Write-Host "✓ All tests completed!" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 Gateway testing complete!" -ForegroundColor Green
