# Railway Backend Environment Variables - Complete Guide

Complete list of all environment variables needed for Railway backend with step-by-step instructions.

═══════════════════════════════════════════════════════════════════════════════
QUICK REFERENCE TABLE
═══════════════════════════════════════════════════════════════════════════════

| Variable Name | Value | How to Get |
|--------------|-------|------------|
| `NODE_ENV` | `production` | Direct value |
| `PORT` | `5001` | Direct value |
| `JWT_SECRET` | [Generated] | See Step 1 |
| `CORS_ORIGIN` | [Vercel URL] | See Step 2 |
| `STRIPE_SECRET_KEY` | `sk_live_...` | See Step 3 |
| `STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | See Step 3 |
| `AWS_ACCESS_KEY_ID` | [AWS Key] | See Step 4 |
| `AWS_SECRET_ACCESS_KEY` | [AWS Secret] | See Step 4 |
| `AWS_REGION` | `us-east-1` | Direct value |
| `AWS_S3_BUCKET` | `kealee-platform-uploads` | Direct value |

**Note:** `DATABASE_URL` is automatically set by Railway when you add PostgreSQL.

═══════════════════════════════════════════════════════════════════════════════
STEP 1: GENERATE JWT_SECRET
═══════════════════════════════════════════════════════════════════════════════

**Windows (PowerShell):**
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Unix/Linux/Mac:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Example output:**
```
aB3dE5fG7hI9jK1lM3nO5pQ7rS9tU1vW3xY5zA7bC9dE1fG3hI5jK7lM9nO1pQ3
```

**Copy this entire string** - it's your `JWT_SECRET` value.

═══════════════════════════════════════════════════════════════════════════════
STEP 2: GET CORS_ORIGIN (Vercel Frontend URL)
═══════════════════════════════════════════════════════════════════════════════

**Option A: Using Vercel CLI**
```bash
cd frontend
vercel ls
```

Look for the production deployment URL, example:
```
https://kealee-platform-abc123.vercel.app
```

**Option B: From Vercel Dashboard**
1. Go to https://vercel.com
2. Open your project
3. Go to "Deployments"
4. Copy the production URL (starts with `https://`)

**Important:** Use the full URL including `https://` (no trailing slash).

═══════════════════════════════════════════════════════════════════════════════
STEP 3: GET STRIPE KEYS
═══════════════════════════════════════════════════════════════════════════════

1. Go to https://dashboard.stripe.com
2. Click "Developers" → "API keys"
3. Make sure you're in **Live mode** (toggle in top right)
4. Copy:
   - **Secret key**: `sk_live_...` (this is `STRIPE_SECRET_KEY`)
   - **Publishable key**: `pk_live_...` (this is `STRIPE_PUBLISHABLE_KEY`)

**For webhooks (optional):**
1. Go to "Developers" → "Webhooks"
2. Create or view webhook endpoint
3. Copy "Signing secret": `whsec_...` (this is `STRIPE_WEBHOOK_SECRET`)

═══════════════════════════════════════════════════════════════════════════════
STEP 4: GET AWS CREDENTIALS
═══════════════════════════════════════════════════════════════════════════════

**If you already have AWS credentials:**
- `AWS_ACCESS_KEY_ID`: Your AWS access key
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret key
- `AWS_REGION`: `us-east-1` (or your preferred region)
- `AWS_S3_BUCKET`: `kealee-platform-uploads` (or your bucket name)

**If you need to create AWS credentials:**

1. **Create S3 Bucket:**
   - Go to https://console.aws.amazon.com/s3
   - Click "Create bucket"
   - Name: `kealee-platform-uploads`
   - Region: `us-east-1`
   - Click "Create bucket"

2. **Create IAM User:**
   - Go to https://console.aws.amazon.com/iam
   - Click "Users" → "Create user"
   - Username: `kealee-platform-s3`
   - Click "Next"

3. **Attach S3 Policy:**
   - Click "Attach policies directly"
   - Search for "AmazonS3FullAccess" (or create custom policy)
   - Click "Next" → "Create user"

4. **Get Access Keys:**
   - Click on the user you just created
   - Go to "Security credentials" tab
   - Click "Create access key"
   - Choose "Application running outside AWS"
   - Click "Next" → "Create access key"
   - **Copy both:**
     - Access key ID → `AWS_ACCESS_KEY_ID`
     - Secret access key → `AWS_SECRET_ACCESS_KEY` (click "Show" to reveal)

═══════════════════════════════════════════════════════════════════════════════
STEP 5: ADD VARIABLES TO RAILWAY
═══════════════════════════════════════════════════════════════════════════════

## Method A: Using Railway CLI

```bash
cd backend

# Required variables
railway variables set NODE_ENV=production
railway variables set PORT=5001
railway variables set JWT_SECRET=your-generated-jwt-secret-here
railway variables set CORS_ORIGIN=https://your-vercel-url.vercel.app

# Stripe (required in production)
railway variables set STRIPE_SECRET_KEY=sk_live_...
railway variables set STRIPE_PUBLISHABLE_KEY=pk_live_...

# AWS (required in production)
railway variables set AWS_ACCESS_KEY_ID=your-aws-access-key
railway variables set AWS_SECRET_ACCESS_KEY=your-aws-secret-key
railway variables set AWS_REGION=us-east-1
railway variables set AWS_S3_BUCKET=kealee-platform-uploads
```

