# Railway Deployment Guide - LegalTrack

## ✅ Preparation Complete
- Mock data file removed
- Railway configuration created
- GitHub repo ready: LegalTrack

---

## 🚀 Deploy Backend to Railway

### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

### Step 2: Login to Railway
```bash
railway login
```

### Step 3: Link to Your GitHub Repo
```bash
cd /Users/rishig/Downloads/praxis-plus-main/backend
railway init
```

Select:
- Link to existing project or create new
- Connect to GitHub repo: LegalTrack
- Select backend directory

### Step 4: Add Environment Variables
```bash
railway variables set DATABASE_URL="your_neon_postgres_url"
railway variables set JWT_SECRET="your_secret_key"
railway variables set JWT_EXPIRES_IN="7d"
railway variables set GOOGLE_CLIENT_ID="your_google_client_id"
railway variables set GOOGLE_CLIENT_SECRET="your_google_client_secret"
railway variables set ADMIN_EMAIL="dylan.barrett@embeddedcounsel.com"
railway variables set ADMIN_PASSWORD="your_secure_password"
railway variables set PORT="3001"
```

### Step 5: Deploy
```bash
railway up
```

Your backend will be deployed to: `https://your-app.railway.app`

---

## 🌐 Deploy Frontend to Vercel

### Step 1: Update API URL
Create `.env.production`:
```bash
echo "VITE_API_URL=https://your-railway-app.railway.app/api" > .env.production
```

### Step 2: Deploy to Vercel
```bash
cd /Users/rishig/Downloads/praxis-plus-main
vercel --prod
```

Or connect via Vercel Dashboard:
1. Go to https://vercel.com/new
2. Import your GitHub repo: LegalTrack
3. Add environment variable:
   - `VITE_API_URL`: `https://your-railway-app.railway.app/api`
4. Deploy

---

## 🔧 Post-Deployment Configuration

### Update CORS in Backend
After getting your Vercel URL, update `backend/src/server.js`:

```javascript
app.use(cors({
  origin: [
    'http://localhost:8080',
    'http://localhost:8081',
    'https://your-app.vercel.app',
    'https://*.vercel.app'
  ],
  credentials: true
}));
```

Then redeploy backend:
```bash
cd backend
railway up
```

### Run Database Migrations
```bash
# In Railway dashboard or via CLI
railway run npx prisma migrate deploy
railway run npx prisma db seed
```

---

## ✅ Verification Checklist

After deployment:
- [ ] Backend health check: `https://your-railway-app.railway.app/health`
- [ ] Frontend loads: `https://your-app.vercel.app`
- [ ] Login works
- [ ] Dark mode toggle works
- [ ] Logo displays correctly
- [ ] Time tracking works
- [ ] DOCX generation works
- [ ] All CRUD operations work

---

## 📊 Deployment Status

**Backend (Railway):**
- ✅ railway.json configured
- ✅ Ready for deployment
- ⏳ Awaiting Railway deployment

**Frontend (Vercel):**
- ✅ vercel.json configured
- ✅ Build successful
- ⏳ Awaiting Vercel deployment

**Database:**
- ✅ Neon Postgres ready
- ⏳ Run migrations after deployment

---

## 🎯 Quick Deploy Commands

```bash
# Backend to Railway
cd backend
railway login
railway init
railway up

# Frontend to Vercel
cd ..
vercel --prod
```

---

**Your GitHub repo "LegalTrack" is ready! Follow the steps above to deploy.**
