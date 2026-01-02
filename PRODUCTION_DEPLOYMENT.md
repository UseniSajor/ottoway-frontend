# DEPLOY KEALEE PLATFORM - PRODUCTION READY

This guide will deploy your complete platform to production with Vercel (frontend) and Railway (backend + database).

═══════════════════════════════════════════════════════════════════════════════
PRE-DEPLOYMENT CHECKLIST
═══════════════════════════════════════════════════════════════════════════════

Before deploying, verify everything works locally:

## 1. Verify Local Development Works

```bash
# Terminal 1 - Start Backend
cd backend
npm install
npx prisma generate
npm run dev

# Terminal 2 - Start Frontend
cd frontend
npm install
npm run dev

# Open browser: http://localhost:3000
# Verify:
# - Backend runs on http://localhost:5001
# - Frontend connects to backend
# - Can login/register
# - Pages load without errors
```

## 2. Fix Build Errors

⚠️ **CRITICAL:** Both backend and frontend must build successfully before deployment.

### Backend Build Check
```bash
cd backend
npm run build
```

**If build fails:**
- See `BUILD_ISSUES.md` for common errors
- Fix all TypeScript compilation errors
- Ensure Prisma client is generated: `npx prisma generate`
- Verify database schema is up to date: `npx prisma migrate dev`

### Frontend Build Check
```bash
cd frontend
npm run build
```

**If build fails:**
- Fix TypeScript errors
- Install missing dependencies
- Check for missing environment variables

## 3. Database Migrations

```bash
cd backend
# Ensure all migrations are applied
npx prisma migrate status

# If migrations are pending, apply them
npx prisma migrate deploy
```

## 4. Environment Variables Prepared

Create production environment files (see Phase 1 below).

## 5. Accounts Ready

