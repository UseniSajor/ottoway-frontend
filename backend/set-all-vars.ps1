# Complete script to set ALL Railway environment variables
# Run from backend directory: .\set-all-vars.ps1

Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "SETTING ALL RAILWAY ENVIRONMENT VARIABLES" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check Railway CLI
if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Railway CLI..." -ForegroundColor Yellow
    npm install -g @railway/cli
}

# Check project connection
Write-Host "Checking Railway connection..." -ForegroundColor Yellow
railway status | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Linking to Railway project..." -ForegroundColor Yellow
    railway link
}

Write-Host ""
Write-Host "=== REQUIRED VARIABLES ===" -ForegroundColor Green
Write-Host ""

# 1. NODE_ENV
Write-Host "Setting NODE_ENV=production..." -ForegroundColor Yellow
railway variables set NODE_ENV=production
Write-Host "✅ NODE_ENV set" -ForegroundColor Green

# 2. PORT
Write-Host "Setting PORT=5001..." -ForegroundColor Yellow
railway variables set PORT=5001
Write-Host "✅ PORT set" -ForegroundColor Green

# 3. JWT_SECRET
Write-Host "Generating JWT_SECRET..." -ForegroundColor Yellow
$jwtSecret = node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
railway variables set "JWT_SECRET=$jwtSecret"
Write-Host "✅ JWT_SECRET generated and set" -ForegroundColor Green

# 4. CORS_ORIGIN
Write-Host ""
Write-Host "Enter your Vercel frontend URL:" -ForegroundColor Yellow
Write-Host "Example: https://kealee-platform.vercel.app" -ForegroundColor Gray
$corsOrigin = Read-Host "CORS_ORIGIN"
if ($corsOrigin) {
    railway variables set "CORS_ORIGIN=$corsOrigin"
    Write-Host "✅ CORS_ORIGIN set" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== STRIPE VARIABLES (Required in Production) ===" -ForegroundColor Cyan
Write-Host ""

$stripeSecret = Read-Host "STRIPE_SECRET_KEY (sk_live_...)"
if ($stripeSecret) {
    railway variables set "STRIPE_SECRET_KEY=$stripeSecret"
    Write-Host "✅ STRIPE_SECRET_KEY set" -ForegroundColor Green
}

$stripePublishable = Read-Host "STRIPE_PUBLISHABLE_KEY (pk_live_...)"
if ($stripePublishable) {
    railway variables set "STRIPE_PUBLISHABLE_KEY=$stripePublishable"
    Write-Host "✅ STRIPE_PUBLISHABLE_KEY set" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== AWS VARIABLES (Required in Production) ===" -ForegroundColor Cyan
Write-Host ""

$awsKey = Read-Host "AWS_ACCESS_KEY_ID"
if ($awsKey) {
    railway variables set "AWS_ACCESS_KEY_ID=$awsKey"
    Write-Host "✅ AWS_ACCESS_KEY_ID set" -ForegroundColor Green
}

$awsSecret = Read-Host "AWS_SECRET_ACCESS_KEY"
if ($awsSecret) {
    railway variables set "AWS_SECRET_ACCESS_KEY=$awsSecret"
    Write-Host "✅ AWS_SECRET_ACCESS_KEY set" -ForegroundColor Green
}

$awsRegion = Read-Host "AWS_REGION (default: us-east-1)"
if (-not $awsRegion) { $awsRegion = "us-east-1" }
railway variables set "AWS_REGION=$awsRegion"
Write-Host "✅ AWS_REGION set to $awsRegion" -ForegroundColor Green

$awsBucket = Read-Host "AWS_S3_BUCKET (default: kealee-platform-uploads)"
if (-not $awsBucket) { $awsBucket = "kealee-platform-uploads" }
railway variables set "AWS_S3_BUCKET=$awsBucket"
Write-Host "✅ AWS_S3_BUCKET set to $awsBucket" -ForegroundColor Green

Write-Host ""
Write-Host "=== VERIFICATION ===" -ForegroundColor Green
Write-Host ""
railway variables

Write-Host ""
Write-Host "=== REDEPLOY ===" -ForegroundColor Green
Write-Host ""
$redeploy = Read-Host "Redeploy backend now? (y/n)"
if ($redeploy -eq "y" -or $redeploy -eq "Y") {
    Write-Host "Deploying..." -ForegroundColor Yellow
    railway up
    Write-Host ""
    Write-Host "✅ Deployment complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Get backend URL: railway domain" -ForegroundColor Cyan
    Write-Host "Test health: curl https://your-backend.up.railway.app/api/health" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  Remember to redeploy: railway up" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ All environment variables set!" -ForegroundColor Green


