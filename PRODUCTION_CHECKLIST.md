# Production Deployment Checklist

Use this checklist to ensure all production deployment steps are completed correctly.

## Pre-Deployment

- [ ] All code committed to version control
- [ ] All tests passing locally
- [ ] Database schema reviewed and approved
- [ ] Security audit completed
- [ ] Performance testing completed
- [ ] Backup strategy defined

## Environment Setup

### Backend (.env.production)

- [ ] DATABASE_URL configured (production PostgreSQL)
- [ ] JWT_SECRET generated (32+ characters)
- [ ] NODE_ENV=production
- [ ] PORT configured (default: 5001)
- [ ] CORS_ORIGIN set to production frontend URL
- [ ] STRIPE_SECRET_KEY (live key)
- [ ] STRIPE_PUBLISHABLE_KEY (live key)
- [ ] STRIPE_WEBHOOK_SECRET configured
- [ ] ANTHROPIC_API_KEY configured
- [ ] AWS_ACCESS_KEY_ID configured
- [ ] AWS_SECRET_ACCESS_KEY configured
- [ ] AWS_REGION configured
- [ ] AWS_S3_BUCKET configured

### Frontend (.env.production)

- [ ] VITE_API_BASE_URL set to production backend URL
- [ ] VITE_STRIPE_PUBLISHABLE_KEY (live key)

## Database

- [ ] Production database instance created
- [ ] Database user has required permissions
- [ ] Database backup configured
- [ ] `npx prisma migrate deploy` executed
- [ ] `npx prisma migrate status` shows "Database and migrations are in sync"
- [ ] `npx prisma generate` executed successfully

## Build Process

### Backend

- [ ] `npm ci --production` executed
- [ ] `npx prisma generate` executed
- [ ] `npm run build` completed successfully
- [ ] `dist/` directory contains compiled files
- [ ] Production build tested locally (`NODE_ENV=production node dist/index.js`)

### Frontend

- [ ] `npm ci` executed
- [ ] `npm run build` completed successfully
- [ ] `dist/` directory contains static files
- [ ] Production build tested locally (`npm run preview`)

## Security Verification

- [ ] JWT_SECRET is strong (32+ characters)
- [ ] CORS_ORIGIN is specific URL (not *)
- [ ] Rate limiting enabled
- [ ] All API routes have authentication middleware
- [ ] SQL injection protection (Prisma)
- [ ] Passwords hashed with bcrypt
- [ ] Environment variables not in code
- [ ] HTTPS enforced in production
- [ ] Security headers configured (via reverse proxy/CDN)

## Deployment Package

### Backend

- [ ] `backend-dist.tar.gz` created
- [ ] Package includes: dist/, node_modules/, prisma/, package.json
- [ ] `.env.production` included (or set separately on server)
- [ ] Package size verified (not too large)

### Frontend

- [ ] `frontend-dist.tar.gz` created (or ready for CDN)
- [ ] Package includes: dist/ directory
- [ ] Static files verified

## Server Configuration

- [ ] Server provisioned and accessible
- [ ] Node.js 18+ installed
- [ ] PostgreSQL client libraries installed
- [ ] PM2 installed (if using process manager)
- [ ] Nginx/Apache configured (if using reverse proxy)
- [ ] SSL certificate installed
- [ ] Firewall rules configured
- [ ] Port 5001 (backend) accessible
- [ ] Port 443 (HTTPS) accessible

## Deployment Execution

- [ ] Backend files uploaded to server
- [ ] Backend dependencies installed (`npm ci --production`)
- [ ] Backend process started (PM2 or systemd)
- [ ] Backend health check passes (`/health` endpoint)
- [ ] Frontend files deployed (CDN or static server)
- [ ] Frontend accessible at production URL
- [ ] API calls from frontend working

## Post-Deployment Verification

- [ ] User registration works
- [ ] User login works
- [ ] All portal dashboards load
- [ ] Project creation works
- [ ] File uploads work (test with small file)
- [ ] Stripe integration works (test mode first)
- [ ] Database queries working
- [ ] No errors in server logs
- [ ] No errors in browser console
- [ ] Performance acceptable (< 2s page load)

## Monitoring Setup

- [ ] Error tracking configured (Sentry, etc.)
- [ ] Application logs accessible
- [ ] Database monitoring enabled
- [ ] Uptime monitoring configured
- [ ] Alert notifications configured

## Backup & Recovery

- [ ] Database backup automated
- [ ] File storage backup configured (S3 versioning)
- [ ] Backup restoration tested
- [ ] Rollback procedure documented
- [ ] Backup retention policy defined

## Documentation

- [ ] Deployment guide reviewed
- [ ] Environment variables documented
- [ ] API endpoints documented
- [ ] Database schema documented
- [ ] Runbook created for common issues

## Sign-Off

- [ ] Development team sign-off
- [ ] QA sign-off
- [ ] Security team sign-off (if applicable)
- [ ] Product owner sign-off

---

**Checklist Completed By:** _________________________

**Date:** _________________________

**Deployment Version:** 2.0.0

**Notes:**
_________________________________________________
_________________________________________________
_________________________________________________


