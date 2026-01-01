# Remove Demo Data & Activate All Features

Complete guide to clean up the frontend and connect everything to the real API.

═══════════════════════════════════════════════════════════════════════════════
PHASE 1: REMOVE DEMO DATA
═══════════════════════════════════════════════════════════════════════════════

## Run Cleanup Script

**Windows (PowerShell):**
```powershell
cd frontend
.\cleanup-demo-data.ps1
```

**Unix/Linux/Mac:**
```bash
cd frontend
# Create bash version or use PowerShell script
```

The script will:
- ✅ Remove all MOCK_, DEMO_, SAMPLE_, FAKE_ constants
- ✅ Replace hardcoded useState arrays with empty arrays
- ✅ Remove PROJECT_TYPES and SAMPLE_PROJECTS arrays
- ✅ Clean all demo data from components

**Manual cleanup (if script doesn't catch everything):**

Search for and remove:
- `const MOCK_* = [...]`
- `const DEMO_* = [...]`
- `const SAMPLE_* = [...]`
- Hardcoded data arrays in useState

═══════════════════════════════════════════════════════════════════════════════
PHASE 2: ACTIVATE ALL NAVIGATION
═══════════════════════════════════════════════════════════════════════════════

## Run Navigation Fix Script

```bash
cd frontend
node fix-all-navigation.js
```

The script will:
- ✅ Add `useNavigate` import where needed
- ✅ Add `navigate` hook in components
- ✅ Add onClick handlers to buttons without navigation
- ✅ Make cards clickable with proper routes

**Manual fixes for key pages:**

### Owner Dashboard
- Make stat cards clickable
- Activate all quick action buttons
- Connect to real API for stats

### Navigation Sidebar
- Ensure all links work
- Add active state highlighting
- Fix broken routes

═══════════════════════════════════════════════════════════════════════════════
PHASE 3: CONNECT PAGES TO API
═══════════════════════════════════════════════════════════════════════════════

## Run API Connection Script

```bash
cd frontend
node connect-to-api.js
```

The script will:
- ✅ Add API imports to list pages
- ✅ Add useState and useEffect hooks
- ✅ Add loading states
- ✅ Add error handling
- ✅ Connect to real API endpoints

**Pages that will be updated:**
- ProjectsListPage ✅ (already has API)
- PropertiesPage
- ContractsListPage
- PermitsListPage
- EscrowListPage
- CloseoutListPage
- ReadinessListPage

═══════════════════════════════════════════════════════════════════════════════
PHASE 4: MANUAL FIXES FOR KEY PAGES
═══════════════════════════════════════════════════════════════════════════════

## 1. Owner Dashboard

**File:** `frontend/src/pages/dashboard/OwnerDashboard.tsx` (or similar)

**Updates needed:**
- Connect stats to real API
- Make stat cards clickable
- Activate quick action buttons
- Remove any demo data

**Example implementation:**
```typescript
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    activeProjects: 0,
    pendingActions: 0,
    upcomingMilestones: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const projects = await api.projects.list();
      setStats({
        activeProjects: projects.length,
        pendingActions: 0, // Calculate from projects
        upcomingMilestones: 0, // Calculate from projects
      });
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Owner Dashboard</h1>

      {/* Stats Cards - Clickable */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div 
          onClick={() => navigate('/owner/projects')}
          className="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-xl transition"
        >
          <h3 className="text-gray-600 text-sm mb-2">Active Projects</h3>
          <p className="text-4xl font-bold text-blue-600">{stats.activeProjects}</p>
        </div>

        <div 
          onClick={() => navigate('/owner/contracts')}
          className="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-xl transition"
        >
          <h3 className="text-gray-600 text-sm mb-2">Pending Actions</h3>
          <p className="text-4xl font-bold text-orange-600">{stats.pendingActions}</p>
        </div>

        <div 
          onClick={() => navigate('/owner/milestones')}
          className="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-xl transition"
        >
          <h3 className="text-gray-600 text-sm mb-2">Upcoming Milestones</h3>
          <p className="text-4xl font-bold text-green-600">{stats.upcomingMilestones}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/owner/projects/new')}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            New Project
          </button>
          <button
            onClick={() => navigate('/owner/contracts')}
            className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Review Contracts
          </button>
          <button
            onClick={() => navigate('/owner/escrow')}
            className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Manage Escrow
          </button>
          <button
            onClick={() => navigate('/owner/permits')}
            className="px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
          >
            Track Permits
          </button>
        </div>
      </div>
    </div>
  );
}
```

## 2. Projects List Page

**File:** `frontend/src/pages/owner/ProjectsListPage.tsx`

**Status:** ✅ Already has API integration!

**Verify it's working:**
- Check that it calls `api.projects.list()`
- Verify loading states work
- Ensure error handling is in place
- Make sure cards are clickable

═══════════════════════════════════════════════════════════════════════════════
PHASE 5: TEST LOCALLY
═══════════════════════════════════════════════════════════════════════════════

Before deploying, test everything locally:

```bash
cd frontend

# Start dev server
npm run dev

# Open http://localhost:5173 (or port shown)
```

**Test checklist:**
- [ ] Dashboard loads without errors
- [ ] All stat cards are clickable
- [ ] Quick action buttons navigate correctly
- [ ] Projects page shows data or empty state
- [ ] All sidebar links work
- [ ] No console errors
- [ ] No demo/hardcoded data visible
- [ ] API calls work (check Network tab)

═══════════════════════════════════════════════════════════════════════════════
PHASE 6: DEPLOY
═══════════════════════════════════════════════════════════════════════════════

Once everything works locally:

```bash
cd frontend

# Review changes
git status
git diff

# Commit changes
git add .
git commit -m "Remove demo data, activate navigation, connect to API"

# Push (Vercel will auto-deploy)
git push

# Or deploy manually
vercel --prod
```

**Wait 1-2 minutes for deployment, then test live site.**

═══════════════════════════════════════════════════════════════════════════════
VERIFICATION CHECKLIST
═══════════════════════════════════════════════════════════════════════════════

After deployment, test on live site:

**Frontend:** https://ottoway-frontend-o3yr.vercel.app

- [ ] Dashboard loads
- [ ] All stat cards are clickable
- [ ] All quick action buttons work
- [ ] Projects page shows empty state or real data
- [ ] Can navigate between pages
- [ ] All sidebar links work
- [ ] No console errors
- [ ] No demo/hardcoded data visible
- [ ] API calls succeed (check Network tab)
- [ ] Loading states work
- [ ] Error states work (if API fails)

═══════════════════════════════════════════════════════════════════════════════
TROUBLESHOOTING
═══════════════════════════════════════════════════════════════════════════════

**API calls failing:**
- Check `VITE_API_BASE_URL` is set in Vercel
- Verify backend is running: https://ottoway-backend-production.up.railway.app/api/health
- Check CORS is configured correctly
- Review browser console for errors

**Navigation not working:**
- Verify `useNavigate` is imported
- Check routes are defined in App.tsx
- Ensure onClick handlers are added
- Check browser console for errors

**Demo data still showing:**
- Run cleanup script again
- Manually search for MOCK_, DEMO_, SAMPLE_
- Check if data is coming from API (should be empty array initially)

**Build fails:**
- Check for TypeScript errors
- Verify all imports are correct
- Check for missing dependencies

═══════════════════════════════════════════════════════════════════════════════
QUICK REFERENCE
═══════════════════════════════════════════════════════════════════════════════

**Run all scripts:**
```bash
cd frontend

# 1. Remove demo data
.\cleanup-demo-data.ps1

# 2. Activate navigation
node fix-all-navigation.js

# 3. Connect to API
node connect-to-api.js

# 4. Test locally
npm run dev

# 5. Deploy
git add .
git commit -m "Remove demo data, activate features"
git push
```

═══════════════════════════════════════════════════════════════════════════════

**Your platform will be fully functional after these steps!** 🎉

