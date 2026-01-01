# Verification and Quality Gates Guide

## A) FILES CHANGED

### Backward Compatibility
- `backend/src/migrations/backward-compatibility.ts` - Migration script for old type flags to new enums

### Backend Tests
- `backend/src/tests/rbac.test.ts` - RBAC tests (role-based access control)
- `backend/src/tests/permit-block.test.ts` - Permit blocking rule tests
- `backend/src/tests/escrow-approval.test.ts` - Escrow approval tests
- `backend/jest.config.js` - Jest configuration for backend

### Frontend Tests
- `frontend/src/tests/smoke.test.tsx` - Frontend smoke tests
- `frontend/src/tests/setup.ts` - Test setup file
- `frontend/jest.config.js` - Jest configuration for frontend

### Verification Script
- `backend/src/scripts/verify-dod.ts` - Definition of Done verification script

### Updated Package Files
- `backend/package.json` - Added test scripts and dependencies
- `frontend/package.json` - Added test scripts and dependencies

## B) WINDOWS COMMANDS TO RUN TESTS + VERIFIER

### Install Dependencies (First Time Only)

```powershell
# Backend
cd backend
npm install

# Frontend
cd ..\frontend
npm install
```

### Run Backend Tests

```powershell
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- rbac.test.ts
npm test -- permit-block.test.ts
npm test -- escrow-approval.test.ts
```

### Run Frontend Tests

```powershell
cd frontend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Run Backward Compatibility Migration

```powershell
cd backend

# Run migration script
npm run migrate:backward
```

### Run Definition of Done Verification

```powershell
cd backend

# Make sure server is running first (in another terminal: npm run dev)
# Then run verification
npm run verify

# Or with custom API URL
$env:API_BASE_URL="http://localhost:5000/api"
npm run verify
```

### Run All Tests and Verification

```powershell
# From project root
cd backend
npm test
npm run verify

cd ..\frontend
npm test
```

## C) FINAL PASS/FAIL REPORT FORMAT

The `verify-dod.ts` script outputs a formatted report like this:

```
=== Definition of Done Verification ===

Verifying 21 project types exist...
Verifying project_type is required on create...
Verifying complexity auto-suggestion...
Verifying property links to projects...
Verifying permit submission blocking...
Verifying subcontractors hidden unless MAJOR...
Verifying ML portal blocked for non-admin/operator...
Verifying event logging on key actions...
Verifying recommendations visible and labelable...

=== Verification Results ===

✓ PASS 21 Project Types Exist
  Found 21 project types

✓ PASS Project Types Grouped Correctly
  All types correctly grouped by category

✓ PASS Project Type Required on Create
  Correctly rejects projects without project_type

✓ PASS Complexity Auto-Suggestion
  Complexity auto-suggested: MAJOR

✓ PASS Property Links to Projects
  Property abc123 has 3 project(s)

✓ PASS Permit Submission Blocking
  Blocking reasons correctly returned: CONTRACT_NOT_SIGNED, DESIGN_NOT_APPROVED

✓ PASS Subcontractors Hidden Unless MAJOR
  Logic implemented: subcontractors only visible for MAJOR complexity projects

✓ PASS ML Portal Blocked for Non-Admin
  ML portal correctly blocked for non-admin users

✓ PASS ML Portal Accessible to Admin
  ML portal correctly accessible to admin users

✓ PASS Event Logging on Key Actions
  Found events for: PROJECT_CREATED, CONTRACT_CREATED, PERMIT_SUBMITTED, ...

✓ PASS Recommendations Visible
  Found 5 recommendation(s)

✓ PASS Recommendations Labelable
  Recommendation labeling works

=== Summary ===
Total: 12
Passed: 12
Failed: 0

✓ All checks passed!
```

### Example with Failures:

```
=== Verification Results ===

✓ PASS 21 Project Types Exist
  Found 21 project types

✗ FAIL Project Types Grouped Correctly
  Some types missing or incorrectly grouped

✓ PASS Project Type Required on Create
  Correctly rejects projects without project_type

✗ FAIL Complexity Auto-Suggestion
  Complexity not auto-suggested or invalid: undefined

...

=== Summary ===
Total: 12
Passed: 10
Failed: 2

✗ 2 check(s) failed
```

### Test Output Format:

**Backend Tests (Jest):**
```
PASS  src/tests/rbac.test.ts
  RBAC Tests
    ✓ should allow homeowner to access owner portal (45ms)
    ✓ should allow PM to access PM portal (32ms)
    ✓ should block non-admin from ML portal (28ms)
    ✓ should allow admin to access ML portal (31ms)

PASS  src/tests/permit-block.test.ts
  Permit Blocking Tests
    ✓ should block permit submission without contract (52ms)
    ✓ should block permit submission without approved design (48ms)
    ✓ should allow permit submission when all conditions met (61ms)

Test Suites: 3 passed, 3 total
Tests:       12 passed, 12 total
```

**Frontend Tests (Jest):**
```
PASS  src/tests/smoke.test.tsx
  Frontend Smoke Tests
    ✓ should render login page at /login (23ms)
    ✓ should render register page at /register (19ms)
    ✓ should redirect unauthenticated users to login (15ms)
    ✓ should have route protection for owner portal (12ms)

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
```

## Verification Checklist Items

The verification script checks:

1. ✅ **21 Project Types Exist** - All project types from spec are in enum
2. ✅ **Project Types Grouped Correctly** - Types are correctly categorized
3. ✅ **Project Type Required on Create** - API rejects projects without project_type
4. ✅ **Complexity Auto-Suggestion** - Complexity is auto-suggested when not provided
5. ✅ **Property Links to Projects** - Properties can have multiple projects
6. ✅ **Permit Submission Blocking** - Permits blocked without contract + design + readiness
7. ✅ **Subcontractors Hidden Unless MAJOR** - Logic implemented correctly
8. ✅ **ML Portal Blocked for Non-Admin** - Non-admin users cannot access ML portal
9. ✅ **ML Portal Accessible to Admin** - Admin users can access ML portal
10. ✅ **Event Logging on Key Actions** - Events logged for major state changes
11. ✅ **Recommendations Visible** - Recommendations API returns data
12. ✅ **Recommendations Labelable** - Recommendations can be labeled

All checks must pass for the platform to meet the Definition of Done criteria.



