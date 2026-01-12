# Deploy via Vercel Dashboard (Easiest Method)

## Step-by-Step Guide:

### 1. Push Your Code to GitHub (if not already done)
```bash
cd /Users/rishig/Downloads/praxis-plus-main
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Go to Vercel Dashboard
Open: https://vercel.com/new

### 3. Import Your GitHub Repository
- Click "Import Project" or "Add New Project"
- Select "Import Git Repository"
- Choose your GitHub repo: **LegalTrack**
- Click "Import"

### 4. Configure Project Settings
Vercel will auto-detect Vite. Configure:

**Framework Preset:** Vite (should be auto-detected)
**Root Directory:** `./` (leave as is)
**Build Command:** `npm run build` (should be auto-filled)
**Output Directory:** `dist` (should be auto-filled)

### 5. Add Environment Variable
Before clicking "Deploy", add environment variable:

- Click "Environment Variables" section
- **Name:** `VITE_API_URL`
- **Value:** `https://legaltrack-production.up.railway.app/api`
- **Environment:** Check "Production" ✓
- Click "Add"

### 6. Deploy
Click "Deploy" button

Vercel will:
- Build your app
- Deploy it
- Give you a URL like: `https://legaltrack-xxx.vercel.app`

---

## Alternative: Use Existing Build

If you don't want to connect GitHub, you can deploy the built files:

1. Build locally:
```bash
cd /Users/rishig/Downloads/praxis-plus-main
npm run build
```

2. Go to: https://vercel.com/new
3. Click "Deploy" → "Browse" → Select the `dist` folder
4. Add environment variable before deploying
5. Click "Deploy"

---

## Your Backend is Ready:

✅ Backend: https://legaltrack-production.up.railway.app
✅ Database: Connected
✅ Login: dylan.barrett@embeddedcounsel.com / LegalTrack2026!

---

**Use the Vercel Dashboard method - it's much easier than the CLI!**
