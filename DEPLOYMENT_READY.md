# LegalTrack - Ready for Deployment

## ✅ Logo Updated
- Logo now fills sidebar width (h-16, w-full, object-contain)
- Larger and more visible

## ✅ Build Successful
Frontend build completed successfully:
- Output: `dist/` folder
- Size: 830KB (minified)
- Ready for Vercel deployment

---

## 🚀 Deploy to Vercel NOW

### Quick Deploy (Recommended):

```bash
# Install Vercel CLI if not installed
npm install -g vercel

# Navigate to project
cd /Users/rishig/Downloads/praxis-plus-main

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

Follow the prompts:
1. Set up and deploy? **Yes**
2. Which scope? **Your account**
3. Link to existing project? **No**
4. Project name? **legaltrack** (or your choice)
5. Directory? **./** (press Enter)
6. Override settings? **No**

Your app will be deployed to: `https://legaltrack.vercel.app` (or similar)

---

## 🔧 Backend Deployment Options

### Option 1 - Railway (Easiest):
```bash
# Install Railway CLI
npm install -g @railway/cli

# Navigate to backend
cd backend

# Login and deploy
railway login
railway init
railway up
```

### Option 2 - Render.com:
1. Go to https://render.com
2. New → Web Service
3. Connect your GitHub repo
4. Root Directory: `backend`
5. Build: `npm install`
6. Start: `npm start`

### Option 3 - Fly.io:
```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Navigate to backend
cd backend

# Deploy
fly launch
fly deploy
```

---

## 🔐 Environment Variables

### After Backend Deployment:
1. Get your backend URL (e.g., `https://legaltrack-api.railway.app`)
2. Add to Vercel:
   ```bash
   vercel env add VITE_API_URL
   # Enter: https://your-backend-url.com/api
   ```
3. Redeploy frontend:
   ```bash
   vercel --prod
   ```

### Backend Environment Variables:
Set these in your backend hosting platform:
```
DATABASE_URL=your_neon_postgres_url
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
ADMIN_EMAIL=dylan.barrett@embeddedcounsel.com
ADMIN_PASSWORD=your_secure_password
FRONTEND_URL=https://your-vercel-app.vercel.app
```

---

## 📋 Post-Deployment Checklist

After deploying both frontend and backend:

1. **Update CORS** in `backend/src/server.js`:
   ```javascript
   app.use(cors({
     origin: [
       'http://localhost:8080',
       'https://your-app.vercel.app',
       'https://*.vercel.app'
     ],
     credentials: true
   }));
   ```

2. **Test the deployed app**:
   - ✅ Login works
   - ✅ Dark mode toggle
   - ✅ Logo displays correctly
   - ✅ Time tracking
   - ✅ DOCX generation
   - ✅ All CRUD operations

3. **Run database migrations** on production:
   ```bash
   # SSH into your backend or run via platform CLI
   npx prisma migrate deploy
   npx prisma db seed
   ```

---

## �� Current Status

**Frontend:**
- ✅ Build successful
- ✅ vercel.json configured
- ✅ Ready to deploy
- ✅ Logo updated and larger

**Backend:**
- ⏳ Choose hosting platform
- ⏳ Deploy backend
- ⏳ Set environment variables
- ⏳ Update CORS for production

**Database:**
- ✅ Neon Postgres ready
- ⏳ Run migrations on production

---

## 🚀 Deploy Now - Step by Step

### Step 1: Deploy Frontend to Vercel
```bash
cd /Users/rishig/Downloads/praxis-plus-main
vercel --prod
```

### Step 2: Deploy Backend (Choose one platform)
```bash
# Railway example:
cd backend
railway up

# Or Render.com via dashboard
# Or Fly.io: fly deploy
```

### Step 3: Connect Frontend to Backend
```bash
# Add backend URL to Vercel
vercel env add VITE_API_URL
# Enter your backend URL

# Redeploy
vercel --prod
```

### Step 4: Update Backend CORS
Edit `backend/src/server.js` to allow your Vercel domain, then redeploy backend.

### Step 5: Test Everything
Visit your Vercel URL and test all features.

---

**Everything is ready! Run `vercel --prod` to deploy the frontend now.**
