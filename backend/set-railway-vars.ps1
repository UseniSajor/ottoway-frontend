# PowerShell script to set all required Railway environment variables
# Run from the backend directory

Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "SETTING RAILWAY ENVIRONMENT VARIABLES" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check if Railway CLI is installed
try {
    railway --version | Out-Null
} catch {
    Write-Host "❌ Railway CLI not found. Installing..." -ForegroundColor Red
    npm install -g @railway/cli
}

# Check if we're in a Railway project
Write-Host "Checking Railway project connection..." -ForegroundColor Yellow
$railwayStatus = railway status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Not connected to Railway project. Linking..." -ForegroundColor Yellow
    railway link
}

Write-Host ""
Write-Host "=== SETTING REQUIRED ENVIRONMENT VARIABLES ===" -ForegroundColor Green
Write-Host ""

# 1. NODE_ENV
Write-Host "Setting NODE_ENV=production..." -ForegroundColor Yellow
railway variables set NODE_ENV=production
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ NODE_ENV set" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to set NODE_ENV" -ForegroundColor Red
}

# 2. PORT
Write-Host "Setting PORT=5001..." -ForegroundColor Yellow
railway variables set PORT=5001
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ PORT set" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to set PORT" -ForegroundColor Red
}

# 3. JWT_SECRET (generate if not provided)
Write-Host "Generating JWT_SECRET..." -ForegroundColor Yellow
$jwtSecret = node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
railway variables set "JWT_SECRET=$jwtSecret"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ JWT_SECRET generated and set" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to set JWT_SECRET" -ForegroundColor Red
}

# 4. CORS_ORIGIN (prompt user)
Write-Host ""
Write-Host "CORS_ORIGIN is required. Enter your Vercel frontend URL:" -ForegroundColor Yellow
Write-Host "Example: https://kealee-platform.vercel.app" -ForegroundColor Gray
$corsOrigin = Read-Host "CORS_ORIGIN"

if ($corsOrigin) {
    railway variables set "CORS_ORIGIN=$corsOrigin"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ CORS_ORIGIN set to $corsOrigin" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to set CORS_ORIGIN" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️  Skipping CORS_ORIGIN (set manually later)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== OPTIONAL ENVIRONMENT VARIABLES ===" -ForegroundColor Cyan
Write-Host ""

# Ask about optional variables
$setStripe = Read-Host "Set Stripe keys? (y/n)"
if ($setStripe -eq "y" -or $setStripe -eq "Y") {
    $stripeSecret = Read-Host "STRIPE_SECRET_KEY (sk_live_...)"
    if ($stripeSecret) {
        railway variables set "STRIPE_SECRET_KEY=$stripeSecret"
    }
    
    $stripeWebhook = Read-Host "STRIPE_WEBHOOK_SECRET (whsec_...)"
    if ($stripeWebhook) {
        railway variables set "STRIPE_WEBHOOK_SECRET=$stripeWebhook"
    }
}

$setAnthropic = Read-Host "Set Anthropic API key? (y/n)"
if ($setAnthropic -eq "y" -or $setAnthropic -eq "Y") {
    $anthropicKey = Read-Host "ANTHROPIC_API_KEY (sk-ant-...)"
    if ($anthropicKey) {
        railway variables set "ANTHROPIC_API_KEY=$anthropicKey"
    }
}

$setAWS = Read-Host "Set AWS credentials? (y/n)"
if ($setAWS -eq "y" -or $setAWS -eq "Y") {
    $awsKey = Read-Host "AWS_ACCESS_KEY_ID"
    if ($awsKey) {
        railway variables set "AWS_ACCESS_KEY_ID=$awsKey"
    }
    
    $awsSecret = Read-Host "AWS_SECRET_ACCESS_KEY"
    if ($awsSecret) {
        railway variables set "AWS_SECRET_ACCESS_KEY=$awsSecret"
    }
    
    $awsRegion = Read-Host "AWS_REGION (default: us-east-1)"
    if (-not $awsRegion) { $awsRegion = "us-east-1" }
    railway variables set "AWS_REGION=$awsRegion"
    
    $awsBucket = Read-Host "AWS_S3_BUCKET"
    if ($awsBucket) {
        railway variables set "AWS_S3_BUCKET=$awsBucket"
    }
}

Write-Host ""
Write-Host "=== VERIFYING ENVIRONMENT VARIABLES ===" -ForegroundColor Green
Write-Host ""
railway variables

Write-Host ""
Write-Host "=== REDEPLOYING BACKEND ===" -ForegroundColor Green
Write-Host ""
$redeploy = Read-Host "Redeploy backend now? (y/n)"
if ($redeploy -eq "y" -or $redeploy -eq "Y") {
    Write-Host "Deploying..." -ForegroundColor Yellow
    railway up
    Write-Host ""
    Write-Host "✅ Deployment complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Get your backend URL with: railway domain" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  Remember to redeploy: railway up" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Environment variables setup complete!" -ForegroundColor Green

