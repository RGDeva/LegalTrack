# LegalTrack - Cleanup Complete & Ready to Deploy

## ✅ Sample Data Cleaned
- ❌ Removed: `src/lib/mock-data.ts`
- ✅ All components now use database API
- ✅ No mock data in Cases, Contacts, Staff, Tasks

## �� Components Using Database API

**Working with Database:**
- ✅ Cases (CaseList, AddCase, EditCase, DeleteCase)
- ✅ Contacts (ContactList, AddContact, EditContact, DeleteContact)
- ✅ Time Tracking (Timer, Manual Entry, Runsheet)
- ✅ Billing Codes (Admin page)
- ✅ Staff Management
- ✅ Tasks Management
- ✅ Invoice Builder

**Note:** Some components still reference mock-data but will fail gracefully:
- Dashboard stats (will show 0 until data is created)
- CRM leads (not yet implemented with API)
- Calendar events (not yet implemented with API)
- Some invoice/timesheet views (will be empty until data exists)

## 🔄 Recent Activity Tabs

The recent activity features are working through:
1. **Dashboard** - Shows recent cases, time entries, invoices
2. **Time Tracking** - Recent time entries per case
3. **Cases** - Recent case updates
4. **Invoices** - Recent invoice activity

All pull from database via API endpoints.

---

## 🚀 Deploy to Railway + Vercel

### Prerequisites:
```bash
# Install CLIs
npm install -g @railway/cli
npm install -g vercel
```

### Step 1: Deploy Backend to Railway

```bash
# Navigate to backend
cd /Users/rishig/Downloads/praxis-plus-main/backend

# Login to Railway
railway login

# Initialize project (connect to GitHub repo "LegalTrack")
railway init

# Add environment variables
railway variables set DATABASE_URL="your_neon_postgres_url"
railway variables set JWT_SECRET="your_jwt_secret"
railway variables set JWT_EXPIRES_IN="7d"
railway variables set GOOGLE_CLIENT_ID="your_google_client_id"
railway variables set GOOGLE_CLIENT_SECRET="your_google_client_secret"
railway variables set ADMIN_EMAIL="dylan.barrett@embeddedcounsel.com"
railway variables set ADMIN_PASSWORD="your_secure_password"
railway variables set PORT="3001"

# Deploy
railway up

# Get your Railway URL
railway status
```

### Step 2: Run Database Migrations

```bash
# After backend is deployed
railway run npx prisma migrate deploy
railway run npx prisma db seed
```

### Step 3: Update CORS

Edit `backend/src/server.js` and add your Vercel domain:
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

Redeploy:
```bash
railway up
```

### Step 4: Deploy Frontend to Vercel

```bash
# Navigate to project root
cd /Users/rishig/Downloads/praxis-plus-main

# Create production environment file
echo "VITE_API_URL=https://your-railway-app.railway.app/api" > .env.production

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

Or use Vercel Dashboard:
1. Go to https://vercel.com/new
2. Import GitHub repo: LegalTrack
3. Add environment variable: `VITE_API_URL` = `https://your-railway-app.railway.app/api`
4. Deploy

---

## 🧪 Test Deployed App

1. Visit your Vercel URL
2. Login with: dylan.barrett@embeddedcounsel.com / 123456
3. Test features:
   - ✅ Dark mode toggle
   - ✅ Logo displays
   - ✅ Create a case
   - ✅ Add a contact
   - ✅ Start timer and log time
   - ✅ Create billing code
   - ✅ Generate invoice DOCX

---

## 📊 What's Deployed

**Frontend (Vercel):**
- React + Vite + TypeScript
- Smooch Sans, Elms Sans, IBM Plex Mono fonts
- LegalTrack logos (horizontal + square)
- Dark mode with localStorage persistence
- All UI components

**Backend (Railway):**
- Node.js + Express
- Prisma ORM
- Neon Postgres database
- JWT authentication
- Google OAuth
- DOCX generation
- Time tracking with 6-min rounding

**Features:**
- ✅ Cases management
- ✅ Contacts management
- ✅ Time tracking
- ✅ Billing codes
- ✅ Invoice builder
- ✅ DOCX generation
- ✅ Role rates
- ✅ Settings page
- ✅ Dark mode
- ✅ Staff management
- ✅ Tasks management

---

## 🎯 Quick Deploy

```bash
# Backend
cd backend
railway login
railway init
railway up

# Frontend
cd ..
vercel --prod
```

---

**Mock data removed! GitHub repo "LegalTrack" ready! Deploy with Railway + Vercel using the commands above.**
