# Deploy Now - Quick Summary 🚀

Get your platform live in 5 minutes using the existing backend.

═══════════════════════════════════════════════════════════════════════════════
STEP 1: ADD BACKEND URL TO VERCEL (2 MINUTES)
═══════════════════════════════════════════════════════════════════════════════

**Go to Vercel Dashboard:**
1. https://vercel.com/dashboard
2. Click your frontend project
3. **Settings** → **Environment Variables**
4. Click **"+ Add New"**
5. Add:
   - **Name:** `VITE_API_BASE_URL`
   - **Value:** `https://ottoway-backend-production.up.railway.app`
   - **Environment:** Production ✅
   - Click **"Save"**

6. **Deployments** tab → Click **"..."** → **"Redeploy"**

**OR use CLI:**
```bash
cd frontend
vercel env add VITE_API_BASE_URL production
# Enter: https://ottoway-backend-production.up.railway.app
vercel --prod
```

═══════════════════════════════════════════════════════════════════════════════
STEP 2: TEST YOUR PLATFORM (1 MINUTE)
═══════════════════════════════════════════════════════════════════════════════

**Test backend:**
```bash
# PowerShell
Invoke-WebRequest -Uri "https://ottoway-backend-production.up.railway.app/api/health" -UseBasicParsing

# If you get 502 error, the backend needs to be fixed (see below)
```

**Test frontend:**
- Open: https://ottoway-frontend-o3yr.vercel.app
- Open DevTools (F12)
- Try to login/register
- Check for errors

═══════════════════════════════════════════════════════════════════════════════
YOUR LIVE URLs
═══════════════════════════════════════════════════════════════════════════════

**Frontend:** https://ottoway-frontend-o3yr.vercel.app  
**Backend:** https://ottoway-backend-production.up.railway.app

═══════════════════════════════════════════════════════════════════════════════
STEP 3: FIX BUILD FOR FUTURE DEPLOYMENTS (OPTIONAL, DO LATER)
═══════════════════════════════════════════════════════════════════════════════

Once you're live, fix the build so you can deploy new versions:

**Quick fix (recommended):**
```bash
cd backend
.\fix-build-quick.ps1
git add tsconfig.json
git commit -m "Fix TypeScript build for Railway"
git push
```

**Or see:** `FIX_BUILD_ERRORS.md` for detailed options.

═══════════════════════════════════════════════════════════════════════════════
TROUBLESHOOTING
═══════════════════════════════════════════════════════════════════════════════

**Frontend shows CORS errors:**
- Verify `VITE_API_BASE_URL` is set correctly in Vercel
- Check it matches the backend URL exactly
- Redeploy frontend after setting variable

**Backend not responding (502 error):**
- The old backend deployment may have stopped
- **Option 1:** Fix the build and deploy new backend (see Step 3)
- **Option 2:** Check Railway dashboard → Restart the service
- **Option 3:** Check logs: `railway logs` to see what's wrong

**Build fails:**
- See `FIX_BUILD_ERRORS.md` for solutions
- Use the quick fix script: `.\fix-build-quick.ps1`

═══════════════════════════════════════════════════════════════════════════════

**You're now live!** 🎉

