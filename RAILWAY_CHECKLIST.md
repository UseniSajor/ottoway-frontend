# Railway Deployment Checklist

Use this checklist when deploying the backend to Railway.

## Pre-Deployment

- [ ] Code is pushed to GitHub repository
- [ ] All environment variables are documented
- [ ] Database migrations are ready
- [ ] Seed script is tested locally

## Railway Project Setup

- [ ] Created new Railway project
- [ ] Connected GitHub repository
- [ ] Created backend service
- [ ] **Set Root Directory to `backend`** (Critical!)
- [ ] Added PostgreSQL database service

## Environment Variables

### Required Variables

- [ ] `DATABASE_URL` - Auto-provided by Railway Postgres
- [ ] `JWT_SECRET` - Generated with `openssl rand -base64 32` (min 32 chars)
- [ ] `CORS_ORIGIN` - Your Vercel frontend URL (e.g., `https://app.vercel.app`)
- [ ] `NODE_ENV` - Set to `production`
- [ ] `PORT` - Auto-provided by Railway (usually `5000`)

### Optional Variables (for production features)

- [ ] `STRIPE_SECRET_KEY` - Production Stripe key (`sk_live_...`)
- [ ] `STRIPE_WEBHOOK_SECRET` - From Stripe Dashboard (`whsec_...`)
- [ ] `AWS_ACCESS_KEY_ID` - AWS access key for S3
- [ ] `AWS_SECRET_ACCESS_KEY` - AWS secret key
- [ ] `AWS_REGION` - AWS region (e.g., `us-east-1`)
- [ ] `AWS_S3_BUCKET` - S3 bucket name
- [ ] `ANTHROPIC_API_KEY` - Anthropic API key for ML

## Build Configuration

- [ ] Build command: `npm install && npm run build && npx prisma generate`
- [ ] Start command: `npm run prisma:deploy && npm start`
- [ ] Node version: 18+ (check in Settings → Build)

## Deployment

- [ ] Initial deployment triggered
- [ ] Build logs show successful build
- [ ] Prisma migrations ran successfully (check logs)
- [ ] Server started without errors
- [ ] Health endpoint responds: `curl https://your-app.up.railway.app/health`

## Post-Deployment Verification

- [ ] Environment validation passed (check logs for "✅ Environment validation passed")
- [ ] Database connection successful
- [ ] CORS configured correctly
- [ ] API endpoints respond correctly
- [ ] Stripe webhook endpoint configured (if using Stripe)
- [ ] File uploads work (check storage adapter)

## Stripe Webhook Setup (if using Stripe)

- [ ] Created webhook endpoint in Stripe Dashboard
- [ ] Webhook URL: `https://your-railway-url.up.railway.app/api/stripe/webhook`
- [ ] Selected events: `account.updated`, `payment_intent.succeeded`, `transfer.created`, `charge.dispute.created`
- [ ] Copied webhook secret to Railway as `STRIPE_WEBHOOK_SECRET`
- [ ] Tested webhook (Stripe Dashboard → Send test webhook)

## Security

- [ ] `JWT_SECRET` is strong (32+ characters, random)
- [ ] `CORS_ORIGIN` only includes your Vercel domain
- [ ] No sensitive data in logs
- [ ] Database is not publicly accessible
- [ ] Rate limiting is enabled (default: 100 req/15min)

## Monitoring

- [ ] Railway metrics dashboard accessible
- [ ] Logs are viewable
- [ ] Alerts configured (optional)
- [ ] Error tracking set up (optional)

## Final Checks

- [ ] Backend URL is accessible
- [ ] Health endpoint returns `{"status":"ok"}`
- [ ] CORS allows requests from Vercel frontend
- [ ] All API endpoints respond correctly
- [ ] Database migrations applied
- [ ] Seed data loaded (if needed)

---

**Deployment URL**: `https://your-app.up.railway.app`

**Next Step**: Deploy frontend to Vercel and update `CORS_ORIGIN` with Vercel URL.



