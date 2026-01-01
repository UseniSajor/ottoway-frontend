# Run all cleanup scripts in sequence
# Run from frontend directory: .\run-all-cleanup.ps1

Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "REMOVING DEMO DATA & ACTIVATING ALL FEATURES" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Step 1: Remove demo data
Write-Host "STEP 1: Removing demo data..." -ForegroundColor Green
Write-Host ""
.\cleanup-demo-data.ps1

Write-Host ""
Write-Host "STEP 2: Activating navigation..." -ForegroundColor Green
Write-Host ""
node fix-all-navigation.js

Write-Host ""
Write-Host "STEP 3: Connecting pages to API..." -ForegroundColor Green
Write-Host ""
node connect-to-api.js

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ ALL CLEANUP COMPLETE!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Test locally: npm run dev" -ForegroundColor Gray
Write-Host "2. Review changes: git diff" -ForegroundColor Gray
Write-Host "3. Commit: git add . && git commit -m 'Remove demo data, activate features'" -ForegroundColor Gray
Write-Host "4. Deploy: git push (Vercel will auto-deploy)" -ForegroundColor Gray
Write-Host ""

