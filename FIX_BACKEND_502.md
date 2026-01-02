# Fix Backend 502 Error

The backend is returning 502 "Application failed to respond". Here's how to fix it.

═══════════════════════════════════════════════════════════════════════════════
QUICK DIAGNOSIS
═══════════════════════════════════════════════════════════════════════════════

The 502 error means Railway can't reach your application. Common causes:

1. **Build failed** - TypeScript errors preventing deployment
2. **App crashed** - Runtime errors after deployment
3. **Missing environment variables** - App fails to start
4. **Database connection failed** - Can't connect to PostgreSQL

═══════════════════════════════════════════════════════════════════════════════
STEP 1: CHECK RAILWAY LOGS
═══════════════════════════════════════════════════════════════════════════════

```bash
cd backend
railway logs --tail 100
```

Look for:
- ❌ Build errors
- ❌ "Environment validation failed"
- ❌ Database connection errors
- ❌ Missing environment variables

═══════════════════════════════════════════════════════════════════════════════
STEP 2: FIX THE BUILD (Most Likely Issue)
═══════════════════════════════════════════════════════════════════════════════

The build is probably failing due to TypeScript errors.

**Quick fix:**
```bash
cd backend
.\fix-build-quick.ps1
git add tsconfig.json
git commit -m "Fix TypeScript build for Railway"
git push
```

This will:
1. Relax TypeScript strictness
2. Test the build locally
3. Commit and push
4. Railway will automatically rebuild

**Wait 2-3 minutes, then check:**
```bash
railway logs --tail 50
```

═══════════════════════════════════════════════════════════════════════════════
STEP 3: CHECK ENVIRONMENT VARIABLES
═══════════════════════════════════════════════════════════════════════════════

The app might be failing because required variables are missing.

```bash
cd backend
railway variables
```

**Required variables:**
- ✅ `DATABASE_URL` (auto-set by Railway)
- ✅ `NODE_ENV=production`
- ✅ `PORT=5001`
- ✅ `JWT_SECRET` (min 32 chars)
- ✅ `CORS_ORIGIN` (your Vercel URL)

**If missing, add them:**
```bash
railway variables set NODE_ENV=production
railway variables set PORT=5001
# Generate JWT_SECRET
$jwt = node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
railway variables set "JWT_SECRET=$jwt"
railway variables set CORS_ORIGIN=https://your-vercel-url.vercel.app
```

See `RAILWAY_ENV_VALUES.md` for complete list.

═══════════════════════════════════════════════════════════════════════════════
STEP 4: RESTART THE SERVICE
═══════════════════════════════════════════════════════════════════════════════

Sometimes a simple restart fixes it:

**Via Railway Dashboard:**
1. Go to https://railway.app
2. Open your backend project
3. Click "..." menu → "Restart"

**Via CLI:**
```bash
cd backend
railway restart
```

═══════════════════════════════════════════════════════════════════════════════
STEP 5: VERIFY IT WORKS
═══════════════════════════════════════════════════════════════════════════════

After fixing, test:

```bash
# PowerShell
Invoke-WebRequest -Uri "https://ottoway-backend-production.up.railway.app/api/health" -UseBasicParsing

# Should return: {"status":"ok","timestamp":"..."}
```

If still 502, check logs again:
```bash
railway logs --tail 50
```

═══════════════════════════════════════════════════════════════════════════════
ALTERNATIVE: DEPLOY NEW BACKEND
═══════════════════════════════════════════════════════════════════════════════

If the old deployment is too broken, deploy fresh:

1. **Fix build first:**
   ```bash
   cd backend
   .\fix-build-quick.ps1
   ```

2. **Set all environment variables** (see `RAILWAY_ENV_VALUES.md`)

3. **Deploy:**
   ```bash
   railway up
   ```

4. **Get new URL:**
   ```bash
   railway domain
   ```

5. **Update Vercel frontend** with new backend URL

═══════════════════════════════════════════════════════════════════════════════
COMMON ERRORS & FIXES
═══════════════════════════════════════════════════════════════════════════════

**"Environment validation failed"**
- Missing required environment variables
- Fix: Add all required variables (see Step 3)

**"Cannot find module"**
- Missing dependencies
- Fix: Railway should install automatically, but check `package.json`

**"Database connection failed"**
- DATABASE_URL not set or incorrect
- Fix: Railway should set this automatically when you add PostgreSQL

**"Port already in use"**
- Port conflict
- Fix: Set `PORT=5001` explicitly

**"Prisma client not generated"**
- Prisma client missing
- Fix: Railway should run `npx prisma generate` automatically

═══════════════════════════════════════════════════════════════════════════════
RECOMMENDED FIX ORDER
═══════════════════════════════════════════════════════════════════════════════

1. ✅ Check logs: `railway logs`
2. ✅ Fix build: `.\fix-build-quick.ps1`
3. ✅ Verify env vars: `railway variables`
4. ✅ Restart: `railway restart` or via dashboard
5. ✅ Test: Check health endpoint
6. ✅ If still fails, check logs again

═══════════════════════════════════════════════════════════════════════════════


