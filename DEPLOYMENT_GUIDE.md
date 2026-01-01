# Kealee Platform - Production Deployment Guide

## Overview
This guide covers the complete process for deploying the Kealee Construction Platform to production.

---

## Prerequisites

- PostgreSQL database (production instance)
- Node.js 18+ installed on server
- AWS S3 bucket for file storage
- Stripe account with live API keys
- Anthropic API key for ML features
- Domain name with SSL certificate

---

## TASK 1: Environment Variables Setup

### Backend Environment Variables

1. Copy the example file:
```bash
cd backend
cp .env.production.example .env.production
```

2. Edit `.env.production` and fill in all values:
```env
DATABASE_URL=postgresql://user:password@host:5432/kealee_production
JWT_SECRET=<generate-strong-secret-minimum-32-characters>
NODE_ENV=production
PORT=5001
CORS_ORIGIN=https://yourdomain.com
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
ANTHROPIC_API_KEY=sk-ant-...
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=kealee-production-uploads
```

**Generate JWT_SECRET:**
```bash
openssl rand -base64 32
```

**Important:** 
- Never commit `.env.production` to version control
- JWT_SECRET must be at least 32 characters
- CORS_ORIGIN must be a valid URL (e.g., https://app.kealee.com)

### Frontend Environment Variables

1. Copy the example file:
```bash
cd frontend
cp .env.production.example .env.production
```

2. Edit `.env.production`:
```env
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## TASK 2: Database Setup

### Run Migrations

```bash
cd backend

# Verify Prisma schema is up to date
npx prisma validate

# Generate Prisma Client
npx prisma generate

# Apply all migrations to production database
npx prisma migrate deploy

# Verify migrations applied successfully
npx prisma migrate status
# Expected output: "Database and migrations are in sync"
```

**⚠️ Important:** 
- `migrate deploy` applies migrations without creating new migration files
- Always backup database before running migrations in production
- Test migrations on staging environment first

---

## TASK 3: Build Backend

```bash
cd backend

# Install production dependencies only (excludes devDependencies)
npm ci --production

# Generate Prisma Client (required for runtime)
npx prisma generate

# Build TypeScript to JavaScript
npm run build

# Verify build succeeded
ls -la dist/
# Should see: index.js and compiled .js files

# Test production build locally (optional)
NODE_ENV=production node dist/index.js
# Press Ctrl+C to stop after verifying server starts
```

**Build Output:**
- Compiled JavaScript in `dist/` directory
- Type definitions in `dist/` (if enabled in tsconfig.json)

---

## TASK 4: Build Frontend

```bash
cd frontend

# Install all dependencies (including devDependencies for build)
npm ci

# Build for production
npm run build

# Verify build succeeded
ls -la dist/
# Should see: index.html, assets/ directory

# Test production build locally (optional)
npm run preview
# Visit http://localhost:4173 to preview
# Press Ctrl+C to stop
```

**Build Output:**
- Static files in `dist/` directory
- Optimized and minified assets
- Source maps (optional, disable for production)

---

## TASK 5: Security Checklist

### ✅ Authentication & Authorization
- [x] All API routes have `requireAuth` middleware
- [x] Role-based access control (RBAC) implemented
- [x] JWT tokens with expiration
- [x] JWT_SECRET is strong (32+ characters)

### ✅ CORS Configuration
- [x] CORS configured with specific origin (not *)
- [x] Production CORS_ORIGIN set to actual domain
- [x] Credentials allowed for authenticated requests
- [x] Only required HTTP methods allowed

### ✅ Rate Limiting
- [x] Rate limiting middleware enabled
- [x] Prevents brute force attacks
- [x] Configurable per route if needed

### ✅ Input Validation
- [x] Prisma prevents SQL injection
- [x] Request validation on all endpoints
- [x] File upload size limits
- [x] File type validation

### ✅ Data Protection
- [x] Passwords hashed with bcrypt
- [x] Sensitive data encrypted in transit (HTTPS)
- [x] Environment variables for secrets
- [x] No hardcoded credentials

### ✅ Headers & HTTPS
- [ ] **TODO:** Add helmet.js for security headers (recommended)
- [x] Trust proxy enabled (for load balancers)
- [x] HTTPS enforced in production (via reverse proxy/CDN)

### ✅ Error Handling
- [x] Error handler middleware prevents stack traces in production
- [x] Generic error messages for users
- [x] Detailed errors logged server-side only

---

## TASK 6: Deployment Package Creation

### Backend Deployment Package

```bash
cd backend

# Create deployment package (excludes node_modules for faster transfer)
tar -czf ../backend-dist.tar.gz \
  dist/ \
  node_modules/ \
  prisma/ \
  package.json \
  package-lock.json \
  .env.production

# Alternative: Create package without node_modules (install on server)
tar -czf ../backend-dist-no-deps.tar.gz \
  dist/ \
  prisma/ \
  package.json \
  package-lock.json \
  .env.production
```

**Package Contents:**
- `dist/` - Compiled JavaScript
- `node_modules/` - Production dependencies (if included)
- `prisma/` - Prisma schema and migrations
- `package.json` - Dependencies list
- `.env.production` - Environment variables (keep secure!)

### Frontend Deployment Package

```bash
cd frontend

# Create deployment package
tar -czf ../frontend-dist.tar.gz dist/

# Or deploy directly to CDN/S3 (recommended)
# The dist/ folder contains all static files
```

**Deployment Options:**
- Static hosting (Vercel, Netlify, AWS S3 + CloudFront)
- Traditional server (Nginx, Apache)
- CDN distribution (CloudFlare, AWS CloudFront)

---

## TASK 7: Server Deployment

### Option A: Traditional Server (Node.js + PM2)

1. **Upload files:**
```bash
# Upload backend-dist.tar.gz to server
scp backend-dist.tar.gz user@server:/opt/kealee/

# SSH into server
ssh user@server

# Extract backend
cd /opt/kealee
tar -xzf backend-dist.tar.gz

# Install production dependencies (if not included)
npm ci --production
```

2. **Install PM2 (Process Manager):**
```bash
npm install -g pm2

# Start application
cd /opt/kealee
pm2 start dist/index.js --name kealee-backend

# Configure PM2 to start on boot
pm2 startup
pm2 save
```

3. **Setup Nginx Reverse Proxy:**
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Option B: Platform-as-a-Service (Railway, Heroku, Render)

1. **Connect repository**
2. **Set environment variables** in platform dashboard
3. **Configure build command:** `npm run build`
4. **Configure start command:** `npm start`
5. **Deploy**

### Frontend Deployment

**Option 1: Static Hosting (Vercel/Netlify)**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd frontend
vercel --prod
```

**Option 2: AWS S3 + CloudFront**
```bash
# Install AWS CLI
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

**Option 3: Nginx Static Files**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    root /var/www/kealee-frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass https://api.yourdomain.com;
    }
}
```

---

## TASK 8: Post-Deployment Verification

### Backend Health Check

```bash
# Check if server is running
curl https://api.yourdomain.com/health

# Expected: {"status":"ok"}

# Test authentication
curl -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### Frontend Verification

1. Visit `https://yourdomain.com`
2. Verify API calls work (check browser network tab)
3. Test login flow
4. Verify all routes load correctly

### Database Verification

```bash
cd backend
npx prisma studio
# Opens database GUI at http://localhost:5555
```

---

## TASK 9: Monitoring & Logging

### Recommended Tools

- **Error Tracking:** Sentry, Rollbar
- **APM:** New Relic, Datadog
- **Logging:** Winston (already configured), CloudWatch, LogDNA
- **Uptime Monitoring:** UptimeRobot, Pingdom

### Log Locations

- Application logs: Check PM2 logs (`pm2 logs`)
- Database logs: Check PostgreSQL logs
- Web server logs: Check Nginx/Apache logs

---

## TASK 10: Backup Strategy

### Database Backups

```bash
# Daily backup script
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore backup
psql $DATABASE_URL < backup_20240101.sql
```

### File Storage Backups

- AWS S3 has built-in versioning
- Enable S3 bucket versioning
- Configure lifecycle policies for old versions

---

## Troubleshooting

### Build Errors

**TypeScript compilation errors:**
- Check `tsconfig.json` settings
- Verify all types are properly defined
- Run `npm run build` locally first

**Prisma generation errors:**
- Verify `schema.prisma` is valid
- Check database connection string
- Run `npx prisma generate` separately

### Runtime Errors

**Database connection errors:**
- Verify `DATABASE_URL` is correct
- Check database server is accessible
- Verify network/firewall rules

**CORS errors:**
- Verify `CORS_ORIGIN` matches frontend URL exactly
- Check protocol (http vs https)
- Check trailing slashes

**JWT errors:**
- Verify `JWT_SECRET` is set
- Ensure secret is at least 32 characters
- Check token expiration settings

---

## Security Recommendations (Future Enhancements)

1. **Add helmet.js** for security headers:
```bash
npm install helmet
```

```typescript
import helmet from 'helmet';
app.use(helmet());
```

2. **Enable rate limiting per IP** (already implemented)

3. **Add request ID tracking** for better debugging

4. **Implement API versioning** for future changes

5. **Add request/response logging** middleware

6. **Enable database connection pooling** (Prisma handles this)

---

## Rollback Procedure

If deployment fails:

1. **Database Rollback:**
```bash
cd backend
npx prisma migrate resolve --rolled-back <migration-name>
```

2. **Application Rollback:**
```bash
# Stop current version
pm2 stop kealee-backend

# Restore previous version
tar -xzf backup-backend-dist.tar.gz

# Start previous version
pm2 start dist/index.js --name kealee-backend
```

---

## Support & Documentation

- Backend API Documentation: `/api/docs` (if enabled)
- Database Schema: `backend/prisma/schema.prisma`
- MASTER_SPEC Compliance: See `WORKFLOW_VERIFICATION_PLAN.md`

---

**Last Updated:** $(Get-Date -Format "yyyy-MM-dd")
**Version:** 2.0.0

