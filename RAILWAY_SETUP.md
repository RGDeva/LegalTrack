# Railway Backend Deployment Fix

## Issue
Backend can't connect to Neon database from Railway deployment.

## Root Cause
Railway environment variables may not be set correctly, or the DATABASE_URL needs to be updated.

## Solution Steps

### 1. Check Railway Environment Variables
1. Go to https://railway.app
2. Open your `legaltrack-production` project
3. Click on the backend service
4. Go to **Variables** tab
5. Verify these variables exist:

```
DATABASE_URL=postgresql://[username]:[password]@ep-nameless-king-ah7a487r-pooler.c-3.us-east-1.aws.neon.tech:5432/[database]?sslmode=require
JWT_SECRET=[your-secret]
PORT=3001
NODE_ENV=production
```

### 2. Get Fresh Neon Connection String
1. Go to https://console.neon.tech
2. Select your project
3. Click **Connection Details**
4. Copy the **Pooled connection** string (not direct)
5. Make sure it includes `?sslmode=require` at the end

### 3. Update Railway DATABASE_URL
1. In Railway Variables tab
2. Edit `DATABASE_URL`
3. Paste the new connection string
4. Click **Save**
5. Railway will automatically redeploy

### 4. Wake Up Neon Database (if paused)
Neon free tier pauses after inactivity. To wake it:
1. Go to Neon console
2. Click on your database
3. If it says "Paused", click to resume
4. Or just make a query - it will auto-resume

### 5. Verify Deployment
After Railway redeploys:
1. Check logs: `railway logs` or in Railway dashboard
2. Look for "Database connected" or Prisma connection logs
3. Test endpoint: `curl https://legaltrack-production.up.railway.app/api/cases`

## Quick Fix Command
If you have Railway CLI installed:

```bash
cd backend
railway link
railway variables set DATABASE_URL="your-new-connection-string"
railway up
```

## Test Backend Locally First
```bash
cd backend
node test-db-connection.js
```

If this works, the issue is Railway-specific.

## Common Issues

### Issue: "Can't reach database server"
**Solution:** Database is paused or connection string is wrong
- Check Neon dashboard for database status
- Verify connection string format
- Ensure using pooled connection (not direct)

### Issue: "SSL required"
**Solution:** Add `?sslmode=require` to connection string
```
DATABASE_URL=postgresql://...?sslmode=require
```

### Issue: "Password authentication failed"
**Solution:** Regenerate database password in Neon
- Go to Neon console
- Reset password
- Update Railway variable

### Issue: "Too many connections"
**Solution:** Use pooled connection string
- In Neon, copy "Pooled connection" not "Direct connection"
- Pooled uses port 5432 with `-pooler` in hostname

## After Fixing
1. Test login: https://legaltrack.vercel.app
2. Check browser console for 401 errors
3. Verify API calls succeed
4. Check Recent Activity loads data

## Need Help?
If still not working:
1. Share Railway deployment logs
2. Share Neon database status
3. Verify connection string format (without exposing password)
