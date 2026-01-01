# Kealee Platform v2

Property-owner-first construction platform monorepo.

## Architecture

- **Frontend**: React + TypeScript + Vite (deployed to Vercel)
- **Backend**: Node.js + Express + TypeScript + Prisma (deployed to Railway)
- **Database**: PostgreSQL (local dev, Railway Postgres for production)

## Repository Structure

```
kealee-platform-v2/
├── frontend/          # React frontend application
├── backend/           # Express backend API
├── shared/           # Shared types and utilities (optional)
└── package.json      # Root workspace configuration
```

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL (local development)
- Windows (VS Code) development environment

## Local Development Setup

### 1. Install Dependencies

```powershell
npm install
```

### 2. Database Setup

1. Create a local PostgreSQL database:
   ```powershell
   # Using psql or your preferred PostgreSQL client
   createdb kealee_dev
   ```

2. Copy backend environment file:
   ```powershell
   cd backend
   copy .env.example .env
   ```

3. Update `backend/.env` with your database connection:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/kealee_dev?schema=public"
   JWT_SECRET="your-secret-key-change-in-production"
   PORT=5000
   CORS_ORIGIN="http://localhost:3000"
   ```

4. Run Prisma migrations:
   ```powershell
   cd backend
   npx prisma migrate dev --name init
   npx prisma generate
   ```

### 3. Frontend Setup

1. Copy frontend environment file:
   ```powershell
   cd frontend
   copy .env.example .env
   ```

2. Update `frontend/.env`:
   ```
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

### 4. Run Development Servers

**Option 1: Run both from root (recommended)**
```powershell
npm run dev
```

**Option 2: Run separately**

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

## Available Scripts

### Root
- `npm run dev` - Run both frontend and backend in development mode
- `npm run build` - Build both frontend and backend

### Backend (`/backend`)
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run Prisma migrations (dev)
- `npm run prisma:deploy` - Deploy Prisma migrations (production)
- `npm run prisma:studio` - Open Prisma Studio

### Frontend (`/frontend`)
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Deployment

### Frontend (Vercel)

1. Connect your repository to Vercel
2. Set root directory to `frontend`
3. Configure environment variable:
   - `VITE_API_BASE_URL` = Your Railway backend API URL (e.g., `https://your-app.railway.app/api`)
4. Deploy

### Backend (Railway)

1. Connect your repository to Railway
2. Set root directory to `backend`
3. Add PostgreSQL service
4. Configure environment variables:
   - `DATABASE_URL` = Railway Postgres connection string (auto-provided)
   - `JWT_SECRET` = Strong random secret
   - `PORT` = Railway will provide this automatically
   - `CORS_ORIGIN` = Your Vercel frontend URL
5. Railway will automatically:
   - Run `npm install`
   - Run `npm run build`
   - Run `npx prisma generate`
   - Run `npx prisma migrate deploy` (via startCommand in railway.json)
   - Start the server with `npm start`

## API Endpoints

### Health
- `GET /health` - Health check

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user (requires auth)

### Properties
- `GET /api/properties` - List properties (requires auth)
- `POST /api/properties` - Create property (requires auth)
- `GET /api/properties/:id` - Get property (requires auth)
- `PUT /api/properties/:id` - Update property (requires auth)
- `GET /api/properties/:id/projects` - Get property projects (requires auth)

### Project Types
- `GET /api/project-types` - List all project types
- `POST /api/projects/classify-type` - Classify project type (ML - TODO)
- `POST /api/projects/assess-complexity` - Assess complexity (ML - TODO)

### Events
- `POST /api/events` - Create project event (requires auth)
- `GET /api/projects/:id/events` - Get project events (requires auth)

### Recommendations
- `GET /api/projects/:id/recommendations` - Get project recommendations (requires auth)
- `POST /api/recommendations/:id/accept` - Accept recommendation (requires auth)
- `POST /api/recommendations/:id/label` - Label recommendation (requires auth)

### Scores
- `GET /api/projects/:id/scores` - Get project model scores (requires auth)

## Assumptions & Notes

1. **Authentication**: JWT-based authentication with 7-day token expiration
2. **RBAC**: Role-based access control enforced via middleware
3. **ML Features**: ML classification and complexity assessment endpoints are stubbed (TODO: implement with Anthropic Claude)
4. **Subcontractors**: Subcontractor management UI only visible for MAJOR complexity projects (enforced in frontend)
5. **Permit Blocking**: Server-side enforcement of permit submission blocking (requires contract signed + design approved) - TODO: implement in permit submission endpoint
6. **Escrow Releases**: Require verification + human approval - TODO: implement in escrow release endpoint
7. **Contractor Invites**: Contractors join only via invite link - TODO: implement invite system
8. **Stripe Connect**: Payment integration with Stripe Connect - TODO: implement
9. **File Storage**: Local storage for dev, S3-compatible for prod - TODO: implement
10. **Notifications**: Basic notification system implemented, real-time updates - TODO: implement WebSocket/SSE

## Known Limitations

- ML classification and complexity assessment are stubbed (return default values)
- Permit submission blocking logic not yet implemented
- Escrow release verification workflow not yet implemented
- Contractor invite system not yet implemented
- Stripe Connect integration not yet implemented
- File upload/storage not yet implemented
- Real-time notifications not yet implemented (WebSocket/SSE)
- Some portal pages are placeholders (marked with TODO)

## Development Notes

- All routes follow the structure: `/owner/*`, `/pm/*`, `/contractor/*`, `/admin/*`, `/ml/*`
- Frontend uses App.css design tokens for consistent styling
- Backend uses Prisma for database access
- All API responses follow the format: `{ data: T, message?: string }`
- Error responses: `{ message: string, code?: string }`

## License

Proprietary - Kealee Platform



