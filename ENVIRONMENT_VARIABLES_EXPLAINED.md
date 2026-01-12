# Environment Variables - Where They Are

## In Windsurf/Your Computer:

### Frontend Environment Variables:
**File:** `/Users/rishig/Downloads/praxis-plus-main/.env.production`
**Contains:** 
```
VITE_API_URL=https://legaltrack-production.up.railway.app/api
```
**Purpose:** Tells your React frontend where to find the backend API
**Status:** ✅ Already created and configured

### Backend Environment Variables:
**File:** There is NO file in Windsurf for backend variables
**Why:** Backend variables contain sensitive data (database passwords, secrets)
**Where they go:** Railway hosting platform (not in your code)

---

## Backend Variables Go in Railway (Not Windsurf):

You CANNOT see backend environment variables in Windsurf because they're stored on Railway's servers.

### To Add Backend Variables:

**Option 1: Railway Dashboard**
1. Open browser: https://railway.com/project/f42f9123-6617-42b9-b17b-08dcb4656a9a
2. Click your service card
3. Click "Variables" tab
4. Add variables there

**Option 2: Railway CLI (from terminal)**
```bash
cd /Users/rishig/Downloads/praxis-plus-main/backend
railway variables --set "DATABASE_URL=your_value"
railway variables --set "JWT_SECRET=xTs4ts/WPRsugSRr4W/rcM47EAtnyOQDo5nL932Ecig="
# etc...
```

---

## Summary:

📁 **In Windsurf:**
- `.env.production` (frontend) ✅ Already exists

☁️ **In Railway (online):**
- Backend environment variables ⏳ Need to be added via Railway dashboard or CLI

---

**You won't see backend variables in Windsurf - they're stored securely on Railway's platform!**
