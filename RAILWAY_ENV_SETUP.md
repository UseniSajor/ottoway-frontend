# Railway Environment Variables Setup Guide

This guide helps you set all required and optional environment variables for your Railway backend deployment.

═══════════════════════════════════════════════════════════════════════════════
QUICK START: USE THE AUTOMATED SCRIPT
═══════════════════════════════════════════════════════════════════════════════

**Windows (PowerShell):**
```powershell
cd backend
.\set-railway-vars.ps1
```

**Unix/Linux/Mac:**
```bash
cd backend
chmod +x set-railway-vars.sh
./set-railway-vars.sh
```

The script will:
- ✅ Set all required variables
- ✅ Generate a secure JWT_SECRET
- ✅ Prompt for optional variables
- ✅ Verify all variables are set
- ✅ Optionally redeploy

═══════════════════════════════════════════════════════════════════════════════
MANUAL SETUP: STEP-BY-STEP
═══════════════════════════════════════════════════════════════════════════════

## Step 1: Install Railway CLI (if not installed)

```bash
npm install -g @railway/cli
```

## Step 2: Login to Railway

```bash
railway login
```

## Step 3: Link to Your Project

```bash
cd backend
railway link
# Select your backend project from the list
```

## Step 4: Set Required Environment Variables

### 4.1: NODE_ENV
```bash
railway variables set NODE_ENV=production
```

### 4.2: PORT
```bash
railway variables set PORT=5001
```

### 4.3: JWT_SECRET

**Windows (PowerShell):**
```powershell
$jwtSecret = node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
railway variables set "JWT_SECRET=$jwtSecret"
```

**Unix/Linux/Mac:**
```bash
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
railway variables set "JWT_SECRET=$JWT_SECRET"
```

**Or manually:**
```bash
railway variables set JWT_SECRET=your-very-long-random-string-minimum-32-characters
```

### 4.4: CORS_ORIGIN

**First, get your Vercel frontend URL:**
```bash
cd ../frontend
vercel ls
# Copy the production URL
```

**Then set it:**
```bash
cd ../backend
railway variables set CORS_ORIGIN=https://your-vercel-url.vercel.app
```

**Important:** CORS_ORIGIN must match your Vercel URL exactly (including `https://` and no trailing slash).

### 4.5: DATABASE_URL

**✅ Automatically set by Railway** when you add PostgreSQL. You don't need to set this manually.

## Step 5: Set Optional Environment Variables

### 5.1: Stripe (REQUIRED in production)

```bash
railway variables set STRIPE_SECRET_KEY=sk_live_...
railway variables set STRIPE_WEBHOOK_SECRET=whsec_...  # Optional, only if using webhooks
```

**⚠️ Note:** `STRIPE_SECRET_KEY` is required in production mode. The backend will fail to start without it.

### 5.2: Anthropic (for AI/ML features)

```bash
railway variables set ANTHROPIC_API_KEY=sk-ant-...
```

### 5.3: AWS S3 (REQUIRED in production)

```bash
railway variables set AWS_ACCESS_KEY_ID=your-aws-key
railway variables set AWS_SECRET_ACCESS_KEY=your-aws-secret
railway variables set AWS_REGION=us-east-1  # Optional, defaults to us-east-1
railway variables set AWS_S3_BUCKET=your-bucket-name
```

**⚠️ Note:** AWS credentials and S3 bucket are required in production mode. The backend will fail to start without them.

## Step 6: Verify All Variables

```bash
railway variables
```

You should see:
```
┌────────────────────┬──────────────────────────────────────────┐
│ Name               │ Value                                     │
├────────────────────┼──────────────────────────────────────────┤
│ DATABASE_URL       │ postgresql://postgres:***@***            │
│ NODE_ENV           │ production                               │
│ PORT               │ 5001                                     │
│ JWT_SECRET         │ *** (hidden)                            │
│ CORS_ORIGIN        │ https://your-vercel-url.vercel.app       │
└────────────────────┴──────────────────────────────────────────┘
```

## Step 7: Redeploy

```bash
railway up
```

This redeploys your backend with the new environment variables.

═══════════════════════════════════════════════════════════════════════════════
USING RAILWAY DASHBOARD (Alternative Method)
═══════════════════════════════════════════════════════════════════════════════

If you prefer using the web interface:

1. Go to https://railway.app
2. Log in to your account
3. Click on your backend project
4. Click **"Variables"** tab (left sidebar)
5. Click **"+ New Variable"** button
6. Add each variable:

   **NODE_ENV**
   - Name: `NODE_ENV`
   - Value: `production`
   - Click "Add Variable"

   **PORT**
   - Name: `PORT`
   - Value: `5001`
   - Click "Add Variable"

   **JWT_SECRET**
   - Name: `JWT_SECRET`
   - Value: Generate using:
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
     ```
   - Click "Add Variable"

   **CORS_ORIGIN**
   - Name: `CORS_ORIGIN`
   - Value: `https://your-vercel-url.vercel.app`
   - Click "Add Variable"

7. Railway will automatically redeploy with new variables

═══════════════════════════════════════════════════════════════════════════════
REQUIRED VARIABLES CHECKLIST
═══════════════════════════════════════════════════════════════════════════════

**Backend (Railway) - Required:**
- [ ] `DATABASE_URL` (auto-set by Railway)
- [ ] `NODE_ENV=production`
- [ ] `PORT=5001`
- [ ] `JWT_SECRET` (min 32 characters)
- [ ] `CORS_ORIGIN` (your Vercel frontend URL)

