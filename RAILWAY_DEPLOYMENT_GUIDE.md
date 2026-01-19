# Railway Deployment Troubleshooting

## Current Issue: 502 Application Failed to Respond

The backend is returning 502 errors, which means Railway cannot start the application.

## Possible Causes & Solutions

### 1. Railway Root Directory Configuration

**Problem:** Railway might be trying to deploy from the wrong directory.

**Solution:**
1. Go to Railway dashboard → Your backend service
2. Click **Settings** tab
3. Find **Root Directory** setting
4. Set it to: `backend`
5. Click **Save**
6. Railway will automatically redeploy

### 2. Missing Environment Variables

**Required Variables:**
```
DATABASE_URL=postgresql://username:password@your-neon-endpoint.neon.tech/dbname?sslmode=require
JWT_SECRET=your-jwt-secret-here
PORT=3001
NODE_ENV=production
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**Note:** Get actual values from Neon console and Google Cloud Console.

### 3. Check Deployment Logs

1. Go to Railway dashboard → Your backend service
2. Click **Deployments** tab
3. Click on the latest deployment
4. Check the **Build Logs** and **Deploy Logs**
5. Look for errors like:
   - `Cannot find module`
   - `Prisma generate failed`
   - `Database connection failed`
   - `Port already in use`

### 4. Manual Redeploy

If Railway hasn't picked up the latest changes:
1. Go to Railway dashboard → Your backend service
2. Click **Deployments** tab
3. Click **Deploy** button (top right)
4. Select the latest commit
5. Click **Deploy**

### 5. Check Service Configuration

In Railway dashboard → Backend service → **Settings**:
- **Start Command:** Should be `node src/server.js` or `npm start`
- **Healthcheck Path:** `/health`
- **Port:** Should auto-detect from `PORT` env var

### 6. Verify GitHub Connection

1. Railway dashboard → Project Settings
2. Check **GitHub Repo** is connected
3. Verify **Branch** is correct (probably `main` or `feature/code-quality-improvements`)
4. Check **Auto-Deploy** is enabled

## Testing After Fix

Once Railway shows "Deployed" status:

```bash
# Test health endpoint
curl https://legaltrack-production.up.railway.app/health

# Should return: {"status":"ok","timestamp":"..."}

# Test login endpoint
curl -X POST https://legaltrack-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'

# Should return: {"error":"Invalid credentials"} (not 502)
```

## Common Railway Issues

### Issue: "Cannot find module 'express'"
**Solution:** 
- Check `package.json` is in the root directory Railway is deploying from
- Verify `npm install` ran successfully in build logs

### Issue: "Prisma Client not generated"
**Solution:**
- Add `npx prisma generate` to build commands
- Check `schema.prisma` file exists
- Verify `@prisma/client` is in dependencies

### Issue: "Port 3001 already in use"
**Solution:**
- Railway assigns a random port via `PORT` env var
- Make sure your code uses `process.env.PORT`
- Our code already does this: `const PORT = process.env.PORT || 3001;`

### Issue: "Database connection timeout"
**Solution:**
- Verify `DATABASE_URL` is set correctly
- Check Neon database is active (not paused)
- Ensure connection string includes `?sslmode=require`

## Next Steps

1. **Check Railway Root Directory** - Most likely issue
2. **Review deployment logs** - Will show exact error
3. **Verify all environment variables are set**
4. **Try manual redeploy**
5. **Share deployment logs if still failing**
