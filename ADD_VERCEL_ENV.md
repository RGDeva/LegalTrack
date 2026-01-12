# Vercel Environment Variable Setup

The command is asking if you want to mark the value as sensitive.

## What to do:

Type: **N** (No - it's just a URL, not sensitive)

Then when prompted for the value, enter:
```
https://legaltrack-production.up.railway.app/api
```

---

## Or Add via Vercel Dashboard (Easier):

1. Go to: https://vercel.com/rgdevas-projects/legaltrack/settings/environment-variables

2. Click "Add New"

3. Fill in:
   - **Key:** VITE_API_URL
   - **Value:** https://legaltrack-production.up.railway.app/api
   - **Environment:** Production

4. Click "Save"

5. Then redeploy:
   ```bash
   vercel --prod
   ```

---

**The error happened because Vercel is looking for a secret called "api_url" that doesn't exist. We're adding the actual environment variable now.**
