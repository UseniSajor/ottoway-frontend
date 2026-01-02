# Quick Deploy - Get Live NOW! 🚀

Use your existing backend from 3 days ago to get the platform live immediately.

═══════════════════════════════════════════════════════════════════════════════
STEP 1: ADD BACKEND URL TO VERCEL (DO THIS NOW!)
═══════════════════════════════════════════════════════════════════════════════

## Option A: Using Vercel Dashboard (Easiest)

1. Go to: https://vercel.com/dashboard
2. Click your frontend project (`ottoway-frontend` or similar)
3. Click **Settings** → **Environment Variables**
4. Click **"+ Add New"**
5. Add this variable:

   **Variable Name:** `VITE_API_BASE_URL`
   **Value:** `https://ottoway-backend-production.up.railway.app`
   **Environment:** Select **Production** (and Preview if you want)
   **Click "Save"**

6. Go to **Deployments** tab
7. Click **"..."** on the latest deployment
8. Click **"Redeploy"**
9. Wait 1-2 minutes for deployment

## Option B: Using Vercel CLI

```bash
cd frontend

# Add backend URL
vercel env add VITE_API_BASE_URL production
# When prompted, enter: https://ottoway-backend-production.up.railway.app

# Add Stripe key (optional, for testing)
vercel env add VITE_STRIPE_PUBLISHABLE_KEY production
# Enter: pk_test_dummy_key_for_testing (or your real key)

# Redeploy
vercel --prod
```

**Important:** The frontend uses `VITE_API_BASE_URL` (not `VITE_API_URL`)

═══════════════════════════════════════════════════════════════════════════════
STEP 2: TEST THE BACKEND
═══════════════════════════════════════════════════════════════════════════════

Test if your existing backend is working:

```bash
# Test health endpoint
curl https://ottoway-backend-production.up.railway.app/api/health
```

Should return:
```json
{"status":"ok","timestamp":"2026-01-01T12:00:00.000Z"}
```

If this works, your backend is live and ready!

═══════════════════════════════════════════════════════════════════════════════
STEP 3: TEST YOUR FRONTEND
═══════════════════════════════════════════════════════════════════════════════

After Vercel redeploys (1-2 minutes):

1. Open your frontend URL: `https://ottoway-frontend-o3yr.vercel.app`
2. Open browser DevTools (F12)
3. Go to Console tab
4. Try to login or register
5. Check for errors

**Expected:**
- ✅ No CORS errors
- ✅ API calls succeed
- ✅ Pages load

═══════════════════════════════════════════════════════════════════════════════
YOUR LIVE PLATFORM URLs
═══════════════════════════════════════════════════════════════════════════════

**Frontend:** https://ottoway-frontend-o3yr.vercel.app  
**Backend:** https://ottoway-backend-production.up.railway.app

These should work together now!

═══════════════════════════════════════════════════════════════════════════════
NEXT: FIX THE BUILD FOR FUTURE DEPLOYMENTS
═══════════════════════════════════════════════════════════════════════════════

Once you're live, fix the TypeScript build errors so you can deploy new versions.

See: `FIX_BUILD_ERRORS.md` for detailed instructions.

═══════════════════════════════════════════════════════════════════════════════


