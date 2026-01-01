# Vercel Deployment Checklist

Use this checklist when deploying the frontend to Vercel.

## Pre-Deployment

- [ ] Code is pushed to GitHub repository
- [ ] Backend is deployed to Railway and accessible
- [ ] Backend health endpoint works: `curl https://your-railway-url.up.railway.app/health`
- [ ] Frontend builds successfully locally: `npm run build`

## Vercel Project Setup

- [ ] Created new Vercel project
- [ ] Connected GitHub repository
- [ ] **Set Root Directory to `frontend`** (Critical!)
- [ ] Framework preset: Vite (auto-detected)
- [ ] Build command: `npm run build` (auto-detected)
- [ ] Output directory: `dist` (auto-detected)

## Environment Variables

### Required Variables

- [ ] `VITE_API_BASE_URL` - Your Railway backend URL + `/api`
  - Example: `https://your-app.up.railway.app/api`
  - **Important**: Must start with `VITE_` for Vite to expose it

### Variable Configuration

- [ ] Added to **Production** environment
- [ ] Added to **Preview** environment (optional)
- [ ] Added to **Development** environment (optional)

## Build Settings

- [ ] Node.js version: 18+ (check in Settings → General)
- [ ] Install command: `npm install` (default)
- [ ] Build command: `npm run build` (default)
- [ ] Output directory: `dist` (default)

## Deployment

- [ ] Initial deployment triggered
- [ ] Build logs show successful build
- [ ] No build errors or warnings
- [ ] Deployment completed successfully
- [ ] Vercel URL is accessible (e.g., `https://your-app.vercel.app`)

## Post-Deployment Verification

- [ ] Frontend loads at Vercel URL
- [ ] Login page displays correctly
- [ ] API calls work (check browser console for errors)
- [ ] No CORS errors in browser console
- [ ] Authentication flow works
- [ ] Protected routes redirect correctly

## Update Backend CORS

- [ ] Go to Railway dashboard
- [ ] Update `CORS_ORIGIN` environment variable to your Vercel URL
  - Example: `https://your-app.vercel.app`
- [ ] Redeploy backend (or wait for auto-redeploy)
- [ ] Verify CORS works (no CORS errors in browser)

## Custom Domain (Optional)

- [ ] Added custom domain in Vercel project settings
- [ ] Updated DNS records as instructed by Vercel
- [ ] SSL certificate issued (automatic)
- [ ] Custom domain is accessible
- [ ] Updated `CORS_ORIGIN` in Railway to custom domain

## Performance

- [ ] Page load time is acceptable
- [ ] Images and assets load correctly
- [ ] No console errors
- [ ] Vercel Analytics enabled (optional)

## Security

- [ ] Environment variables are not exposed in client bundle
- [ ] API keys are not hardcoded
- [ ] HTTPS is enabled (automatic on Vercel)
- [ ] Security headers configured (optional)

## Final Checks

- [ ] Frontend URL is accessible
- [ ] Login works with seeded users
- [ ] All portals are accessible (based on user role)
- [ ] API integration works correctly
- [ ] No console errors
- [ ] Mobile responsiveness works (if applicable)

---

**Deployment URL**: `https://your-app.vercel.app`

**Backend API URL**: `https://your-railway-url.up.railway.app/api`

**Next Step**: Update Railway `CORS_ORIGIN` with your Vercel URL.



