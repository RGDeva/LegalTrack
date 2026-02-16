# Railway Deployment Fix Guide

## Issue: Railway Build Failed

Your Railway deployment crashed because of missing files in the Docker build and missing environment variables.

## ✅ Fixes Applied

### 1. Updated Dockerfile
- Added `apply-invite-migration.js` to Docker build
- Added `scripts/` directory to Docker build
- These files are required for the build process

### 2. Required Environment Variables for Railway

Go to your Railway dashboard and add these environment variables:

**Critical - Required for App to Start:**
```bash
DATABASE_URL=postgresql://your-neon-db-url
JWT_SECRET=your-jwt-secret
PORT=8080
```

**OpenAI Integration (New):**
```bash
OPENAI_API_KEY=sk-proj-your-openai-api-key-here
```

**Mail Provider (New):**
```bash
MAIL_PROVIDER=resend
RESEND_API_KEY=re_your-resend-api-key-here
UNOSEND_API_KEY=un_your-unosend-api-key-here
EMAIL_FROM=onboarding@resend.dev
```

**Note:** Use your actual API keys from your local `.env` file when adding to Railway.

**Optional (if you use these features):**
```bash
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account-email
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=your-private-key
GOOGLE_DRIVE_FOLDER_ID=your-folder-id
FRONTEND_URL=https://legal-track-nine.vercel.app
```

## 🚀 Steps to Fix Railway Deployment

### Step 1: Commit and Push Dockerfile Fix

```bash
cd /Users/rishig/Downloads/praxis-plus-main
git add backend/Dockerfile
git commit -m "fix: Add missing files to Dockerfile for Railway deployment"
git push origin main
```

### Step 2: Add Environment Variables to Railway

1. Go to https://railway.app/dashboard
2. Select your LegalTrack backend project
3. Click on **Variables** tab
4. Add all the environment variables listed above
5. Click **Deploy** or wait for auto-deploy

### Step 3: Monitor Deployment

Watch the Railway logs for:
```
✅ OpenAI API key configured - Enhanced AI mode enabled
✅ Mail provider: Resend (configured)
🚀 LegalTrack API running on port 8080
```

### Step 4: Verify Deployment

Test your backend:
```bash
curl https://your-railway-url.railway.app/health
```

Should return:
```json
{"status":"ok"}
```

## Common Railway Errors and Solutions

### Error: "Missing DATABASE_URL"
**Solution:** Add `DATABASE_URL` environment variable in Railway dashboard

### Error: "Cannot find module 'openai'"
**Solution:** Railway will auto-install from package.json - just redeploy

### Error: "OPENAI_API_KEY is not configured"
**Solution:** This is just a warning - app will work with rule-based AI parser

### Error: "Resend provider error"
**Solution:** Add `RESEND_API_KEY` or set `MAIL_PROVIDER=resend` in Railway

### Error: "Build failed - apply-invite-migration.js not found"
**Solution:** Already fixed in updated Dockerfile - push changes and redeploy

## Deployment Checklist

- [ ] Dockerfile updated (done automatically)
- [ ] Changes committed to Git
- [ ] Changes pushed to GitHub
- [ ] Environment variables added to Railway
- [ ] Railway redeployed
- [ ] Backend health check passes
- [ ] OpenAI integration working
- [ ] Mail provider configured

## Testing After Fix

### 1. Check Railway Logs
```
Railway Dashboard → Your Project → Deployments → View Logs
```

Look for:
- ✅ No build errors
- ✅ Server started successfully
- ✅ OpenAI and mail provider configured

### 2. Test Backend API
```bash
# Health check
curl https://your-railway-url.railway.app/health

# Test AI endpoint (requires auth token)
curl -X POST https://your-railway-url.railway.app/api/ai/actions-openai \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Log 2 hours for client call"}'
```

### 3. Test from Frontend
1. Go to https://legal-track-nine.vercel.app
2. Login
3. Open AI Assistant
4. Try: "I spent 2 hours on a client meeting"
5. Should see natural language understanding

## Why Did It Fail?

### Root Causes:
1. **Missing files in Dockerfile:**
   - `apply-invite-migration.js` wasn't copied
   - `scripts/` directory wasn't copied
   - Railway build couldn't complete

2. **Missing environment variables:**
   - `OPENAI_API_KEY` not set (app can run without it, but feature won't work)
   - `RESEND_API_KEY` not set (emails won't send)
   - Other required vars might be missing

### What We Fixed:
- ✅ Updated Dockerfile to include all required files
- ✅ Created this guide for environment variable setup
- ✅ Provided clear deployment steps

## Next Steps

1. **Commit the Dockerfile fix** (see Step 1 above)
2. **Add environment variables to Railway** (see Step 2 above)
3. **Wait for Railway to redeploy** (automatic after push)
4. **Test the deployment** (see Testing section above)

## Support

If you still have issues:
1. Check Railway logs for specific error messages
2. Verify all environment variables are set correctly
3. Ensure your DATABASE_URL is accessible from Railway
4. Check that your Neon database is not paused

---

**The Dockerfile has been fixed. Now commit, push, and add environment variables to Railway!**
