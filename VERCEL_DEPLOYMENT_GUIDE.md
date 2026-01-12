# Vercel Deployment Guide - LegalTrack

## ✅ Logo Updated
Logo is now larger and fills the sidebar width better (h-16, w-full, object-contain).

---

## 🚀 Deploy to Vercel

### Prerequisites:
1. Vercel account (sign up at vercel.com)
2. Vercel CLI installed: `npm install -g vercel`

### Frontend Deployment Steps:

#### Option 1 - Using Vercel CLI (Recommended):
```bash
# Navigate to project root
cd /Users/rishig/Downloads/praxis-plus-main

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? legaltrack (or your choice)
# - Directory? ./
# - Override settings? No

# For production deployment:
vercel --prod
```

#### Option 2 - Using Vercel Dashboard:
1. Go to https://vercel.com/new
2. Import Git Repository or drag/drop project folder
3. Configure:
   - Framework Preset: Vite
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add Environment Variables:
   - `VITE_API_URL`: Your backend URL (see below)
5. Click "Deploy"

---

## 🔧 Backend Deployment

The backend needs to be deployed separately. Options:

### Option 1 - Railway.app (Recommended):
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Navigate to backend
cd backend

# Initialize and deploy
railway init
railway up
```

### Option 2 - Render.com:
1. Go to https://render.com
2. New → Web Service
3. Connect repository
4. Configure:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Add Environment Variables (see below)

### Option 3 - Heroku:
```bash
cd backend
heroku create legaltrack-api
git push heroku main
```

---

## 🔐 Environment Variables

### Frontend (.env):
```
VITE_API_URL=https://your-backend-url.com/api
```

### Backend (.env):
```
DATABASE_URL=your_neon_postgres_url
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
ADMIN_EMAIL=dylan.barrett@embeddedcounsel.com
ADMIN_PASSWORD=your_secure_password
FRONTEND_URL=https://your-vercel-app.vercel.app
```

---

## 📋 Pre-Deployment Checklist

### Frontend:
- ✅ vercel.json created
- ✅ Build command works: `npm run build`
- ✅ Environment variables configured
- ✅ API URL points to production backend

### Backend:
- ⏳ Choose deployment platform
- ⏳ Set up environment variables
- ⏳ Configure database connection
- ⏳ Update CORS to allow Vercel domain
- ⏳ Run database migrations

---

## 🧪 Test Deployment

After deployment:
1. Visit your Vercel URL
2. Test login functionality
3. Test dark mode toggle
4. Test time tracking
5. Test DOCX generation
6. Verify all features work

---

## 🔄 Update CORS for Production

In `backend/src/server.js`, update CORS:
```javascript
app.use(cors({
  origin: [
    'http://localhost:8080',
    'http://localhost:8081',
    'https://your-app.vercel.app', // Add your Vercel URL
    'https://*.vercel.app' // Allow all Vercel preview deployments
  ],
  credentials: true
}));
```

---

## 📊 Deployment Status

**Frontend:**
- ✅ Ready for Vercel deployment
- ✅ vercel.json configured
- ✅ Build tested locally

**Backend:**
- ⏳ Needs deployment platform selection
- ⏳ Environment variables setup
- ⏳ CORS update for production

---

## 🎯 Quick Deploy Commands

```bash
# Frontend to Vercel
cd /Users/rishig/Downloads/praxis-plus-main
vercel --prod

# Backend to Railway (example)
cd backend
railway up

# Or deploy backend to Render/Heroku as shown above
```

---

**The frontend is ready to deploy to Vercel! Choose a backend hosting platform and follow the steps above.**
