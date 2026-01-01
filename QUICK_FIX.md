# Quick Fix: Neither Frontend nor Backend Loading

## Step-by-Step Fix

### Step 1: Stop All Running Processes

**In PowerShell:**
```powershell
# Kill any processes on ports 3000 and 5000
netstat -ano | findstr :3000
netstat -ano | findstr :5000
# If you see processes, kill them:
# taskkill /PID <PID> /F
```

### Step 2: Verify Backend .env File

**Check if backend/.env exists:**
```powershell
cd backend
Test-Path .env
```

**If .env doesn't exist, create it:**
```powershell
cd backend
@"
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kealee_dev?schema=public"
JWT_SECRET="your-secret-key-minimum-32-characters-long-change-this"
CORS_ORIGIN="http://localhost:3000"
PORT=5000
NODE_ENV="development"
"@ | Out-File -FilePath .env -Encoding utf8
```

**⚠️ IMPORTANT:** Update DATABASE_URL with your actual PostgreSQL credentials!

### Step 3: Verify Frontend .env File

**Check if frontend/.env exists:**
```powershell
cd frontend
Test-Path .env
```

**If .env doesn't exist, create it:**
```powershell
cd frontend
@"
VITE_API_BASE_URL=http://localhost:5000/api
"@ | Out-File -FilePath .env -Encoding utf8
```

### Step 4: Install Dependencies (if needed)

```powershell
# Backend
cd backend
npm install

# Frontend
cd ..\frontend
npm install
```

### Step 5: Generate Prisma Client

```powershell
cd backend
npx prisma generate
```

### Step 6: Start Backend First

**Terminal 1:**
```powershell
cd backend
npm run dev
```

**Wait for:**
```
✅ Environment validation passed
   NODE_ENV: development
   CORS_ORIGIN: http://localhost:3000
   PORT: 5000

[timestamp] [INFO] Server started
```

**If you see errors:**
- Share the exact error message
- Common: missing .env, database connection error, port in use

### Step 7: Test Backend

**In browser or new PowerShell:**
```powershell
curl http://localhost:5000/health
```

**Should return:**
```json
{"status":"ok","timestamp":"..."}
```

### Step 8: Start Frontend

**Terminal 2 (new terminal):**
```powershell
cd frontend
npm run dev
```

**Wait for:**
```
VITE v5.0.8  ready in XXX ms

  ➜  Local:   http://localhost:3000/
```

### Step 9: Test Frontend

**Open browser:**
- Go to: `http://localhost:3000/`
- Should see login page

## Common Issues & Fixes

### Backend: "Environment validation failed"
- **Fix:** Check backend/.env exists and has all required variables
- **Required:** DATABASE_URL, JWT_SECRET (32+ chars), CORS_ORIGIN, PORT

### Backend: "Cannot find module '@prisma/client'"
- **Fix:** 
  ```powershell
  cd backend
  npx prisma generate
  npm install
  ```

### Backend: "ECONNREFUSED" (database)
- **Fix:** 
  1. Start PostgreSQL service
  2. Verify DATABASE_URL in .env is correct
  3. Test: `psql -U postgres -d kealee_dev`

### Frontend: "Cannot find module"
- **Fix:**
  ```powershell
  cd frontend
  npm install
  ```

### Frontend: "Port 3000 already in use"
- **Fix:** Vite will auto-use next port (3001, 3002, etc.)
- Check terminal for actual port number

### Both: Nothing happens when running `npm run dev`
- **Fix:** Check for syntax errors:
  ```powershell
  # Backend
  cd backend
  npm run build
  
  # Frontend
  cd frontend
  npm run build
  ```

## Still Not Working?

**Share:**
1. Exact error messages from both terminals
2. Output of `npm run dev` for both frontend and backend
3. Whether backend/.env and frontend/.env exist



