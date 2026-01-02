# Quick script to set all REQUIRED Railway environment variables
# Run from backend directory: .\quick-set-env.ps1

Write-Host "Setting required Railway environment variables..." -ForegroundColor Green

# Required variables
railway variables set NODE_ENV=production
railway variables set PORT=5001

# Generate JWT_SECRET
$jwt = node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
railway variables set "JWT_SECRET=$jwt"

# Get Vercel URL
Write-Host "`nGetting Vercel URL..." -ForegroundColor Yellow
cd ../frontend
$vercelUrl = vercel ls --json 2>$null | ConvertFrom-Json | Where-Object { $_.target -eq 'production' } | Select-Object -First 1 -ExpandProperty url
cd ../backend

if ($vercelUrl) {
    railway variables set "CORS_ORIGIN=https://$vercelUrl"
    Write-Host "✅ CORS_ORIGIN set to https://$vercelUrl" -ForegroundColor Green
} else {
    Write-Host "⚠️  Could not get Vercel URL. Set manually:" -ForegroundColor Yellow
    Write-Host "   railway variables set CORS_ORIGIN=https://your-vercel-url.vercel.app" -ForegroundColor Gray
}

Write-Host "`n✅ Required variables set!" -ForegroundColor Green
Write-Host "`n⚠️  IMPORTANT: In production, you also need:" -ForegroundColor Yellow
Write-Host "   - STRIPE_SECRET_KEY" -ForegroundColor Gray
Write-Host "   - AWS_ACCESS_KEY_ID" -ForegroundColor Gray
Write-Host "   - AWS_SECRET_ACCESS_KEY" -ForegroundColor Gray
Write-Host "   - AWS_S3_BUCKET" -ForegroundColor Gray
Write-Host "`nSet them with: railway variables set VARIABLE_NAME=value" -ForegroundColor Gray


