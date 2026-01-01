# Production Deployment Guide

Complete step-by-step guide for deploying Kealee Platform v2 to Vercel (frontend) and Railway (backend).

## Prerequisites

- GitHub repository with code
- Vercel account
- Railway account
- Stripe account (for payments)
- AWS account (for S3 file storage in production)

---

## Part 1: Backend Deployment (Railway)

### Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway will detect the project structure

### Step 2: Configure Backend Service

1. In Railway dashboard, click "New" → "Service"
2. Select "GitHub Repo" and choose your repository
3. **Set Root Directory**: Click on the service → Settings → Root Directory → Set to `backend`
4. Railway will automatically detect Node.js

### Step 3: Add PostgreSQL Database

1. In Railway dashboard, click "New" → "Database" → "Add PostgreSQL"
2. Railway will create a PostgreSQL database
3. The `DATABASE_URL` environment variable will be automatically provided

### Step 4: Configure Environment Variables

Go to your backend service → Variables tab and add:

#### Required Variables:

```env
# Database (auto-provided by Railway Postgres)
DATABASE_URL=postgresql://...  # Auto-set by Railway

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your-strong-random-secret-key-minimum-32-characters

# CORS Origin (your Vercel frontend URL - set after frontend is deployed)
CORS_ORIGIN=https://your-app.vercel.app

# Node Environment
NODE_ENV=production

# Port (auto-provided by Railway)
PORT=5000  # Railway sets this automatically
```

#### Optional Variables (for production features):

```env
# Stripe (for payments)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...  # Get from Stripe Dashboard → Webhooks

# AWS S3 (for file storage)
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=kealee-uploads

# Anthropic API (for ML recommendations)
ANTHROPIC_API_KEY=sk-ant-...
```

### Step 5: Configure Build Settings

1. Go to service → Settings → Deploy
2. **Build Command**: `npm install && npm run build && npx prisma generate`
3. **Start Command**: `npm run prisma:deploy && npm start`

Or use `railway.json` (already configured):
- Railway will automatically use the build and deploy commands from `backend/railway.json`

### Step 6: Deploy

1. Railway will automatically deploy on push to main branch
2. Or click "Deploy" button to trigger manual deployment
3. Watch the deployment logs

### Step 7: Verify Deployment

1. Railway provides a public URL (e.g., `https://your-app.up.railway.app`)
2. Test health endpoint:
   ```bash
   curl https://your-app.up.railway.app/health
   ```
3. Should return: `{"status":"ok","timestamp":"..."}`

### Step 8: Run Database Migrations

Migrations run automatically via `prisma migrate deploy` in the start command.

To verify:
1. Go to service → Deployments
2. Check logs for "Prisma migrations applied successfully"

### Step 9: Configure Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. **Endpoint URL**: `https://your-railway-url.up.railway.app/api/stripe/webhook`
4. **Events to send**: Select:
   - `account.updated`
   - `payment_intent.succeeded`
   - `transfer.created`
   - `charge.dispute.created`
5. Copy the **Webhook signing secret** (starts with `whsec_`)
6. Add to Railway environment variables as `STRIPE_WEBHOOK_SECRET`

---

## Part 2: Frontend Deployment (Vercel)

### Step 1: Create Vercel Project

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Vercel will detect the project structure

### Step 2: Configure Frontend Project

1. **Root Directory**: Set to `frontend`
2. **Framework Preset**: Vite (auto-detected)
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. **Install Command**: `npm install`

### Step 3: Configure Environment Variables

Go to Project Settings → Environment Variables and add:

```env
# API Base URL (your Railway backend URL)
VITE_API_BASE_URL=https://your-app.up.railway.app/api
```

**Important**: 
- Variable name must start with `VITE_` for Vite to expose it
- Add for all environments (Production, Preview, Development)

### Step 4: Deploy

1. Click "Deploy"
2. Vercel will build and deploy your frontend
3. You'll get a URL like `https://your-app.vercel.app`

### Step 5: Update Backend CORS

