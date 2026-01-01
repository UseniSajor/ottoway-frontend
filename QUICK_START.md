# Quick Start - Running Tests and Verification

## Prerequisites

1. **Backend server must be running** (for verification script)
   ```powershell
   cd backend
   npm run dev
   ```

2. **Database must be seeded** (for verification script)
   ```powershell
   cd backend
   npm run seed
   ```

## Running Tests

### Backend Tests

```powershell
cd backend

# Run all tests
npm test

# Run specific test file
npm test -- rbac.test.ts
npm test -- permit-block.test.ts
npm test -- escrow-approval.test.ts

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Frontend Tests

```powershell
cd frontend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Running Verification Script

The verification script checks all "Definition of Done" criteria from MASTER_SPEC.md.

### Option 1: Using npm script (TypeScript)

```powershell
cd backend

# Make sure server is running in another terminal
npm run verify
```

### Option 2: Using standalone Node.js script

```powershell
cd backend

# Make sure server is running in another terminal
npm run verify:node

# Or directly:
node scripts/verify-definition-of-done.js
```

### Option 3: With custom API URL

```powershell
cd backend

# Set API base URL if server is on different port/domain
$env:API_BASE_URL="http://localhost:5000/api"
npm run verify
```

## Expected Output

### Successful Verification:

```
=== Definition of Done Verification ===

Verifying 21 project types exist...
Verifying project_type is required on create...
...

=== Verification Results ===

✓ PASS 21 Project Types Exist
  Found 21 project types

✓ PASS Project Types Grouped Correctly
  All types correctly grouped by category

...

=== Summary ===
Total: 12
Passed: 12
Failed: 0

✓ All checks passed!
```

### Failed Verification:

```
✗ FAIL Project Type Required on Create
  Unexpected error: Connection refused

=== Summary ===
Total: 12
Passed: 11
Failed: 1

✗ 1 check(s) failed
```

## Troubleshooting

### "Connection refused" errors
- Make sure backend server is running: `npm run dev` in backend directory
- Check API_BASE_URL environment variable matches your server URL

### "No properties available for test"
- Run seed script: `npm run seed` in backend directory
- Verify database connection

### "Authentication failed"
- Verify seeded users exist (homeowner@demo.com, admin@demo.com)
- Check password is `password123` (from seed script)

### Tests fail to connect to database
- Verify DATABASE_URL is set correctly
- Check database is running and accessible
- Run migrations: `npx prisma migrate dev`

## Test Files Location

- Backend tests: `backend/src/tests/*.test.ts`
- Frontend tests: `frontend/src/tests/*.test.tsx`
- Verification script: `backend/src/scripts/verify-dod.ts` (TypeScript) or `backend/scripts/verify-definition-of-done.js` (Node.js)



