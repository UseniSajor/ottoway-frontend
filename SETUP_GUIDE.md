# Kealee Platform v2 - Setup Guide

## A) FILES CREATED/MODIFIED

### Root
- `package.json` - Monorepo workspace configuration
- `README.md` - Comprehensive documentation
- `SETUP_GUIDE.md` - This file

### Frontend (`/frontend`)
- `package.json` - Frontend dependencies
- `vite.config.ts` - Vite configuration
- `tsconfig.json`, `tsconfig.node.json` - TypeScript configuration
- `index.html` - HTML entry point
- `vercel.json` - Vercel deployment configuration
- `.gitignore` - Frontend gitignore
- `.env.example` - Frontend environment template

**Source Files (`/frontend/src`):**
- `main.tsx` - React entry point
- `index.css` - CSS entry (imports App.css)
- `App.tsx` - Main app component with routing
- `App.css` - Design tokens and global styles
- `types/index.ts` - TypeScript type definitions
- `lib/api.ts` - Typed API client
- `contexts/AuthContext.tsx` - Authentication context
- `contexts/NotificationContext.tsx` - Notification context
- `components/auth/ProtectedRoute.tsx` - Route protection component
- `components/layout/AppShell.tsx` - App shell layout component
- `components/layout/AppShell.css` - App shell styles
- `pages/auth/LoginPage.tsx` - Login page
- `pages/auth/RegisterPage.tsx` - Registration page
- `pages/auth/AuthPages.css` - Auth page styles
- `pages/dashboard/OwnerDashboard.tsx` - Owner dashboard
- `pages/dashboard/PMDashboard.tsx` - PM dashboard
- `pages/dashboard/ContractorDashboard.tsx` - Contractor dashboard
- `pages/dashboard/AdminDashboard.tsx` - Admin dashboard
- `pages/dashboard/MLDashboard.tsx` - ML dashboard
- `pages/dashboard/DashboardPages.css` - Dashboard styles
- `portals/owner/OwnerPortal.tsx` - Owner portal router
- `portals/pm/PMPortal.tsx` - PM portal router
- `portals/contractor/ContractorPortal.tsx` - Contractor portal router
- `portals/admin/AdminPortal.tsx` - Admin portal router
- `portals/ml/MLPortal.tsx` - ML portal router

### Backend (`/backend`)
- `package.json` - Backend dependencies
- `tsconfig.json` - TypeScript configuration
- `railway.json` - Railway deployment configuration
- `.gitignore` - Backend gitignore
- `.env.example` - Backend environment template

**Source Files (`/backend/src`):**
- `index.ts` - Express server entry point
- `middleware/auth.ts` - Authentication and RBAC middleware
- `routes/auth.ts` - Authentication routes
- `routes/properties.ts` - Properties CRUD routes
- `routes/projectTypes.ts` - Project types routes
- `routes/events.ts` - Events routes
- `routes/projects.ts` - Project-specific routes (events, recommendations, scores, classify-type, assess-complexity)
- `routes/recommendations.ts` - Recommendations routes

**Database (`/backend/prisma`):**
- `schema.prisma` - Complete Prisma schema with all entities from MASTER_SPEC.md

### Shared (`/shared`)
- `package.json` - Shared package configuration
- `tsconfig.json` - TypeScript configuration
- `src/index.ts` - Shared types/utilities (placeholder)

## B) WINDOWS COMMANDS TO RUN LOCALLY

### Initial Setup (PowerShell)

```powershell
# 1. Install dependencies
npm install

# 2. Set up backend environment
cd backend
copy .env.example .env
# Edit .env with your database credentials

# 3. Set up frontend environment
cd ..\frontend
copy .env.example .env
# Edit .env with API base URL (default: http://localhost:5000/api)

# 4. Create and migrate database
cd ..\backend
npx prisma migrate dev --name init
npx prisma generate

# 5. Return to root
cd ..
```

### Running Development Servers

**Option 1: Run both from root (recommended)**
```powershell
npm run dev
```

**Option 2: Run separately in two terminals**

Terminal 1 (Backend):
```powershell
cd backend
npm run dev
```

Terminal 2 (Frontend):
```powershell
cd frontend
npm run dev
```

### Database Management

```powershell
# Generate Prisma client
cd backend
npx prisma generate

# Run migrations (dev)
npx prisma migrate dev

# Open Prisma Studio (database GUI)
npx prisma studio
```

## C) WHAT I SHOULD SEE IN BROWSER

### After Running `npm run dev`:

1. **Frontend**: http://localhost:3000
   - Should show login page
   - Can register a new account
   - After login, redirects to appropriate portal based on role

2. **Backend Health Check**: http://localhost:5000/health
   - Should return: `{"status":"ok","timestamp":"..."}`

3. **API Base**: http://localhost:5000/api
   - All API endpoints are under `/api/*`

### Portal Routes (after login):
- **Owner Portal**: http://localhost:3000/owner/dashboard
- **PM Portal**: http://localhost:3000/pm/dashboard
- **Contractor Portal**: http://localhost:3000/contractor/dashboard
- **Admin Portal**: http://localhost:3000/admin/dashboard
- **ML Portal**: http://localhost:3000/ml/dashboard (Admin/Operator only)

### Expected Behavior:
- Login page displays with Kealee branding
- Registration form includes role selection
- After login, user is redirected to their role's portal
- AppShell shows sidebar navigation and header
- Dashboard pages show placeholder content with TODO notes
- Protected routes redirect unauthorized users

## D) KNOWN LIMITATIONS

### Implementation Status:
1. ✅ **Complete**: Monorepo structure, routing, authentication, basic CRUD
2. ⚠️ **Stubbed**: ML classification and complexity assessment (return default values)
3. ⚠️ **Placeholder**: Many portal pages show "TODO" placeholders
4. ⚠️ **Not Implemented**:
   - Permit submission blocking logic (server-side enforcement)
   - Escrow release verification workflow
   - Contractor invite system
   - Stripe Connect integration
   - File upload/storage
   - Real-time notifications (WebSocket/SSE)
   - Subcontractor UI visibility logic (MAJOR complexity only)

### Assumptions Made:
1. JWT tokens expire after 7 days
2. All API responses follow `{ data: T, message?: string }` format
3. Frontend uses App.css design tokens for all styling
4. Database uses Prisma with PostgreSQL
5. Local dev uses port 5000 (backend) and 3000 (frontend)
6. Railway provides PORT environment variable automatically
7. Vercel frontend connects to Railway backend via environment variable

### Next Steps for Full Implementation:
1. Implement ML classification using Anthropic Claude
2. Add permit submission blocking middleware
3. Implement escrow release verification workflow
4. Build contractor invite system
5. Integrate Stripe Connect for payments
6. Add file upload with S3-compatible storage
7. Implement WebSocket/SSE for real-time notifications
8. Complete all portal page implementations
9. Add comprehensive error handling and validation
10. Implement audit logging for sensitive operations

## Troubleshooting

### Database Connection Issues:
- Ensure PostgreSQL is running
- Check DATABASE_URL in `backend/.env`
- Verify database exists: `createdb kealee_dev` (if needed)

### Port Already in Use:
- Change PORT in `backend/.env` or frontend port in `vite.config.ts`

### Prisma Errors:
- Run `npx prisma generate` after schema changes
- Run `npx prisma migrate dev` to apply migrations

### CORS Errors:
- Ensure CORS_ORIGIN in `backend/.env` matches frontend URL
- Default: `http://localhost:3000`

### Module Not Found:
- Run `npm install` in root and each workspace
- Ensure all dependencies are installed



