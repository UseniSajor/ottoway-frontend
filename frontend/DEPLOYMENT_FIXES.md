# Authentication & UI Fixes - Deployment Guide

## Files Changed

1. **frontend/src/pages/auth/LoginPage.tsx**
   - Updated to use `AuthPages.css` for consistent styling with Register page
   - Changed Register link from `<button onClick>` to `<Link to="/register">` for proper routing
   - Improved error message display

2. **frontend/src/pages/auth/RegisterPage.tsx**
   - Changed Sign in link from `<a href>` to `<Link to="/login">` for proper routing
   - Improved error message handling to show actual server errors

3. **frontend/src/lib/api.ts**
   - Updated API base URL logic to use `VITE_API_URL` instead of `VITE_API_BASE_URL`
   - Added proper fallback:
     - Development: `http://localhost:5001/api` (default)
     - Production: Requires `VITE_API_URL` environment variable
   - Added error detection for localhost calls in production
   - Improved network error messages

4. **frontend/src/contexts/AuthContext.tsx**
   - Enhanced `register()` function with proper error handling
   - Shows actual server error messages (e.g., "User already exists", validation errors)
   - Detects API configuration errors and network issues

5. **frontend/src/vite-env.d.ts**
   - Added `VITE_API_URL` type definition
   - Added `DEV` type definition

## Vercel Environment Variable Configuration

### Required Environment Variable

**Name:** `VITE_API_URL`

**Value:** Your backend's public URL (without `/api` suffix)

**Example:**
```
VITE_API_URL=https://your-backend.railway.app
```

The API client will automatically append `/api` to this URL.

### How to Set in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Click **Add New**
4. Enter:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://your-backend.railway.app` (your actual backend URL)
   - **Environment:** Select all (Production, Preview, Development)
5. Click **Save**
6. **Redeploy** your application

### Important Notes

- **Do NOT include `/api` in the URL** - the code automatically appends it
- The URL should be your **public backend URL** (Railway, Render, etc.)
- **Never use `localhost`** in production - Vercel cannot reach localhost
- After setting the variable, you **must redeploy** for changes to take effect

## Testing Guide

### Local Development

1. **Start your backend:**
   ```bash
   cd backend
   npm run dev
   # Backend should run on http://localhost:5001
   ```

2. **Start your frontend:**
   ```bash
   cd frontend
   npm run dev
   # Frontend should run on http://localhost:5173
   ```

3. **Test Login:**
   - Navigate to `http://localhost:5173/login`
   - Enter credentials
   - Should successfully login and redirect to dashboard
   - API calls should go to `http://localhost:5001/api`

4. **Test Register:**
   - Navigate to `http://localhost:5173/register`
   - Fill out the form
   - Should successfully register and redirect to dashboard
   - API calls should go to `http://localhost:5001/api`

### Production (Vercel)

1. **Set Environment Variable:**
   - Set `VITE_API_URL` in Vercel dashboard (see above)

2. **Deploy:**
   - Push to GitHub (Vercel auto-deploys)
   - Or manually trigger deployment in Vercel dashboard

3. **Test Login:**
   - Navigate to `https://your-app.vercel.app/login`
   - Enter credentials
   - Should successfully login
   - API calls should go to `https://your-backend.railway.app/api`

4. **Test Register:**
   - Navigate to `https://your-app.vercel.app/register`
   - Fill out the form
   - Should successfully register
   - API calls should go to `https://your-backend.railway.app/api`

## Error Messages

### If VITE_API_URL is Missing in Production

**Console Error:**
```
❌ API Configuration Error: VITE_API_URL is not set in production. Please configure it in Vercel environment variables.
```

**User-Facing Error:**
- Login/Register will show: "API not reachable—check VITE_API_URL"

### If Backend is Unreachable

**User-Facing Error:**
- "API not reachable—check VITE_API_URL. Cannot connect to server."

### If User Already Exists (Register)

**User-Facing Error:**
- "User already exists" (actual server message)

### If Validation Fails (Register)

**User-Facing Error:**
- Shows actual validation error from server (e.g., "All fields are required")

## Troubleshooting

### Issue: Registration fails on Vercel

**Solution:**
1. Check that `VITE_API_URL` is set in Vercel environment variables
2. Verify the URL is correct (no `/api` suffix, no `localhost`)
3. Ensure backend is publicly accessible
4. Check browser console for specific error messages
5. Redeploy after setting environment variable

### Issue: Login page looks unstyled

**Solution:**
- Login page now uses `AuthPages.css` - ensure the CSS file exists and is imported
- Check that CSS variables are defined in `App.css`

### Issue: Register link doesn't navigate

**Solution:**
- Register link now uses `<Link to="/register">` - should work correctly
- Ensure React Router is properly configured in `App.tsx`

## Summary

✅ **UI Consistency:** Login page now matches Register page styling
✅ **Routing:** Both pages use React Router `<Link>` components
✅ **API Configuration:** Proper fallback for development, requires `VITE_API_URL` in production
✅ **Error Messages:** Clear, actionable error messages for users and developers

