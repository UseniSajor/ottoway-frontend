# Quick Deployment Guide

## ⚠️ Before You Start

**IMPORTANT:** The backend currently has TypeScript compilation errors. You must fix these before deploying to production. See `BUILD_ISSUES.md` for details.

## Quick Start

### 1. Fix Build Errors
```bash
# Check backend build
cd backend
npm run build

# Check frontend build  
cd ../frontend
npm run build
```

### 2. Create Production Environment Files

**Backend:**
```bash
cd backend
# Copy example and edit with your values
copy .env.production.example .env.production
# Edit .env.production with real values
```

**Frontend:**
```bash
cd frontend
# Copy example and edit with your values
copy .env.production.example .env.production
# Edit .env.production with real values
```

### 3. Build Production Packages

**Windows:**
```powershell
.\build-production.ps1
```

**Unix/Linux/Mac:**
```bash
chmod +x build-production.sh
./build-production.sh
```

### 4. Deploy Backend to Railway

```bash
cd backend

# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize (first time only)
railway init
# Select: Create new project
# Name: kealee-backend

# Add PostgreSQL
railway add postgresql

# Set environment variables (see DEPLOYMENT_STEPS.md for full list)
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=your-secret-here-min-32-chars
railway variables set CORS_ORIGIN=https://your-frontend.vercel.app
# ... set all other required variables

# Deploy
railway up

# Get URL
railway domain
```

### 5. Deploy Frontend to Vercel

```bash
cd frontend

# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy (first time)
vercel
# Follow prompts

# Set environment variables
vercel env add VITE_API_BASE_URL production
# Enter: https://your-backend.railway.app

vercel env add VITE_STRIPE_PUBLISHABLE_KEY production
# Enter: pk_live_...

# Deploy to production
vercel --prod
```

### 6. Update CORS

```bash
cd backend
railway variables set CORS_ORIGIN=https://your-frontend.vercel.app
railway up
```

### 7. Test

```bash
# Test backend
curl https://your-backend.railway.app/api/health

# Test frontend
curl https://your-frontend.vercel.app
```

## Full Documentation

- **Detailed Steps:** See `DEPLOYMENT_STEPS.md`
- **Build Issues:** See `BUILD_ISSUES.md`
- **Checklist:** See `PRODUCTION_DEPLOYMENT_CHECKLIST.md`

## Troubleshooting

### Build Fails
- Check `BUILD_ISSUES.md` for common errors
- Ensure Prisma client is generated: `npx prisma generate`
- Check TypeScript errors: `npm run build`

### Deployment Fails
- Check Railway/Vercel logs
- Verify environment variables are set
- Ensure database is connected (Railway)
- Check CORS configuration

## Support

For detailed troubleshooting, see:
- `DEPLOYMENT_STEPS.md` - Full deployment guide
- `BUILD_ISSUES.md` - Build error resolution
- `PRODUCTION_DEPLOYMENT_CHECKLIST.md` - Complete checklist


