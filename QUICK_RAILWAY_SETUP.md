# Quick Railway Variables Setup

## The .env.production file is for FRONTEND only
That file tells your React app where to find the backend API.

## Backend variables go in RAILWAY (not a file)

You need to add backend environment variables to Railway using one of these methods:

---

## Method 1: Railway CLI (Copy/Paste These)

```bash
cd /Users/rishig/Downloads/praxis-plus-main/backend

# Replace the values with your actual credentials, then run:

railway variables --set "DATABASE_URL=postgresql://user:pass@host/db"
railway variables --set "JWT_SECRET=your_random_32_char_secret_key_here"
railway variables --set "JWT_EXPIRES_IN=7d"
railway variables --set "ADMIN_EMAIL=dylan.barrett@embeddedcounsel.com"
railway variables --set "ADMIN_PASSWORD=YourSecurePassword123"
railway variables --set "PORT=3001"
```

---

## Method 2: Railway Dashboard

1. Go to: https://railway.com/project/f42f9123-6617-42b9-b17b-08dcb4656a9a

2. Click on your service (the card that shows your backend)

3. Click the **Variables** tab (top navigation)

4. Click **+ New Variable**

5. Add each variable:
   - Name: `DATABASE_URL`
   - Value: Your Neon Postgres URL
   - Click Add

6. Repeat for all variables

---

## What You Need:

### DATABASE_URL
Your Neon Postgres connection string. Format:
```
postgresql://username:password@host/database?sslmode=require
```

### JWT_SECRET
A random string (at least 32 characters). Generate one:
```bash
openssl rand -base64 32
```

### ADMIN_PASSWORD
A secure password for logging in

---

## After Adding Variables:

Railway will automatically redeploy your backend with the new variables.

Then deploy frontend:
```bash
cd /Users/rishig/Downloads/praxis-plus-main
vercel --prod
```

---

**The variables don't go in a file - they go in Railway's dashboard or via CLI commands above!**
