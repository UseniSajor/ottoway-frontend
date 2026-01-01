# Production Deployment Guide

This guide walks you through deploying the Kealee Platform to production using Railway (backend) and Vercel (frontend).

## Prerequisites

- Node.js 18+ installed
- Railway account (https://railway.app)
- Vercel account (https://vercel.com)
- PostgreSQL database (Railway provides this)
- Stripe account (for payments)
- AWS account (for S3 file storage)

## ⚠️ IMPORTANT: Pre-Deployment Checklist

**Before deploying, ensure:**
- [ ] Backend TypeScript build succeeds (`cd backend && npm run build`)
- [ ] Frontend TypeScript build succeeds (`cd frontend && npm run build`)
- [ ] All critical errors resolved (see `BUILD_ISSUES.md`)
- [ ] Database migrations are up to date
- [ ] Environment variables are configured

---

## Phase 4: Production Builds

### Step 1: Create Production Environment Files

**Backend:**
```bash
cd backend
copy .env.production.example .env.production
# Edit .env.production with your production values
```

**Frontend:**
```bash
cd frontend
copy .env.production.example .env.production
# Edit .env.production with your production values
```

### Step 2: Build Production Packages

**Windows (PowerShell):**
```powershell
.\build-production.ps1
```

**Unix/Linux/Mac:**
```bash
chmod +x build-production.sh
./build-production.sh
```

**Manual Build:**
```bash
# Backend
cd backend
npm install
npx prisma generate
npm run build

# Frontend
cd ../frontend
npm install
npm run build
```

---

## Phase 5: Deployment

### Task 5.1: Deploy Backend to Railway

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway:**
   ```bash
   railway login
   ```

3. **Initialize Railway Project:**
   ```bash
   cd backend
   railway init
   ```
   - Select: "Create new project"
   - Name: `kealee-backend`

4. **Add PostgreSQL Database:**
   ```bash
   railway add postgresql
   ```

5. **Set Environment Variables:**
   ```bash
   railway variables set NODE_ENV=production
   railway variables set JWT_SECRET=your-secret-here-min-32-chars
   railway variables set PORT=5001
   railway variables set CORS_ORIGIN=https://your-frontend.vercel.app
   railway variables set STRIPE_SECRET_KEY=sk_live_...
   railway variables set STRIPE_WEBHOOK_SECRET=whsec_...
   railway variables set ANTHROPIC_API_KEY=sk-ant-...
   railway variables set AWS_ACCESS_KEY_ID=your-aws-key
   railway variables set AWS_SECRET_ACCESS_KEY=your-aws-secret
   railway variables set AWS_REGION=us-east-1
   railway variables set AWS_S3_BUCKET=your-bucket-name
   ```
   
   **Important:** The `DATABASE_URL` is automatically set by Railway when you add PostgreSQL. You don't need to set it manually.

6. **Deploy:**
   ```bash
   railway up
   ```

7. **Get Backend URL:**
   ```bash
   railway domain
   ```
   Note the URL (e.g., `https://kealee-backend.railway.app`)

---

### Task 5.2: Deploy Frontend to Vercel

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy (First Time):**
   ```bash
   cd frontend
   vercel
   ```
   
   Follow prompts:
   - Set up and deploy? **Y**
   - Which scope? (select your account)
   - Link to existing project? **N**
   - Project name? `kealee-platform`
   - Directory? `./`
   - Override settings? **N**

4. **Set Environment Variables:**
   ```bash
   vercel env add VITE_API_BASE_URL production
   # Enter: https://kealee-backend.railway.app (your Railway backend URL)
   
   vercel env add VITE_STRIPE_PUBLISHABLE_KEY production
   # Enter: pk_live_... (your Stripe publishable key)
   ```

5. **Deploy to Production:**
   ```bash
   vercel --prod
   ```

6. **Get Frontend URL:**
   - Check Vercel dashboard or use: `vercel ls`
   - Example: `https://kealee-platform.vercel.app`

---

### Task 5.3: Update CORS on Backend

After deploying the frontend, update the backend CORS to allow your Vercel domain:

```bash
cd backend
railway variables set CORS_ORIGIN=https://kealee-platform.vercel.app
railway up
```

---

### Task 5.4: Final Production Test

```bash
# Test backend health endpoint
curl https://kealee-backend.railway.app/api/health

# Test frontend
curl https://kealee-platform.vercel.app
```

---

## Troubleshooting

### Backend Won't Start

1. **Check Railway Logs:**
   ```bash
   railway logs
   ```

2. **Common Issues:**
   - Database not connected: Check `DATABASE_URL` is set automatically
   - Missing environment variables: Verify all required vars are set
   - Prisma not generated: Railway should handle this automatically via `railway.json`

### Frontend Build Fails

1. **Check Build Logs in Vercel Dashboard**

2. **Common Issues:**
   - TypeScript errors: Fix errors before deploying
   - Missing environment variables: Set `VITE_API_BASE_URL` and `VITE_STRIPE_PUBLISHABLE_KEY`
   - Build timeout: Increase build timeout in Vercel settings

### CORS Errors

1. **Update Backend CORS:**
   ```bash
   railway variables set CORS_ORIGIN=https://your-frontend-domain.vercel.app
   railway up
   ```

2. **Verify CORS_ORIGIN matches exactly** (including protocol and trailing slash)

### Database Connection Fails

1. **Verify DATABASE_URL is set** (Railway sets this automatically)
2. **Check database is running** in Railway dashboard
3. **Run migrations:**
   ```bash
   railway run npx prisma migrate deploy
   ```

---

## Success Criteria

✅ Backend compiles without errors  
✅ Frontend builds without errors  
✅ Both servers start successfully  
✅ Can access frontend at production URL  
✅ Can access backend at production URL  
✅ No CORS errors in browser console  
✅ Can login/register  
✅ Pages load without crashing  
✅ API calls return data (or appropriate errors)  
✅ Production builds complete successfully  
✅ Deployed to Vercel/Railway successfully  
✅ Production app accessible via URL  

**When all criteria are met: 🎉 PLATFORM IS LIVE!**

---

## Quick Reference

### Local Development
```bash
# Terminal 1 - Backend
cd backend && npm install && npx prisma generate && npm run dev

# Terminal 2 - Frontend  
cd frontend && npm install && npm run dev

# Open: http://localhost:3000
```

### Production Build
```bash
# Windows
.\build-production.ps1

# Unix/Linux/Mac
./build-production.sh
```

### Deploy to Production
```bash
# Backend (Railway)
cd backend && railway up

# Frontend (Vercel)
cd frontend && vercel --prod
```

