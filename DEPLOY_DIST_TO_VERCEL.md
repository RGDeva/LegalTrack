# Deploy Built Files to Vercel - Final Step

## ✅ Build Complete!

Your app is built and ready in the `dist` folder.

---

## 🚀 Deploy to Vercel (2 Minutes):

### Method 1: Drag & Drop (Easiest)

1. **Go to:** https://vercel.com/new

2. **Click "Deploy"** (not Import)

3. **Drag the `dist` folder** from:
   `/Users/rishig/Downloads/praxis-plus-main/dist`
   
   Or click "Browse" and select the `dist` folder

4. **Before deploying, add environment variable:**
   - Click "Environment Variables"
   - **Name:** VITE_API_URL
   - **Value:** https://legaltrack-production.up.railway.app/api
   - Click "Add"

5. **Click "Deploy"**

Done! Your app will be live in 30 seconds.

---

## Method 2: Vercel CLI

```bash
cd /Users/rishig/Downloads/praxis-plus-main
vercel deploy dist --prod
```

When asked about environment variables, add:
- VITE_API_URL = https://legaltrack-production.up.railway.app/api

---

## ✅ What's Ready:

- ✅ Backend: https://legaltrack-production.up.railway.app (LIVE)
- ✅ Database: Connected
- ✅ Frontend: Built and ready to deploy
- ✅ Login: dylan.barrett@embeddedcounsel.com / LegalTrack2026!

---

## 🧪 After Deployment:

1. Visit your Vercel URL
2. Login with credentials above
3. Test all features:
   - Dark mode toggle
   - Create case
   - Log time
   - Generate DOCX invoice

---

**Go to https://vercel.com/new and drag the `dist` folder to deploy!**