**Backend (Railway) - Required in Production:**
- [ ] `STRIPE_SECRET_KEY` (required in production)
- [ ] `AWS_ACCESS_KEY_ID` (required in production for file storage)
- [ ] `AWS_SECRET_ACCESS_KEY` (required in production for file storage)
- [ ] `AWS_S3_BUCKET` (required in production for file storage)

**Backend (Railway) - Optional:**
- [ ] `STRIPE_WEBHOOK_SECRET` (if using webhooks)
- [ ] `ANTHROPIC_API_KEY` (if using AI features)
- [ ] `AWS_REGION` (defaults to us-east-1 if not set)

═══════════════════════════════════════════════════════════════════════════════
VERIFICATION & TESTING
═══════════════════════════════════════════════════════════════════════════════

## Verify Variables Are Set

```bash
railway variables
```

## Check Logs for Successful Startup

```bash
railway logs --tail 50
```

Look for:
- ✅ "Server running in production mode"
- ✅ "Database connected"
- ✅ "Server started on port 5001"

## Test Backend Health Endpoint

```bash
# Get your backend URL
railway domain

# Test health endpoint
curl https://your-backend.up.railway.app/api/health
```

Should return:
```json
{"status":"ok","timestamp":"2026-01-01T12:00:00.000Z"}
```

## Test CORS from Frontend

1. Open your Vercel frontend in browser
2. Open DevTools (F12)
3. Go to Console tab
4. Try to login/register
5. Check for CORS errors (should be none)

═══════════════════════════════════════════════════════════════════════════════
TROUBLESHOOTING
═══════════════════════════════════════════════════════════════════════════════

### Issue: "railway: command not found"

```bash
npm install -g @railway/cli
```

### Issue: "Not linked to a project"

```bash
cd backend
railway link
# Select your backend project
```

### Issue: Cannot generate JWT_SECRET (Windows)

**Option 1: Use Node.js**
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Option 2: Use online generator**
- Go to https://passwordsgenerator.net/
- Generate a 32+ character password
- Use that as JWT_SECRET

**Option 3: Manual string**
```bash
railway variables set JWT_SECRET=your-very-long-random-string-minimum-32-characters-abc123xyz789
```

### Issue: CORS errors after deployment

1. Verify CORS_ORIGIN matches your Vercel URL exactly:
   ```bash
   railway variables | grep CORS_ORIGIN
   ```

2. Check your Vercel URL:
   ```bash
   cd frontend
   vercel ls
   ```

3. Update CORS_ORIGIN if needed:
   ```bash
   cd ../backend
   railway variables set CORS_ORIGIN=https://your-exact-vercel-url.vercel.app
   railway up
   ```

**Important:** CORS_ORIGIN must match exactly:
- ✅ `https://kealee-platform.vercel.app`
- ❌ `http://kealee-platform.vercel.app` (wrong protocol)
- ❌ `https://kealee-platform.vercel.app/` (trailing slash)
- ❌ `kealee-platform.vercel.app` (missing protocol)

### Issue: Backend won't start

1. Check logs:
   ```bash
   railway logs
   ```

2. Verify all required variables are set:
   ```bash
   railway variables
   ```

3. Check for missing variables:
   - NODE_ENV must be "production"
   - JWT_SECRET must be at least 32 characters
   - CORS_ORIGIN must be a valid URL

### Issue: Environment variables not taking effect

Railway automatically redeploys when you set variables via the dashboard, but if you use CLI, you may need to redeploy:

```bash
railway up
```

═══════════════════════════════════════════════════════════════════════════════
QUICK REFERENCE
═══════════════════════════════════════════════════════════════════════════════

## Set All Required Variables at Once

**Windows (Quick Script):**
```powershell
cd backend
.\quick-set-env.ps1
```

**Windows (Manual):**
```powershell
cd backend
railway variables set NODE_ENV=production
railway variables set PORT=5001
$jwt = node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
railway variables set "JWT_SECRET=$jwt"
railway variables set CORS_ORIGIN=https://your-vercel-url.vercel.app

# REQUIRED in production:
railway variables set STRIPE_SECRET_KEY=sk_live_...
railway variables set AWS_ACCESS_KEY_ID=your-aws-key
railway variables set AWS_SECRET_ACCESS_KEY=your-aws-secret
railway variables set AWS_S3_BUCKET=your-bucket-name

railway up
```

**Unix/Linux/Mac:**
```bash
cd backend
railway variables set NODE_ENV=production
railway variables set PORT=5001
JWT=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
railway variables set "JWT_SECRET=$JWT"
railway variables set CORS_ORIGIN=https://your-vercel-url.vercel.app

# REQUIRED in production:
railway variables set STRIPE_SECRET_KEY=sk_live_...
railway variables set AWS_ACCESS_KEY_ID=your-aws-key
railway variables set AWS_SECRET_ACCESS_KEY=your-aws-secret
railway variables set AWS_S3_BUCKET=your-bucket-name

railway up
```

## View All Variables

```bash
railway variables
```

## View Logs

```bash
railway logs
railway logs --tail 50  # Last 50 lines
```

## Get Backend URL

```bash
railway domain
```

## Redeploy

```bash
railway up
```

═══════════════════════════════════════════════════════════════════════════════

**Last Updated:** 2026-01-01

