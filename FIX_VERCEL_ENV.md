# Fix Vercel Environment Variable Issue

## The Problem:
Vercel has an environment variable that references a non-existent secret "api_url".
The CLI can't fix this - you need to use the Vercel Dashboard.

## Solution - Use Vercel Dashboard:

### Step 1: Delete the Old Variable
1. Go to: https://vercel.com/rgdevas-projects/legaltrack/settings/environment-variables
2. Find "VITE_API_URL" in the list
3. Click the three dots (...) or trash icon next to it
4. Click "Delete" or "Remove"
5. Confirm deletion

### Step 2: Add New Variable
1. On the same page, click "Add New" or "Add Variable"
2. Fill in:
   - **Name:** VITE_API_URL
   - **Value:** https://legaltrack-production.up.railway.app/api
   - **Environments:** Check "Production" (and optionally Preview/Development)
3. Make sure it's a plain text value, NOT a secret reference
4. Click "Save"

### Step 3: Redeploy
After adding the variable, go to:
https://vercel.com/rgdevas-projects/legaltrack

Click "Redeploy" on the latest deployment, or run:
```bash
cd /Users/rishig/Downloads/praxis-plus-main
vercel --prod
```

---

## Alternative: Delete Project and Start Fresh

If the above doesn't work, you can delete the Vercel project and create a new one:

1. Go to: https://vercel.com/rgdevas-projects/legaltrack/settings
2. Scroll to bottom
3. Click "Delete Project"
4. Then run:
   ```bash
   rm -rf .vercel
   vercel --prod
   ```
5. Create new project with correct environment variable

---

**Go to the Vercel dashboard now and delete/recreate the VITE_API_URL variable!**
