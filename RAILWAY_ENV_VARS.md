# Railway Environment Variables Configuration

## ⚠️ IMPORTANT: Update These in Railway Dashboard

Go to: https://railway.app → Your Project → Backend Service → Variables

Add/Update these environment variables:

```bash
DATABASE_URL=postgresql://username:password@your-neon-endpoint.neon.tech/dbname?sslmode=require

JWT_SECRET=your-super-secret-jwt-key-change-this

PORT=3001

NODE_ENV=production

GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

GOOGLE_CLIENT_SECRET=your-google-client-secret

ADMIN_EMAIL=your-admin-email@example.com
```

**Note:** Replace the placeholder values above with your actual credentials from:
- DATABASE_URL: Get from Neon console
- GOOGLE_CLIENT_ID & SECRET: Get from Google Cloud Console
- JWT_SECRET: Generate a random string

## How to Update

1. Go to Railway dashboard
2. Select your backend service
3. Click "Variables" tab
4. For each variable above:
   - Click "New Variable" (or edit existing)
   - Paste name and value
   - Click "Add"
5. Railway will automatically redeploy

## Verify Deployment

After Railway redeploys, test:

```bash
curl https://legaltrack-production.up.railway.app/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'
```

Should return: `{"error":"Invalid credentials"}` (not database error)
