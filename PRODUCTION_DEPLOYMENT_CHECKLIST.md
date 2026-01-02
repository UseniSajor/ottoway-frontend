# Production Deployment Checklist

Use this checklist to ensure a smooth deployment to production.

## Pre-Deployment

### Backend
- [ ] All TypeScript errors resolved (or non-blocking)
- [ ] Database migrations are up to date
- [ ] Environment variables documented in `.env.production.example`
- [ ] Prisma client generated (`npx prisma generate`)
- [ ] Build succeeds (`npm run build`)
- [ ] Tests pass (if applicable)

### Frontend
- [ ] All TypeScript errors resolved (or non-blocking)
- [ ] Environment variables documented in `.env.production.example`
- [ ] Build succeeds (`npm run build`)
- [ ] Preview works locally (`npm run preview`)
- [ ] Tests pass (if applicable)

## Environment Setup

### Backend Environment Variables (Railway)
- [ ] `NODE_ENV=production`
- [ ] `DATABASE_URL` (auto-set by Railway PostgreSQL)
- [ ] `JWT_SECRET` (min 32 characters, strong random string)
- [ ] `PORT=5001` (or Railway default)
- [ ] `CORS_ORIGIN` (your Vercel frontend URL)
- [ ] `STRIPE_SECRET_KEY` (live key)
- [ ] `STRIPE_WEBHOOK_SECRET` (if using webhooks)
- [ ] `ANTHROPIC_API_KEY` (if using AI features)
- [ ] `AWS_ACCESS_KEY_ID`
- [ ] `AWS_SECRET_ACCESS_KEY`
- [ ] `AWS_REGION` (default: us-east-1)
- [ ] `AWS_S3_BUCKET`

### Frontend Environment Variables (Vercel)
- [ ] `VITE_API_BASE_URL` (your Railway backend URL)
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY` (live key)

## Deployment Steps

### Railway (Backend)
- [ ] Railway CLI installed (`npm install -g @railway/cli`)
- [ ] Logged in (`railway login`)
- [ ] Project initialized (`railway init`)
- [ ] PostgreSQL database added (`railway add postgresql`)
- [ ] All environment variables set
- [ ] Deployed (`railway up`)
- [ ] Backend URL obtained (`railway domain`)
- [ ] Health check passes (`curl https://your-backend.railway.app/api/health`)

### Vercel (Frontend)
- [ ] Vercel CLI installed (`npm install -g vercel`)
- [ ] Logged in (`vercel login`)
- [ ] Project initialized (`vercel`)
- [ ] Environment variables set (`vercel env add`)
- [ ] Deployed to production (`vercel --prod`)
- [ ] Frontend URL obtained
- [ ] Frontend loads successfully

### Post-Deployment
- [ ] Backend CORS updated with frontend URL
- [ ] Backend redeployed after CORS update
- [ ] Database migrations run (`railway run npx prisma migrate deploy`)
- [ ] Can access frontend at production URL
- [ ] Can access backend at production URL
- [ ] Login/register works
- [ ] No CORS errors in browser console
- [ ] API calls work correctly
- [ ] File uploads work (if applicable)
- [ ] Payments work (if applicable)

## Testing Checklist

### Functional Tests
- [ ] User registration
- [ ] User login
- [ ] Password reset (if implemented)
- [ ] Create project
- [ ] View project details
- [ ] Update project
- [ ] File uploads
- [ ] Payments (if applicable)
- [ ] Notifications
- [ ] Search functionality

### Performance Tests
- [ ] Page load times acceptable
- [ ] API response times acceptable
- [ ] No memory leaks
- [ ] Database queries optimized

### Security Tests
- [ ] HTTPS enforced
- [ ] CORS properly configured
- [ ] Authentication required for protected routes
- [ ] Authorization checks in place
- [ ] No sensitive data in client-side code
- [ ] Environment variables not exposed

## Monitoring Setup

- [ ] Error logging configured (Railway logs)
- [ ] Application monitoring (if applicable)
- [ ] Database monitoring (Railway dashboard)
- [ ] Uptime monitoring (external service)
- [ ] Alert notifications configured

## Rollback Plan

- [ ] Know how to rollback Railway deployment
- [ ] Know how to rollback Vercel deployment
- [ ] Database backup strategy in place
- [ ] Previous version artifacts saved

## Documentation

- [ ] Deployment process documented
- [ ] Environment variables documented
- [ ] API endpoints documented
- [ ] Troubleshooting guide created
- [ ] Team notified of deployment

---

## Quick Commands Reference

### Build Production
```bash
# Windows
.\build-production.ps1

# Unix/Linux/Mac
./build-production.sh
```

### Deploy Backend
```bash
cd backend
railway up
railway logs  # View logs
railway domain  # Get URL
```

### Deploy Frontend
```bash
cd frontend
vercel --prod
vercel logs  # View logs
```

### Check Status
```bash
# Backend health
curl https://your-backend.railway.app/api/health

# Frontend
curl https://your-frontend.vercel.app
```

---

**Last Updated:** $(Get-Date -Format "yyyy-MM-dd")


