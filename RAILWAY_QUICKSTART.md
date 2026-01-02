# Railway Deployment - Quick Start

Fast deployment guide for Railway.app. See `RAILWAY_DEPLOYMENT.md` for detailed instructions.

---

## 1. Install & Login

```bash
npm install -g @railway/cli
railway login
```

---

## 2. Deploy Database

```bash
# Create project
railway init

# Add PostgreSQL
railway add postgresql

# Get database URL
railway variables
# Copy DATABASE_URL
```

---

## 3. Deploy Backend

```bash
cd backend

# Link to project
railway link

# Set required variables (replace placeholders)
railway variables set DATABASE_URL=<from-step-2>
railway variables set JWT_SECRET=$(openssl rand -base64 32)
railway variables set NODE_ENV=production
railway variables set CORS_ORIGIN=https://your-frontend.railway.app
railway variables set STRIPE_SECRET_KEY=sk_live_...
railway variables set STRIPE_PUBLISHABLE_KEY=pk_live_...
railway variables set ANTHROPIC_API_KEY=sk-ant-...
railway variables set AWS_ACCESS_KEY_ID=...
railway variables set AWS_SECRET_ACCESS_KEY=...
railway variables set AWS_REGION=us-east-1
railway variables set AWS_S3_BUCKET=...

# Run migrations
railway run npx prisma generate
railway run npx prisma migrate deploy

# Deploy
railway up

# Get backend URL
railway domain
# Save this URL for frontend!
```

---

## 4. Deploy Frontend

```bash
cd frontend

# Create frontend service
railway service

# Set variables (use backend URL from step 3)
railway variables set VITE_API_BASE_URL=https://your-backend.railway.app
railway variables set VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Deploy
railway up

# Get frontend URL
railway domain
```

---

## 5. Update CORS

```bash
cd backend

# Update with actual frontend URL
railway variables set CORS_ORIGIN=https://your-frontend.railway.app

# Restart
railway restart
```

---

## 6. Verify

```bash
# Test backend
curl https://your-backend.railway.app/health

# Test frontend
open https://your-frontend.railway.app
```

---

## Quick Commands Reference

```bash
railway login              # Login to Railway
railway list              # List projects
railway link              # Link to project
railway variables         # View variables
railway variables set K=V # Set variable
railway up                # Deploy
railway logs              # View logs
railway restart           # Restart service
railway domain            # Generate domain
railway open              # Open dashboard
```

---

**Full Guide:** See `RAILWAY_DEPLOYMENT.md` for detailed instructions and troubleshooting.


