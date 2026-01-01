# Backend "Page Unavailable" Troubleshooting

## Quick Diagnostic Steps

### Step 1: Check if Backend is Running

**In PowerShell (backend directory):**
```powershell
cd backend
npm run dev
```

**What you should see:**
```
✅ Environment validation passed
   NODE_ENV: development
   CORS_ORIGIN: http://localhost:3000
   PORT: 5000

[timestamp] [INFO] Server started { port: '5000', nodeEnv: 'development', corsOrigin: 'http://localhost:3000' }
```

**If you see errors:**
- Note the exact error message
- Common errors listed below

### Step 2: Check Environment Variables

**Verify `backend/.env` exists and has:**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/kealee_dev?schema=public"
JWT_SECRET="your-secret-key-minimum-32-characters-long"
CORS_ORIGIN="http://localhost:3000"
PORT=5000
NODE_ENV="development"
```

**If .env is missing:**
```powershell
cd backend
# Create .env file with the above content
```

### Step 3: Test Backend Health Endpoint

**In PowerShell (new terminal):**
```powershell
curl http://localhost:5000/health
```

**Expected response:**
```json
{"status":"ok","timestamp":"2024-..."}
```

**If connection refused:**
- Backend is not running
- Start it with `npm run dev` in backend directory

### Step 4: Check Database Connection

**Verify PostgreSQL is running:**
```powershell
# Check if PostgreSQL service is running
Get-Service -Name postgresql*
```

**If database connection fails:**
- Start PostgreSQL service
- Verify DATABASE_URL in .env is correct
- Check database exists

### Step 5: Check Port 5000

**Check if port 5000 is in use:**
```powershell
netstat -ano | findstr :5000
```

**If port is in use:**
- Kill the process using port 5000, OR
- Change PORT in .env to a different port (e.g., 5001)
- Update frontend API_BASE_URL if you change port

## Common Error Messages

### "❌ Environment validation failed"
**Cause:** Missing or invalid environment variables

**Fix:**
1. Check `backend/.env` exists
2. Verify all required variables are set:
   - DATABASE_URL
   - JWT_SECRET (min 32 characters)
   - CORS_ORIGIN (valid URL)
3. Check for typos in variable names

### "Cannot find module"
**Cause:** Missing dependencies

**Fix:**
```powershell
cd backend
npm install
```

### "ECONNREFUSED" or "Connection refused"
**Cause:** Database not running or wrong DATABASE_URL

**Fix:**
1. Start PostgreSQL
2. Verify DATABASE_URL is correct
3. Test connection: `psql -U user -d kealee_dev`

### "Port 5000 is already in use"
**Cause:** Another process using port 5000

**Fix:**
```powershell
# Find process
netstat -ano | findstr :5000

# Kill process (replace PID)
taskkill /PID <PID> /F
```

### "Prisma Client not generated"
**Cause:** Prisma client not generated

**Fix:**
```powershell
cd backend
npx prisma generate
```

## Verify Backend is Working

**1. Health Check:**
```powershell
curl http://localhost:5000/health
```

**2. Test API Endpoint:**
```powershell
curl http://localhost:5000/api/project-types
```

**3. Check Browser:**
- Open: `http://localhost:5000/health`
- Should see: `{"status":"ok","timestamp":"..."}`

## Frontend Can't Reach Backend

**If frontend shows "page unavailable" when calling API:**

1. **Verify backend is running** (see Step 1)
2. **Check CORS configuration:**
   - Backend CORS_ORIGIN should be `http://localhost:3000`
   - Frontend API_BASE_URL should be `http://localhost:5000/api`
3. **Check browser console (F12):**
   - Look for CORS errors
   - Look for network errors
4. **Test API directly:**
   - Open `http://localhost:5000/health` in browser
   - If this works, backend is running
   - If this fails, backend is not running

## Still Not Working?

**Check backend terminal for:**
- Error messages
- Stack traces
- Environment validation messages

**Share the exact error message** and I can help fix it!



