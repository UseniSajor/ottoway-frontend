# Setup GitHub & Deploy to Vercel

## Step 1: Create GitHub Repository

1. Go to: https://github.com/new
2. Repository name: `kealee-platform-v2`
3. Description: "Kealee Construction Platform v2"
4. Visibility: Choose Public or Private
5. **DO NOT** initialize with README, .gitignore, or license
6. Click "Create repository"

## Step 2: Connect and Push to GitHub

After creating the repo, GitHub will show you commands. Use these:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/kealee-platform-v2.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

## Step 3: Deploy to Vercel

**Option A: Via Vercel Dashboard (Recommended)**
1. Go to: https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure:
   - Framework Preset: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Add Environment Variables:
   - `VITE_API_BASE_URL` = `https://ottoway-backend-production.up.railway.app`
6. Click "Deploy"

**Option B: Via Vercel CLI**
```powershell
cd frontend
vercel login
vercel --prod --yes
```

═══════════════════════════════════════════════════════════════════════════════


