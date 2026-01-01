# Troubleshooting: "This site can't be reached"

## Step 1: Check if Vite is actually running

**In PowerShell:**
```powershell
cd frontend
npm run dev
```

**What you should see:**
```
VITE v5.0.8  ready in XXX ms

  ➜  Local:   http://localhost:3000/
```

**If you see errors instead:**
- Check the error message
- Common issues: missing dependencies, port already in use, syntax errors

## Step 2: Check if port 3000 is in use

**In PowerShell (new terminal):**
```powershell
netstat -ano | findstr :3000
```

**If port is in use:**
- Kill the process using that port, OR
- Vite will automatically try port 3001, 3002, etc. (check the terminal output)

## Step 3: Verify dependencies are installed

```powershell
cd frontend
npm install
```

**Check for errors during install**

## Step 4: Check for build/compilation errors

```powershell
cd frontend
npm run build
```

**If build fails:**
- Fix any TypeScript errors
- Fix any missing imports

## Step 5: Try a different port

**Edit `frontend/vite.config.ts`:**
```typescript
server: {
  port: 3001,  // Change from 3000 to 3001
  // ...
}
```

**Then restart:**
```powershell
npm run dev
```

## Step 6: Check Windows Firewall

**If firewall is blocking:**
1. Windows Security → Firewall & network protection
2. Allow an app through firewall
3. Add Node.js or allow port 3000

## Step 7: Verify the URL

**Make sure you're using:**
- `http://localhost:3000/` (not https)
- Check the exact port shown in terminal (might be 3001, 3002, etc.)

## Step 8: Check browser console

**Open browser DevTools (F12):**
- Check Console tab for errors
- Check Network tab to see if requests are being made

## Step 9: Clear browser cache

**Try:**
- Hard refresh: `Ctrl + Shift + R`
- Or use incognito/private mode

## Step 10: Check if files exist

**Verify these files exist:**
- `frontend/index.html`
- `frontend/src/main.tsx`
- `frontend/src/App.tsx`

## Common Error Messages

### "Cannot find module"
```powershell
cd frontend
npm install
```

### "Port 3000 is already in use"
- Kill the process using port 3000, OR
- Use a different port in vite.config.ts

### "EADDRINUSE"
- Port conflict - use different port or kill existing process

### "Cannot GET /"
- Check that `index.html` exists in `frontend/` directory
- Check that `main.tsx` is correctly referenced in `index.html`