## Method B: Using Railway Dashboard

1. Go to https://railway.app
2. Log in and open your backend project
3. Click **"Variables"** tab (left sidebar)
4. Click **"+ New Variable"** for each variable:

   **NODE_ENV**
   - Name: `NODE_ENV`
   - Value: `production`
   - Click "Add Variable"

   **PORT**
   - Name: `PORT`
   - Value: `5001`
   - Click "Add Variable"

   **JWT_SECRET**
   - Name: `JWT_SECRET`
   - Value: [paste the generated value from Step 1]
   - Click "Add Variable"

   **CORS_ORIGIN**
   - Name: `CORS_ORIGIN`
   - Value: `https://your-vercel-url.vercel.app`
   - Click "Add Variable"

   **STRIPE_SECRET_KEY**
   - Name: `STRIPE_SECRET_KEY`
   - Value: `sk_live_...` (from Step 3)
   - Click "Add Variable"

   **STRIPE_PUBLISHABLE_KEY**
   - Name: `STRIPE_PUBLISHABLE_KEY`
   - Value: `pk_live_...` (from Step 3)
   - Click "Add Variable"

   **AWS_ACCESS_KEY_ID**
   - Name: `AWS_ACCESS_KEY_ID`
   - Value: [your AWS access key from Step 4]
   - Click "Add Variable"

   **AWS_SECRET_ACCESS_KEY**
   - Name: `AWS_SECRET_ACCESS_KEY`
   - Value: [your AWS secret key from Step 4]
   - Click "Add Variable"

   **AWS_REGION**
   - Name: `AWS_REGION`
   - Value: `us-east-1`
   - Click "Add Variable"

   **AWS_S3_BUCKET**
   - Name: `AWS_S3_BUCKET`
   - Value: `kealee-platform-uploads`
   - Click "Add Variable"

═══════════════════════════════════════════════════════════════════════════════
STEP 6: VERIFY ALL VARIABLES
═══════════════════════════════════════════════════════════════════════════════

```bash
cd backend
railway variables
```

You should see all variables listed. Check that:
- ✅ `NODE_ENV` = `production`
- ✅ `PORT` = `5001`
- ✅ `JWT_SECRET` is set (hidden value)
- ✅ `CORS_ORIGIN` matches your Vercel URL exactly
- ✅ `STRIPE_SECRET_KEY` is set
- ✅ `AWS_ACCESS_KEY_ID` is set
- ✅ `AWS_SECRET_ACCESS_KEY` is set
- ✅ `AWS_REGION` = `us-east-1`
- ✅ `AWS_S3_BUCKET` = `kealee-platform-uploads`
- ✅ `DATABASE_URL` is set (auto-set by Railway)

═══════════════════════════════════════════════════════════════════════════════
STEP 7: REDEPLOY BACKEND
═══════════════════════════════════════════════════════════════════════════════

After setting all variables, redeploy:

```bash
cd backend
railway up
```

Wait for deployment to complete (1-2 minutes).

═══════════════════════════════════════════════════════════════════════════════
STEP 8: TEST DEPLOYMENT
═══════════════════════════════════════════════════════════════════════════════

```bash
# Get backend URL
railway domain

# Test health endpoint
curl https://your-backend.up.railway.app/api/health
```

Should return:
```json
{"status":"ok","timestamp":"2026-01-01T12:00:00.000Z"}
```

Check logs:
```bash
railway logs --tail 50
```

Look for:
- ✅ "Environment validation passed"
- ✅ "NODE_ENV: production"
- ✅ "Server started on port 5001"
- ✅ No errors

═══════════════════════════════════════════════════════════════════════════════
COMPLETE CHECKLIST
═══════════════════════════════════════════════════════════════════════════════

**Required Variables:**
- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `5001`
- [ ] `JWT_SECRET` = [generated 32+ char string]
- [ ] `CORS_ORIGIN` = [your Vercel URL]
- [ ] `STRIPE_SECRET_KEY` = `sk_live_...`
- [ ] `STRIPE_PUBLISHABLE_KEY` = `pk_live_...`
- [ ] `AWS_ACCESS_KEY_ID` = [your AWS key]
- [ ] `AWS_SECRET_ACCESS_KEY` = [your AWS secret]
- [ ] `AWS_REGION` = `us-east-1`
- [ ] `AWS_S3_BUCKET` = `kealee-platform-uploads`
- [ ] `DATABASE_URL` = [auto-set by Railway]

**Verification:**
- [ ] All variables set in Railway
- [ ] Backend redeployed
- [ ] Health check passes
- [ ] Logs show no errors
- [ ] Frontend can connect (no CORS errors)

═══════════════════════════════════════════════════════════════════════════════
TROUBLESHOOTING
═══════════════════════════════════════════════════════════════════════════════

**Backend won't start:**
- Check logs: `railway logs`
- Verify all required variables are set
- Ensure JWT_SECRET is at least 32 characters
- Ensure CORS_ORIGIN is a valid URL

**CORS errors:**
- Verify CORS_ORIGIN matches Vercel URL exactly
- Include `https://` prefix
- No trailing slash
- Redeploy after changing CORS_ORIGIN

**Missing variables error:**
- Check Railway variables: `railway variables`
- Ensure all required variables are set
- Redeploy: `railway up`

═══════════════════════════════════════════════════════════════════════════════

**Last Updated:** 2026-01-01


