# Railway.app Deployment Guide - Kealee Platform

Complete step-by-step guide for deploying the Kealee Construction Platform to Railway.app.

---

## Prerequisites

- [ ] Railway account created (sign up at [railway.app](https://railway.app))
- [ ] Railway CLI installed: `npm install -g @railway/cli`
- [ ] GitHub account (optional, for automatic deployments)
- [ ] Stripe account with live API keys
- [ ] Anthropic API key for ML features

---

## TASK 1: Install Railway CLI

```bash
# Install Railway CLI globally
npm install -g @railway/cli

# Verify installation
railway --version

# Login to Railway
railway login
# This will open your browser for authentication
```

---

## TASK 2: Deploy PostgreSQL Database

### Option A: Create New Project (Recommended)

```bash
# Create a new Railway project
railway init

# Follow the prompts:
# - Project name: kealee-platform (or your preferred name)
# - Select "Empty Project"

# Add PostgreSQL database
railway add postgresql

# Wait for database to be provisioned (takes ~30 seconds)
# Get the database URL
railway variables
# Look for DATABASE_URL variable - COPY THIS VALUE!
```

### Option B: Use Railway Dashboard

1. Go to [railway.app/dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Empty Project"
4. Click "+ New" → "Database" → "Add PostgreSQL"
5. Wait for provisioning
6. Click on the PostgreSQL service
7. Go to "Variables" tab
8. Copy the `DATABASE_URL` value

---

## TASK 3: Deploy Backend Service

### Step 3.1: Initialize Backend Service

```bash
cd backend

# Link to your Railway project (if not already linked)
railway link
# Select your project from the list

# Or create a new service in the project
railway service
# Select your project and create "backend" service
```

### Step 3.2: Set Environment Variables

Set all required environment variables using Railway CLI:

```bash
# Required variables
railway variables set DATABASE_URL=<paste-database-url-from-step-2>
railway variables set JWT_SECRET=$(openssl rand -base64 32)
railway variables set NODE_ENV=production
railway variables set PORT=5001

# CORS (will update after frontend is deployed)
railway variables set CORS_ORIGIN=https://your-frontend.railway.app

# Stripe (Required for payments/escrow)
railway variables set STRIPE_SECRET_KEY=sk_live_...
railway variables set STRIPE_PUBLISHABLE_KEY=pk_live_...
railway variables set STRIPE_WEBHOOK_SECRET=whsec_...

# Anthropic Claude API (Required for ML features)
railway variables set ANTHROPIC_API_KEY=sk-ant-...

# AWS S3 (Required for file uploads in production)
railway variables set AWS_ACCESS_KEY_ID=AKIA...
railway variables set AWS_SECRET_ACCESS_KEY=...
railway variables set AWS_REGION=us-east-1
railway variables set AWS_S3_BUCKET=kealee-production-uploads
```

**Alternative: Set via Railway Dashboard**
1. Go to your backend service in Railway dashboard
2. Click "Variables" tab
3. Click "+ New Variable"
4. Add each variable with its value

### Step 3.3: Configure Build Settings

Railway auto-detects Node.js projects. Verify these settings in Railway dashboard:

1. Go to backend service → "Settings" tab
2. **Root Directory:** `backend` (if deploying from monorepo root)
3. **Build Command:** `npm install && npm run build`
4. **Start Command:** `npm start`
5. **Node Version:** 18.x or higher

Or create `railway.json` in backend directory:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build",
    "watchPatterns": ["backend/**"]
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Step 3.4: Run Database Migrations

```bash
# Run migrations on Railway
railway run npx prisma generate
railway run npx prisma migrate deploy

# Verify migrations applied
railway run npx prisma migrate status
# Expected: "Database and migrations are in sync"
```

### Step 3.5: Deploy Backend

**Option A: Deploy via CLI**
```bash
# Deploy backend
railway up

# Watch deployment logs
railway logs --follow
```

**Option B: Deploy via GitHub (Recommended for CI/CD)**
1. Push your code to GitHub
2. In Railway dashboard, go to backend service → "Settings" → "Source"
3. Connect your GitHub repository
4. Select branch (usually `main` or `master`)
5. Railway will auto-deploy on every push

### Step 3.6: Get Backend URL

```bash
# Generate public domain for backend
railway domain

# Or in Railway dashboard:
# Go to backend service → "Settings" → "Networking"
# Click "Generate Domain"
# Copy the URL (e.g., https://kealee-backend-production.up.railway.app)
```

**Note the backend URL - you'll need it for frontend configuration!**

---

## TASK 4: Deploy Frontend Service

### Step 4.1: Initialize Frontend Service

```bash
cd frontend

# Create new service in the same Railway project
railway service
# Select your project
# Create "frontend" service
```

### Step 4.2: Set Environment Variables

```bash
# Set API URL (use backend URL from Step 3.6)
railway variables set VITE_API_BASE_URL=https://kealee-backend-production.up.railway.app

# Stripe Publishable Key
railway variables set VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

**Important:** Railway uses `VITE_` prefix for Vite environment variables, but you need to ensure they're available at build time.

### Step 4.3: Configure Build Settings

**Create `railway.json` in frontend directory:**

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npx serve -s dist -l $PORT",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

**Or configure in Railway Dashboard:**
1. Go to frontend service → "Settings"
2. **Build Command:** `npm install && npm run build`
3. **Start Command:** `npx serve -s dist -l $PORT`
4. **Root Directory:** `frontend` (if deploying from monorepo)

**Install serve package for static file serving:**
```bash
cd frontend
npm install --save-dev serve
```

Add to `frontend/package.json`:
```json
{
  "scripts": {
    "start": "serve -s dist -l $PORT"
  }
}
```

### Step 4.4: Deploy Frontend

```bash
# Deploy frontend
railway up

# Watch deployment logs
railway logs --follow
```

**Or deploy via GitHub:**
1. Connect GitHub repository in Railway dashboard
2. Select frontend service
3. Set root directory to `frontend/`
4. Auto-deploy on push

### Step 4.5: Get Frontend URL

```bash
# Generate public domain
railway domain

# Or in Railway dashboard:
# Go to frontend service → "Settings" → "Networking"
# Click "Generate Domain"
# Copy the URL (e.g., https://kealee-frontend-production.up.railway.app)
```

---

## TASK 5: Configure CORS

Update backend CORS_ORIGIN to allow frontend requests:

```bash
cd backend

# Update CORS_ORIGIN with frontend URL
railway variables set CORS_ORIGIN=https://kealee-frontend-production.up.railway.app

# Restart backend service
railway restart
```

**Or in Railway Dashboard:**
1. Go to backend service → "Variables"
2. Update `CORS_ORIGIN` value
3. Service will auto-restart

---

## TASK 6: Verify Deployment

### Backend Health Check

```bash
# Test backend health endpoint
curl https://kealee-backend-production.up.railway.app/health

# Expected response:
# {"status":"ok","timestamp":"2024-01-01T00:00:00.000Z"}
```

### Frontend Verification

1. Open frontend URL in browser:
   ```
   https://kealee-frontend-production.up.railway.app
   ```

2. Check browser console for errors

3. Test login flow:
   - Register a new user
   - Login with credentials
   - Verify redirected to dashboard

4. Test API connectivity:
   - Open browser DevTools → Network tab
   - Verify API calls go to backend URL
   - Check for CORS errors (should be none)

### End-to-End Testing

```bash
# Test user registration
curl -X POST https://kealee-backend-production.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "name": "Test User",
    "role": "HOMEOWNER"
  }'

# Test login
curl -X POST https://kealee-backend-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

---

## TASK 7: Configure Custom Domain (Optional)

### Backend Custom Domain

1. In Railway dashboard, go to backend service
2. Click "Settings" → "Networking"
3. Click "Custom Domain"
4. Enter your domain (e.g., `api.yourdomain.com`)
5. Copy the CNAME record value
6. Add CNAME record in your DNS provider:
   - Type: CNAME
   - Name: api (or @ for root domain)
   - Value: [CNAME from Railway]
7. Wait for DNS propagation (5-30 minutes)
8. Railway will auto-provision SSL certificate

### Frontend Custom Domain

1. In Railway dashboard, go to frontend service
2. Click "Settings" → "Networking"
3. Click "Custom Domain"
4. Enter your domain (e.g., `app.yourdomain.com` or `yourdomain.com`)
5. Copy the CNAME record value
6. Add CNAME record in your DNS provider
7. Wait for DNS propagation
8. Railway will auto-provision SSL certificate

### Update Environment Variables

After setting up custom domains:

```bash
# Update backend CORS_ORIGIN
cd backend
railway variables set CORS_ORIGIN=https://app.yourdomain.com

# Update frontend API URL
cd frontend
railway variables set VITE_API_BASE_URL=https://api.yourdomain.com

# Rebuild frontend (env vars are build-time for Vite)
railway up
```

---

## TASK 8: Set Up Environment-Specific Variables

### Production Variables Checklist

**Backend:**
- [ ] DATABASE_URL (auto-set by Railway PostgreSQL addon)
- [ ] JWT_SECRET (generate: `openssl rand -base64 32`)
- [ ] NODE_ENV=production
- [ ] PORT=5001 (or use Railway's $PORT)
- [ ] CORS_ORIGIN (your frontend URL)
- [ ] STRIPE_SECRET_KEY (live key)
- [ ] STRIPE_PUBLISHABLE_KEY (live key)
- [ ] STRIPE_WEBHOOK_SECRET (live webhook secret)
- [ ] ANTHROPIC_API_KEY
- [ ] AWS_ACCESS_KEY_ID
- [ ] AWS_SECRET_ACCESS_KEY
- [ ] AWS_REGION
- [ ] AWS_S3_BUCKET

**Frontend:**
- [ ] VITE_API_BASE_URL (backend URL)
- [ ] VITE_STRIPE_PUBLISHABLE_KEY (live key)

---

## TASK 9: Monitoring & Logs

### View Logs

```bash
# View backend logs
cd backend
railway logs --follow

# View frontend logs
cd frontend
railway logs --follow

# View all service logs in project
railway logs --service backend --follow
railway logs --service frontend --follow
```

### Railway Dashboard Monitoring

1. Go to Railway dashboard
2. Click on any service
3. View real-time logs in "Deployments" tab
4. Monitor resource usage (CPU, Memory, Network)
5. View deployment history

### Set Up Alerts

1. In Railway dashboard, go to project settings
2. Click "Notifications"
3. Configure email/Slack notifications for:
   - Deployment failures
   - Service crashes
   - Resource limits

---

## TASK 10: Database Management

### Access Database

```bash
# Connect to Railway PostgreSQL
railway connect postgres

# Or get connection string
railway variables
# Copy DATABASE_URL and use with any PostgreSQL client
```

### Run Prisma Studio

```bash
cd backend
railway run npx prisma studio
# Opens Prisma Studio in your browser
```

### Backup Database

Railway PostgreSQL includes automatic backups, but you can also:

```bash
# Export database
railway run pg_dump $DATABASE_URL > backup.sql

# Import database
railway run psql $DATABASE_URL < backup.sql
```

---

## Troubleshooting

### Backend Won't Start

**Check logs:**
```bash
railway logs --service backend
```

**Common issues:**
- Missing environment variables → Check Railway dashboard Variables tab
- Database connection failed → Verify DATABASE_URL is set correctly
- Port binding error → Use `$PORT` environment variable or set PORT=5001
- Build failed → Check build logs for TypeScript errors

### Frontend Build Fails

**Check logs:**
```bash
railway logs --service frontend
```

**Common issues:**
- Environment variables not set → Vite requires `VITE_` prefix
- Build command fails → Verify `npm run build` works locally
- Missing dependencies → Check `package.json` dependencies

### CORS Errors

**Symptoms:** Browser console shows CORS errors

**Fix:**
1. Verify `CORS_ORIGIN` matches frontend URL exactly
2. Check protocol (http vs https)
3. Check for trailing slashes
4. Restart backend service after updating CORS_ORIGIN

```bash
railway variables set CORS_ORIGIN=https://your-frontend.railway.app
railway restart
```

### Database Migration Issues

**Reset migrations (⚠️ DESTRUCTIVE):**
```bash
railway run npx prisma migrate reset
```

**Check migration status:**
```bash
railway run npx prisma migrate status
```

### Service Crashes

**Check restart logs:**
```bash
railway logs --service backend --tail 100
```

**Common causes:**
- Unhandled promise rejection
- Out of memory (upgrade Railway plan)
- Database connection timeout
- Missing required environment variables

---

## Railway-Specific Best Practices

1. **Use Railway's $PORT variable:**
   ```typescript
   const PORT = process.env.PORT || 5001;
   ```

2. **Environment variables:**
   - Set in Railway dashboard for security
   - Use Railway CLI for bulk updates
   - Never commit secrets to Git

3. **Monorepo deployment:**
   - Set root directory in Railway settings
   - Or use separate repositories for each service

4. **Build optimization:**
   - Use `.railwayignore` to exclude unnecessary files
   - Cache `node_modules` when possible
   - Use multi-stage builds for smaller images

5. **Database:**
   - Railway PostgreSQL includes automatic backups
   - Use connection pooling (Prisma handles this)
   - Monitor connection limits

---

## Cost Estimation

Railway pricing (as of 2024):
- **Hobby Plan:** $5/month + usage-based
- **Pro Plan:** $20/month + usage-based
- **PostgreSQL:** Included or $5/month for larger instances
- **Custom domains:** Free SSL certificates
- **Bandwidth:** Included up to limits

**Estimated monthly cost for Kealee Platform:**
- Backend service: ~$10-20/month
- Frontend service: ~$5-10/month
- PostgreSQL database: $5-10/month
- **Total: ~$20-40/month** (varies with usage)

---

## Quick Reference Commands

```bash
# Login
railway login

# List projects
railway list

# Link to project
railway link

# Set environment variable
railway variables set KEY=value

# View all variables
railway variables

# Run command in Railway environment
railway run <command>

# Deploy service
railway up

# View logs
railway logs --follow

# Restart service
railway restart

# Generate domain
railway domain

# Connect to database
railway connect postgres

# Open Railway dashboard
railway open
```

---

## Support & Resources

- **Railway Documentation:** [docs.railway.app](https://docs.railway.app)
- **Railway Discord:** [discord.gg/railway](https://discord.gg/railway)
- **Railway Status:** [status.railway.app](https://status.railway.app)

---

**Deployment Status:** ✅ Ready  
**Last Updated:** $(Get-Date -Format "yyyy-MM-dd")  
**Version:** 2.0.0


