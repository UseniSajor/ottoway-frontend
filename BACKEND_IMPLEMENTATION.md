# Backend Implementation Summary

## A) FILES CHANGED

### New Services (Business Logic)
- `backend/src/services/contractorService.ts` - Contractor invite + approval gate
- `backend/src/services/permitService.ts` - Permit blocking with structured error reasons
- `backend/src/services/escrowService.ts` - Escrow rules with Stripe Connect adapter
- `backend/src/services/readinessService.ts` - Readiness validation (can start pre-contract)
- `backend/src/services/projectService.ts` - Project creation with project_type requirement + complexity suggestion
- `backend/src/services/reviewService.ts` - Review locking until completion/final payment
- `backend/src/services/mlService.ts` - ML/Automation layer with guardrails

### New Routes
- `backend/src/routes/readiness.ts` - Readiness checklist endpoints
- `backend/src/routes/contracts.ts` - Contract endpoints (draft, send for signature, sign, fully signed)
- `backend/src/routes/permits.ts` - Permit endpoints with blocking logic
- `backend/src/routes/escrow.ts` - Escrow endpoints (fund, balance, request release, approve release, Stripe Connect)
- `backend/src/routes/milestones.ts` - Milestone endpoints (create, evidence upload, complete)
- `backend/src/routes/notifications.ts` - Notifications endpoints
- `backend/src/routes/automation.ts` - Automation rules CRUD + execute with guardrails
- `backend/src/routes/admin.ts` - Admin endpoints (contractor approvals, analytics)

### Updated Routes
- `backend/src/routes/projects.ts` - Added CRUD endpoints with project_type requirement
- `backend/src/index.ts` - Registered all new routes

### Seeding
- `backend/src/seed.ts` - Seed script with demo users, properties, and projects
- `backend/package.json` - Added seed script

## B) WINDOWS COMMANDS

```powershell
# 1. Generate Prisma client
cd backend
npx prisma generate

# 2. Run migrations
npx prisma migrate dev --name add_business_logic

# 3. Seed database
npm run seed

# 4. Start development server
npm run dev
```

## C) CURL COMMANDS TO TEST KEY RULES

### 1. Test Permit Blocking (Should be blocked)

```powershell
# First, login to get token
$token = (Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body (@{email="homeowner@demo.com";password="password123"} | ConvertTo-Json) -ContentType "application/json").data.token

# Try to submit permit (should be blocked)
Invoke-RestMethod -Uri "http://localhost:5000/api/permits/projects/{projectId}/permits/submit" -Method POST -Headers @{Authorization="Bearer $token"} -ContentType "application/json"
```

**Expected Response:**
```json
{
  "message": "Permit submission is blocked",
  "blockingReasons": [
    {
      "type": "CONTRACT_NOT_SIGNED",
      "message": "Contract must be fully signed before permit submission"
    },
    {
      "type": "DESIGN_NOT_APPROVED",
      "message": "Design must be approved for permit before submission"
    }
  ]
}
```

### 2. Test Escrow Release Blocking (Dispute freeze)

```powershell
# Request escrow release (should be blocked if dispute exists)
Invoke-RestMethod -Uri "http://localhost:5000/api/escrow/{escrowId}/release-request" -Method POST -Headers @{Authorization="Bearer $token"} -Body (@{milestoneId="{milestoneId}"} | ConvertTo-Json) -ContentType "application/json"
```

**Expected Response (if dispute exists):**
```json
{
  "message": "RELEASE_BLOCKED: Escrow releases are frozen due to active dispute"
}
```

### 3. Test Escrow Release Requires Human Approval

```powershell
# Try to approve release without human confirmation flag (should be blocked)
Invoke-RestMethod -Uri "http://localhost:5000/api/escrow/transactions/{transactionId}/approve" -Method POST -Headers @{Authorization="Bearer $token"} -Body (@{} | ConvertTo-Json) -ContentType "application/json"
```

**Expected Response:**
```json
{
  "message": "ESCROW_RELEASE_REQUIRES_HUMAN_APPROVAL: This action requires explicit human confirmation"
}
```