1. Go back to Railway
2. Update `CORS_ORIGIN` environment variable to your Vercel URL:
   ```
   CORS_ORIGIN=https://your-app.vercel.app
   ```
3. Redeploy backend (Railway will auto-redeploy)

### Step 6: Verify Frontend

1. Visit your Vercel URL
2. Should see login page
3. Try logging in with seeded user: `homeowner@demo.com` / `password123`

---

## Part 3: Post-Deployment Setup

### 1. Seed Database (Optional)

To add demo data, connect to Railway database:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to project
railway link

# Run seed
railway run npm run seed
```

### 2. Configure Custom Domains (Optional)

**Railway:**
1. Go to service → Settings → Domains
2. Add custom domain
3. Update DNS records as instructed

**Vercel:**
1. Go to project → Settings → Domains
2. Add custom domain
3. Update DNS records as instructed

### 3. Set Up Monitoring

**Railway:**
- Built-in metrics and logs available in dashboard
- Set up alerts in Settings → Notifications

**Vercel:**
- Built-in analytics and monitoring
- Enable in project settings

---

## Environment Variables Reference

### Backend (Railway)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ | PostgreSQL connection (auto-set) | `postgresql://...` |
| `JWT_SECRET` | ✅ | JWT signing secret (min 32 chars) | `openssl rand -base64 32` |
| `CORS_ORIGIN` | ✅ | Frontend URL | `https://app.vercel.app` |
| `NODE_ENV` | ✅ | Environment | `production` |
| `PORT` | ✅ | Server port (auto-set) | `5000` |
| `STRIPE_SECRET_KEY` | ⚠️ | Stripe API key | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | ⚠️ | Stripe webhook secret | `whsec_...` |
| `AWS_ACCESS_KEY_ID` | ⚠️ | AWS access key | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | ⚠️ | AWS secret key | `...` |
| `AWS_REGION` | ⚠️ | AWS region | `us-east-1` |
| `AWS_S3_BUCKET` | ⚠️ | S3 bucket name | `kealee-uploads` |
| `ANTHROPIC_API_KEY` | ⚠️ | Anthropic API key | `sk-ant-...` |

### Frontend (Vercel)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_API_BASE_URL` | ✅ | Backend API URL | `https://app.railway.app/api` |

---

## Troubleshooting

### Backend Issues

**Database connection errors:**
- Verify `DATABASE_URL` is set correctly
- Check Railway Postgres service is running
- Verify migrations ran: check deployment logs

**CORS errors:**
- Verify `CORS_ORIGIN` matches your Vercel URL exactly
- Check for trailing slashes
- Ensure backend is redeployed after CORS change

**Environment validation fails:**
- Check all required variables are set
- Verify `JWT_SECRET` is at least 32 characters
- Check `CORS_ORIGIN` is a valid URL

### Frontend Issues

**API calls failing:**
- Verify `VITE_API_BASE_URL` is set correctly
- Check backend is accessible (test `/health` endpoint)
- Verify CORS is configured correctly

**Build errors:**
- Check Node version (should be 18+)
- Verify all dependencies install correctly
- Check build logs in Vercel dashboard

---

## Security Checklist

- [ ] `JWT_SECRET` is strong and unique (32+ characters)
- [ ] `CORS_ORIGIN` only includes your Vercel domain
- [ ] Stripe keys are production keys (not test keys)
- [ ] AWS credentials have minimal required permissions
- [ ] Database is not publicly accessible (Railway default)
- [ ] Environment variables are not committed to git
- [ ] Webhook secrets are properly configured
- [ ] Rate limiting is enabled (default: 100 req/15min)

---

## Monitoring & Maintenance

### Regular Tasks

1. **Monitor Railway logs** for errors
2. **Check Vercel analytics** for frontend performance
3. **Review Stripe webhook logs** for payment issues
4. **Monitor database size** in Railway
5. **Update dependencies** regularly

### Backup Strategy

- Railway Postgres: Automatic daily backups (check Railway dashboard)
- Manual backup: Use `pg_dump` via Railway CLI

---

## Support

- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- Stripe Docs: https://stripe.com/docs

---

**Last Updated**: 2024