- [ ] Railway account created (https://railway.app)
- [ ] Vercel account created (https://vercel.com)
- [ ] Stripe account with live keys
- [ ] AWS account with S3 bucket
- [ ] Anthropic API key (if using AI features)

═══════════════════════════════════════════════════════════════════════════════
PHASE 1: ENVIRONMENT SETUP
═══════════════════════════════════════════════════════════════════════════════

## Step 1.1: Create Backend Production Environment File

```bash
cd backend
copy .env.production.example .env.production
# Edit .env.production with your production values
```

**Required Variables:**
```env
DATABASE_URL="postgresql://user:pass@host:5432/kealee_production"
JWT_SECRET="CHANGE-THIS-TO-STRONG-SECRET-MIN-32-CHARS"
NODE_ENV=production
PORT=5001
CORS_ORIGIN="https://your-frontend.vercel.app"
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
ANTHROPIC_API_KEY="sk-ant-..."
AWS_ACCESS_KEY_ID="your-aws-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-bucket-name"
```

## Step 1.2: Create Frontend Production Environment File

```bash
cd frontend
copy .env.production.example .env.production
# Edit .env.production with your production values
```

**Required Variables:**
```env
VITE_API_BASE_URL=https://your-backend.railway.app
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

**Note:** You'll get the backend URL after deploying to Railway (Step 2.7).

═══════════════════════════════════════════════════════════════════════════════
PHASE 2: BUILD PRODUCTION PACKAGES
═══════════════════════════════════════════════════════════════════════════════

## Option A: Use Build Scripts (Recommended)

**Windows:**
```powershell
.\build-production.ps1
```

**Unix/Linux/Mac:**
```bash
chmod +x build-production.sh
./build-production.sh
```

## Option B: Manual Build

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

**Verify builds succeeded:**
- Backend: Check `backend/dist/` exists with compiled files
- Frontend: Check `frontend/dist/` exists with built assets

═══════════════════════════════════════════════════════════════════════════════
PHASE 3: DEPLOY BACKEND TO RAILWAY
═══════════════════════════════════════════════════════════════════════════════

## Step 3.1: Install Railway CLI

```bash
npm install -g @railway/cli
```

## Step 3.2: Login to Railway

```bash
railway login
```

This will open your browser for authentication.

## Step 3.3: Initialize Railway Project

```bash
cd backend
railway init
```

**Follow prompts:**
- Select: **"Create new project"**
- Project name: `kealee-backend`
- Select the project when prompted

## Step 3.4: Add PostgreSQL Database

```bash
railway add postgresql
```

Railway will automatically:
- Create a PostgreSQL database
- Set `DATABASE_URL` environment variable
- Link it to your backend service

## Step 3.5: Set Environment Variables

```bash
# Required variables
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=your-strong-secret-min-32-chars
railway variables set PORT=5001
railway variables set CORS_ORIGIN=https://your-frontend.vercel.app

# Stripe (use live keys)
railway variables set STRIPE_SECRET_KEY=sk_live_...
railway variables set STRIPE_WEBHOOK_SECRET=whsec_...

# Anthropic (if using AI)
railway variables set ANTHROPIC_API_KEY=sk-ant-...

# AWS S3 (for file storage)
railway variables set AWS_ACCESS_KEY_ID=your-aws-key
railway variables set AWS_SECRET_ACCESS_KEY=your-aws-secret
railway variables set AWS_REGION=us-east-1
railway variables set AWS_S3_BUCKET=your-bucket-name
```

**Important Notes:**
- `DATABASE_URL` is automatically set by Railway - don't set it manually
- `CORS_ORIGIN` will be updated after frontend deployment (Step 4.6)
- Use strong, unique values for `JWT_SECRET` (minimum 32 characters)

## Step 3.6: Deploy Backend

```bash
railway up
```

This will:
- Build your backend
- Run Prisma migrations
- Start the server

**Monitor deployment:**
```bash
railway logs
```

## Step 3.7: Get Backend URL

```bash
railway domain
```

**Save this URL!** You'll need it for:
- Frontend environment variable `VITE_API_BASE_URL`
- Testing the deployment

Example output: `https://kealee-backend.railway.app`

## Step 3.8: Verify Backend Deployment

```bash
# Test health endpoint
curl https://your-backend.railway.app/api/health

# Should return: {"status":"ok"} or similar
```

**If health check fails:**
- Check logs: `railway logs`
- Verify all environment variables are set
- Check database connection

═══════════════════════════════════════════════════════════════════════════════
PHASE 4: DEPLOY FRONTEND TO VERCEL
═══════════════════════════════════════════════════════════════════════════════

## Step 4.1: Install Vercel CLI

```bash
npm install -g vercel
```

## Step 4.2: Login to Vercel

```bash
vercel login
```

This will open your browser for authentication.

## Step 4.3: Deploy Frontend (First Time)

```bash
cd frontend
vercel
```

**Follow prompts:**
- Set up and deploy? **Y**
- Which scope? (select your account/team)
- Link to existing project? **N**
- Project name? `kealee-platform`
- Directory? `./`
- Override settings? **N**

This creates a preview deployment.

## Step 4.4: Set Environment Variables

```bash
# API Base URL (use your Railway backend URL from Step 3.7)
vercel env add VITE_API_BASE_URL production
# Enter: https://kealee-backend.railway.app

# Stripe Publishable Key
vercel env add VITE_STRIPE_PUBLISHABLE_KEY production
# Enter: pk_live_...
```

**Verify variables:**
```bash
vercel env ls
```

## Step 4.5: Deploy to Production

```bash
vercel --prod
```

This creates your production deployment.

## Step 4.6: Get Frontend URL

Check Vercel dashboard or:
```bash
vercel ls
```

Example: `https://kealee-platform.vercel.app`

**Save this URL!**

## Step 4.7: Update Backend CORS

Now that you have the frontend URL, update the backend CORS:

```bash
cd backend
railway variables set CORS_ORIGIN=https://kealee-platform.vercel.app
railway up
```

This redeploys the backend with the correct CORS origin.

═══════════════════════════════════════════════════════════════════════════════
PHASE 5: POST-DEPLOYMENT VERIFICATION
═══════════════════════════════════════════════════════════════════════════════

## Step 5.1: Test Backend

```bash
# Health check
curl https://your-backend.railway.app/api/health

# Should return: {"status":"ok"}
```

## Step 5.2: Test Frontend

```bash
# Check frontend loads
curl https://your-frontend.vercel.app

# Open in browser and verify:
# - Page loads without errors
# - No CORS errors in console
# - Can navigate between pages
```

## Step 5.3: Test Authentication

1. Open frontend in browser
2. Try to register a new account
3. Try to login
4. Verify API calls work

## Step 5.4: Check Logs

**Backend logs:**
```bash
cd backend
railway logs
```

**Frontend logs:**
```bash
cd frontend
vercel logs
```

Look for:
- ✅ No errors
- ✅ Successful API calls
- ✅ Database connections working

═══════════════════════════════════════════════════════════════════════════════
PHASE 6: TROUBLESHOOTING
═══════════════════════════════════════════════════════════════════════════════

## Issue: Backend Won't Start

**Check:**
1. Railway logs: `railway logs`
2. Environment variables: `railway variables`
3. Database connection: Verify `DATABASE_URL` is set
4. Build errors: Check if TypeScript compiled successfully

**Common fixes:**
- Missing environment variables
- Database not connected
- Prisma client not generated
- Port conflicts

## Issue: Frontend Build Fails

**Check:**
1. Vercel build logs in dashboard
2. TypeScript errors: `cd frontend && npm run build`
3. Missing environment variables: `vercel env ls`

**Common fixes:**
- Fix TypeScript errors
- Set missing environment variables
- Check build timeout settings

## Issue: CORS Errors

**Fix:**
```bash
cd backend
railway variables set CORS_ORIGIN=https://your-exact-frontend-url.vercel.app
railway up
```

**Important:** CORS_ORIGIN must match exactly (including https:// and no trailing slash)

## Issue: Database Connection Fails

**Check:**
1. Database is running in Railway dashboard
2. `DATABASE_URL` is set (Railway sets this automatically)
3. Run migrations: `railway run npx prisma migrate deploy`

## Issue: API Calls Fail

**Check:**
1. Backend is running: `railway logs`
2. Frontend `VITE_API_BASE_URL` is correct
3. CORS is configured correctly
4. Network tab in browser for specific errors

═══════════════════════════════════════════════════════════════════════════════
PHASE 7: MONITORING & MAINTENANCE
═══════════════════════════════════════════════════════════════════════════════

## Set Up Monitoring

1. **Railway Dashboard:**
   - Monitor backend logs
   - Check database usage
   - View deployment history

2. **Vercel Dashboard:**
   - Monitor frontend deployments
   - Check build logs
   - View analytics

3. **Application Monitoring:**
   - Set up error tracking (e.g., Sentry)
   - Monitor API response times
   - Track user activity

## Regular Maintenance

1. **Database Backups:**
   - Railway provides automatic backups
   - Verify backup strategy

2. **Security Updates:**
   - Keep dependencies updated
   - Monitor security advisories
   - Update environment variables regularly

3. **Performance Monitoring:**
   - Monitor API response times
   - Check database query performance
   - Optimize slow endpoints

═══════════════════════════════════════════════════════════════════════════════
QUICK REFERENCE COMMANDS
═══════════════════════════════════════════════════════════════════════════════

## Local Development
```bash
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm run dev
```

## Build Production
```bash
# Windows
.\build-production.ps1

# Unix/Linux/Mac
./build-production.sh
```

## Deploy Backend
```bash
cd backend
railway up
railway logs
railway domain
```

## Deploy Frontend
```bash
cd frontend
vercel --prod
vercel logs
```

## Check Status
```bash
# Backend health
curl https://your-backend.railway.app/api/health

# Frontend
curl https://your-frontend.vercel.app
```

═══════════════════════════════════════════════════════════════════════════════
SUCCESS CRITERIA
═══════════════════════════════════════════════════════════════════════════════

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

═══════════════════════════════════════════════════════════════════════════════
NEXT STEPS AFTER DEPLOYMENT
═══════════════════════════════════════════════════════════════════════════════

1. **Set up custom domains** (optional)
   - Railway: Configure custom domain for backend
   - Vercel: Configure custom domain for frontend

2. **Enable monitoring**
   - Set up error tracking
   - Configure alerts
   - Monitor performance

3. **Set up CI/CD** (optional)
   - Connect GitHub to Railway/Vercel
   - Enable automatic deployments

4. **Documentation**
   - Update API documentation
   - Document deployment process
   - Create runbooks for common issues

═══════════════════════════════════════════════════════════════════════════════

**Last Updated:** 2026-01-01  
**Status:** Production Ready


