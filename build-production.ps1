# Production Build Script for Windows PowerShell
# Creates production builds for both backend and frontend

Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "PHASE 4: PRODUCTION BUILD" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the project root
if (-not (Test-Path "backend" -PathType Container) -or -not (Test-Path "frontend" -PathType Container)) {
    Write-Host "❌ Error: Must run from project root directory" -ForegroundColor Red
    exit 1
}

Write-Host "=== CREATING PRODUCTION BUILDS ===" -ForegroundColor Yellow
Write-Host ""

# Backend production build
Write-Host "📦 Building backend..." -ForegroundColor Green
Set-Location backend

# Install dependencies if needed
if (-not (Test-Path "node_modules" -PathType Container)) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    npm install
}

# Generate Prisma client
Write-Host "Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate

# Build TypeScript
Write-Host "Compiling TypeScript..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend build failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

# Create backend tarball (Windows doesn't have tar by default, so we'll use PowerShell compression)
Write-Host "Creating backend production package..." -ForegroundColor Yellow
Set-Location ..
$backendFiles = @(
    "backend/dist",
    "backend/node_modules",
    "backend/prisma",
    "backend/package.json",
    "backend/package-lock.json"
)
if (Test-Path "backend/.env.production") {
    $backendFiles += "backend/.env.production"
}
Compress-Archive -Path $backendFiles -DestinationPath "backend-production.zip" -Force
Write-Host "✅ Backend package created: backend-production.zip" -ForegroundColor Green

# Frontend production build
Write-Host ""
Write-Host "📦 Building frontend..." -ForegroundColor Green
Set-Location frontend

# Install dependencies if needed
if (-not (Test-Path "node_modules" -PathType Container)) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
}

# Build frontend
Write-Host "Building frontend (this may take a while)..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend build failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

# Create frontend tarball
Write-Host "Creating frontend production package..." -ForegroundColor Yellow
Set-Location ..
Compress-Archive -Path "frontend/dist" -DestinationPath "frontend-production.zip" -Force
Write-Host "✅ Frontend package created: frontend-production.zip" -ForegroundColor Green

Write-Host ""
Write-Host "✅ Production builds created successfully!" -ForegroundColor Green
Write-Host ""
Get-ChildItem -Filter "*-production.zip" | ForEach-Object {
    $size = [math]::Round($_.Length / 1MB, 2)
    Write-Host "  - $($_.Name) ($size MB)" -ForegroundColor Cyan
}
Write-Host ""
Write-Host "⚠️  Next steps:" -ForegroundColor Yellow
Write-Host "  1. Review and update .env.production files with real values" -ForegroundColor Yellow
Write-Host "  2. Deploy backend to Railway" -ForegroundColor Yellow
Write-Host "  3. Deploy frontend to Vercel" -ForegroundColor Yellow

