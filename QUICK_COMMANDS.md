# Quick Commands - Copy & Paste

═══════════════════════════════════════════════════════════════════════════════
RUN CLEANUP SCRIPTS (Do This First)
═══════════════════════════════════════════════════════════════════════════════

```powershell
cd frontend
.\run-all-cleanup.ps1
cd ..
```

═══════════════════════════════════════════════════════════════════════════════
COMMIT YOUR CHANGES
═══════════════════════════════════════════════════════════════════════════════

```powershell
# Make sure you're in project root
cd "C:\Ottoway Projects\kealee-platform-v2"

# Add all files
git add .

# Commit
git commit -m "Remove demo data, activate all features, connect to API"
```

═══════════════════════════════════════════════════════════════════════════════
DEPLOY TO VERCEL (Choose One)
═══════════════════════════════════════════════════════════════════════════════

**Option 1: Deploy Directly (Easiest)**
```powershell
cd frontend
vercel --prod
```

**Option 2: Connect to GitHub First (Better for long-term)**
```powershell
# Create repo on GitHub first, then:
git remote add origin https://github.com/yourusername/kealee-platform-v2.git
git branch -M main
git push -u origin main

# Then connect GitHub repo in Vercel dashboard
```

═══════════════════════════════════════════════════════════════════════════════
VERIFY DEPLOYMENT
═══════════════════════════════════════════════════════════════════════════════

Test: https://ottoway-frontend-o3yr.vercel.app

Check:
- ✅ All features work
- ✅ No demo data
- ✅ Navigation works

═══════════════════════════════════════════════════════════════════════════════


