# Script to push to GitHub and deploy to Vercel
# Run from project root: .\deploy-to-github-vercel.ps1

Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "DEPLOY TO GITHUB & VERCEL" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check if remote exists
$remote = git remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  No GitHub remote configured." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "STEP 1: Create GitHub Repository" -ForegroundColor Green
    Write-Host "1. Go to: https://github.com/new" -ForegroundColor Gray
    Write-Host "2. Repository name: kealee-platform-v2" -ForegroundColor Gray
    Write-Host "3. DO NOT initialize with README" -ForegroundColor Gray
    Write-Host "4. Click 'Create repository'" -ForegroundColor Gray
    Write-Host ""
    
    $githubUrl = Read-Host "Enter your GitHub repository URL (e.g., https://github.com/username/kealee-platform-v2.git)"
    
    if ($githubUrl) {
        Write-Host ""
        Write-Host "Connecting to GitHub..." -ForegroundColor Yellow
        git remote add origin $githubUrl
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ GitHub remote added" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to add remote" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "⚠️  Skipping GitHub setup. You can add it later with:" -ForegroundColor Yellow
        Write-Host "   git remote add origin https://github.com/yourusername/kealee-platform-v2.git" -ForegroundColor Gray
    }
} else {
    Write-Host "✅ GitHub remote found: $remote" -ForegroundColor Green
}

Write-Host ""
Write-Host "STEP 2: Push to GitHub" -ForegroundColor Green
Write-Host ""

# Rename branch to main if needed
$currentBranch = git branch --show-current
if ($currentBranch -ne "main") {
    Write-Host "Renaming branch from '$currentBranch' to 'main'..." -ForegroundColor Yellow
    git branch -M main
}

# Push to GitHub
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to push to GitHub" -ForegroundColor Red
    Write-Host "   You may need to:" -ForegroundColor Yellow
    Write-Host "   1. Create the repository on GitHub first" -ForegroundColor Gray
    Write-Host "   2. Check your GitHub credentials" -ForegroundColor Gray
    Write-Host "   3. Run: git push -u origin main manually" -ForegroundColor Gray
}

Write-Host ""
Write-Host "STEP 3: Deploy to Vercel" -ForegroundColor Green
Write-Host ""

# Check if Vercel CLI is installed
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
}

# Check if logged in
Write-Host "Checking Vercel login status..." -ForegroundColor Yellow
$vercelCheck = vercel whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Not logged in to Vercel" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Logging in to Vercel..." -ForegroundColor Yellow
    Write-Host "This will open your browser..." -ForegroundColor Gray
    vercel login
} else {
    Write-Host "✅ Logged in to Vercel" -ForegroundColor Green
}

Write-Host ""
Write-Host "Deploying to Vercel..." -ForegroundColor Yellow
Set-Location frontend
vercel --prod --yes

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Successfully deployed to Vercel!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your platform is now live!" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Vercel deployment failed" -ForegroundColor Red
    Write-Host "   Check the error messages above" -ForegroundColor Yellow
}

Set-Location ..

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan


