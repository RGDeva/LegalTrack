# Get Railway URL - 3 Ways

## ✅ Backend Deployed Successfully!
Your backend is running on Railway.

---

## �� Method 1: Railway Dashboard (Easiest)

1. Go to: https://railway.com/project/f42f9123-6617-42b9-b17b-08dcb4656a9a
   (This is your project URL from the deployment output)

2. Click on your service (backend)

3. Go to **Settings** tab

4. Scroll to **Networking** section

5. Click **Generate Domain**

6. Your URL will be: `https://legaltrack-production.up.railway.app` (or similar)

---

## 🔍 Method 2: Railway CLI

```bash
cd /Users/rishig/Downloads/praxis-plus-main/backend
railway status
```

This will show your deployment URL.

---

## 🔍 Method 3: Check Service Settings

```bash
railway open
```

This opens your Railway dashboard in the browser.

---

## ⚠️ IMPORTANT: Add Environment Variables

Your environment variables failed to set via CLI. You need to add them via the Railway Dashboard:

### Steps:
1. Go to: https://railway.com/project/f42f9123-6617-42b9-b17b-08dcb4656a9a
2. Click on your backend service
3. Go to **Variables** tab
4. Add these variables:

```
DATABASE_URL = your_neon_postgres_url
JWT_SECRET = your_jwt_secret_key
JWT_EXPIRES_IN = 7d
GOOGLE_CLIENT_ID = your_google_client_id
GOOGLE_CLIENT_SECRET = your_google_client_secret
ADMIN_EMAIL = dylan.barrett@embeddedcounsel.com
ADMIN_PASSWORD = your_secure_password
PORT = 3001
```

5. Click **Deploy** to restart with new variables

---

## 🔄 After Getting Railway URL:

### Update Frontend:
```bash
cd /Users/rishig/Downloads/praxis-plus-main

# Update .env.production with your Railway URL
echo "VITE_API_URL=https://your-railway-url.railway.app/api" > .env.production

# Redeploy to Vercel
vercel --prod
```

### Update CORS in Backend:
Edit `backend/src/server.js` and add your Vercel domain to CORS, then redeploy.

---

## 🧪 Test Backend:

Once you have the URL, test it:
```bash
curl https://your-railway-url.railway.app/health
```

Should return: `{"status":"ok","timestamp":"..."}`

---

**Go to the Railway dashboard link above to get your URL and add environment variables!**
