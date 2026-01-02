# Vercel Environment Variables Setup

## Issue Fixed
Removed the reference to non-existent secret `@api_base_url` from `vercel.json`.

## How to Set Environment Variables in Vercel

### Option 1: Set in Vercel Dashboard (Recommended)

1. Go to your Vercel project dashboard
2. Click on **Settings** → **Environment Variables**
3. Add the following variable:

   **Name:** `VITE_API_BASE_URL`
   
   **Value:** Your backend API URL (e.g., `https://your-backend.railway.app/api` or `https://your-backend.vercel.app/api`)
   
   **Environment:** Select all (Production, Preview, Development)

4. Click **Save**
5. Redeploy your application

### Option 2: Use Default Value (Current Behavior)

If you don't set `VITE_API_BASE_URL`, the app will default to `/api`, which works if:
- Your backend is on the same domain (using a proxy)
- You're using Vercel's API routes
- You have a reverse proxy setup

### Current Code Behavior

The code already has a fallback:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
```

So if `VITE_API_BASE_URL` is not set, it will use `/api` as the default.

## Quick Fix Steps

1. **Remove the broken secret reference** ✅ (Already done - removed from vercel.json)

2. **Set the environment variable in Vercel:**
   - Go to: https://vercel.com/your-project/settings/environment-variables
   - Add: `VITE_API_BASE_URL` = `https://your-backend-url.com/api`
   - Redeploy

3. **Or use the default:**
   - If your backend is accessible at `/api` on the same domain, no action needed
   - The app will work with the default `/api` path

## Verify Your Backend URL

Check where your backend is deployed:
- Railway: `https://your-app.railway.app`
- Render: `https://your-app.onrender.com`
- Vercel: `https://your-backend.vercel.app`
- Custom domain: `https://api.yourdomain.com`

Then set `VITE_API_BASE_URL` to that URL + `/api` (if your backend serves at `/api`)

Example:
- Backend at: `https://kealee-backend.railway.app`
- API endpoint: `https://kealee-backend.railway.app/api`
- Set `VITE_API_BASE_URL` = `https://kealee-backend.railway.app/api`

