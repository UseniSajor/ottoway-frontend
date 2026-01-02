# Build Issues and Resolution Guide

## Current Status

⚠️ **IMPORTANT:** The backend currently has TypeScript compilation errors that must be resolved before production deployment.

## Backend TypeScript Errors

The backend build fails with multiple TypeScript errors related to Prisma schema mismatches. These errors indicate that the code is using field names or properties that don't match the current Prisma schema.

### Common Error Categories

1. **Schema Field Mismatches:**
   - `resource` field doesn't exist in `AuditLogCreateInput`
   - `payload` field doesn't exist in `ProjectEventCreateInput`
   - `memberships` doesn't exist in `ProjectWhereInput`
   - `version` field issues in `DesignVersion`
   - `fileUrl` missing from `DesignVersion`
   - `contractUrl` should be `contractor` in `ContractAgreement`
   - `passwordHash` should be `password` in `User`
   - `completedAt` should be `completedDate` in `Milestone`
   - `projectId` doesn't exist in `MilestoneWhereInput`
   - `trigger` field issues in `AutomationRule`
   - `modelType` field issues in `ModelScore`
   - And many more...

2. **Type Mismatches:**
   - Status enum values like `"PENDING"` not matching expected types
   - Property type mismatches (e.g., `"Test Property"` not assignable to `PropertyType`)

3. **Missing Required Fields:**
   - `ownerId` missing in `ProjectCreateInput`
   - `streetAddress` missing in `PropertyCreateInput`
   - Various required fields missing in different create inputs

## Resolution Steps

### Step 1: Regenerate Prisma Client
```bash
cd backend
npx prisma generate
```

### Step 2: Review Prisma Schema
Check `backend/prisma/schema.prisma` to understand the actual field names and types.

### Step 3: Fix Code to Match Schema
Update all code files to use the correct field names from the Prisma schema.

### Step 4: Common Fixes Needed

1. **AuditLog:**
   - Remove or rename `resource` field usage
   - Check what fields are actually available in `AuditLogCreateInput`

2. **ProjectEvent:**
   - Remove or rename `payload` field usage
   - Use correct field structure

3. **DesignVersion:**
   - Check if `version` field exists or use `versionNumber`
   - Check if `fileUrl` exists or needs to be added to schema

4. **User:**
   - Change `passwordHash` to `password` (Prisma handles hashing)

5. **Milestone:**
   - Change `completedAt` to `completedDate`
   - Remove `projectId` from where clauses (use relation instead)

6. **ContractAgreement:**
   - Change `contractUrl` to `contractor` or correct field name

### Step 5: Test Build
```bash
cd backend
npm run build
```

## Frontend Build Status

The frontend has TypeScript warnings but these are mostly:
- Unused variables/imports (non-blocking)
- Type mismatches that may not prevent runtime execution

However, some errors should be fixed:
- Missing Stripe dependencies (`@stripe/stripe-js`, `@stripe/react-stripe-js`)
- Property access errors (e.g., `project.owner` should be `project.ownerId`)

## Recommended Approach

### Option 1: Fix All Errors (Recommended for Production)
1. Fix all TypeScript errors in backend
2. Fix critical TypeScript errors in frontend
3. Test builds
4. Deploy

### Option 2: Temporary Workaround (Not Recommended)
1. Modify `tsconfig.json` to be less strict
2. Use `// @ts-ignore` comments (not recommended)
3. Deploy with warnings

## Next Steps

1. **Immediate:** Review and fix Prisma schema mismatches
2. **Short-term:** Fix all TypeScript compilation errors
3. **Before Deployment:** Ensure both builds complete successfully
4. **After Deployment:** Monitor for runtime errors

## Resources

- Prisma Schema: `backend/prisma/schema.prisma`
- TypeScript Config: `backend/tsconfig.json`
- Build Script: `backend/package.json` (build command)

---

**Last Updated:** 2026-01-01
**Status:** ⚠️ Build errors present - must be resolved before production deployment