### 4. Test Project Creation Requires project_type

```powershell
# Try to create project without project_type (should fail)
Invoke-RestMethod -Uri "http://localhost:5000/api/projects" -Method POST -Headers @{Authorization="Bearer $token"} -Body (@{propertyId="{propertyId}";name="Test Project";category="RESIDENTIAL"} | ConvertTo-Json) -ContentType "application/json"
```

**Expected Response:**
```json
{
  "message": "project_type is required"
}
```

### 5. Test Automation Guardrails (Blocked actions)

```powershell
# Try to execute permit submit action via automation (should be blocked)
Invoke-RestMethod -Uri "http://localhost:5000/api/automation/execute" -Method POST -Headers @{Authorization="Bearer $token"} -Body (@{ruleId="{ruleId}";actionType="PERMIT_SUBMIT";parameters={projectId="{projectId}"};requiresHumanConfirmation=$false} | ConvertTo-Json) -ContentType "application/json"
```

**Expected Response:**
```json
{
  "message": "AUTOMATION_BLOCKED: This action requires human confirmation"
}
```

### 6. Test Readiness Can Start Pre-Contract

```powershell
# Create readiness checklist (should work without contract)
Invoke-RestMethod -Uri "http://localhost:5000/api/readiness/projects/{projectId}/readiness" -Method POST -Headers @{Authorization="Bearer $token"} -ContentType "application/json"
```

**Expected Response:**
```json
{
  "data": {
    "id": "...",
    "projectId": "...",
    "createdAt": "..."
  }
}
```

### 7. Test Contractor Approval Gate

```powershell
# Login as admin
$adminToken = (Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body (@{email="admin@demo.com";password="password123"} | ConvertTo-Json) -ContentType "application/json").data.token

# Approve contractor
Invoke-RestMethod -Uri "http://localhost:5000/api/admin/contractors/{contractorId}/approve" -Method POST -Headers @{Authorization="Bearer $adminToken"} -ContentType "application/json"
```

## D) DEPLOY NOTES FOR RAILWAY

### Environment Variables Required:

```env
# Database (auto-provided by Railway Postgres)
DATABASE_URL="postgresql://user:password@host:port/dbname?schema=public"

# JWT Secret (generate strong random string)
JWT_SECRET="your-strong-random-secret-key-here"

# Server Port (Railway provides automatically)
PORT=5000

# CORS Origin (your Vercel frontend URL)
CORS_ORIGIN="https://your-app.vercel.app"

# Stripe (for production Stripe Connect)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."

# Anthropic API (for ML recommendations - optional)
ANTHROPIC_API_KEY="sk-ant-..."
```

### Railway Deployment Steps:

1. **Connect Repository** to Railway
2. **Set Root Directory** to `backend`
3. **Add PostgreSQL Service** (Railway will auto-provide DATABASE_URL)
4. **Set Environment Variables:**
   - `JWT_SECRET` - Generate: `openssl rand -base64 32`
   - `CORS_ORIGIN` - Your Vercel frontend URL
   - `STRIPE_SECRET_KEY` - If using Stripe Connect
   - `ANTHROPIC_API_KEY` - If using LLM recommendations
5. **Deploy** - Railway will:
   - Run `npm install`
   - Run `npm run build`
   - Run `npx prisma generate`
   - Run `npx prisma migrate deploy` (via startCommand in railway.json)
   - Start with `npm start`

### Post-Deployment:

1. **Run seed script** (optional, for demo data):
   ```bash
   npm run seed
   ```
   Note: This should be done manually via Railway CLI or one-time script

2. **Verify health endpoint:**
   ```bash
   curl https://your-app.railway.app/health
   ```

### Migration Notes:

- `prisma migrate deploy` runs automatically on Railway via `railway.json` startCommand
- All migrations are applied before server starts
- Database schema is automatically synced

### Important Security Notes:

1. **JWT_SECRET** must be strong and unique
2. **CORS_ORIGIN** should only include your frontend domain
3. **Stripe keys** should use production keys in production
4. **Database** is automatically secured by Railway



