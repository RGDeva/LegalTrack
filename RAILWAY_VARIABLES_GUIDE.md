# How to Find Variables Tab in Railway

## Step-by-Step Guide:

### 1. Go to Your Railway Project
https://railway.com/project/f42f9123-6617-42b9-b17b-08dcb4656a9a

### 2. You'll See Your Service
Look for a card/box that says something like:
- "backend" or
- "legaltrack-backend" or
- Your service name

### 3. Click on That Service Card
This opens the service details

### 4. Look for Tabs at the Top
You should see tabs like:
- **Deployments**
- **Variables** ← Click this one!
- **Settings**
- **Metrics**
- **Logs**

### 5. In the Variables Tab
You'll see:
- A button that says **"+ New Variable"** or **"Add Variable"**
- Click it to add each variable one by one

### 6. Add Each Variable:
For each variable, enter:
- **Variable Name** (e.g., `DATABASE_URL`)
- **Value** (e.g., your Neon Postgres URL)
- Click **Add** or **Save**

---

## Required Variables:

```
DATABASE_URL
JWT_SECRET
JWT_EXPIRES_IN
ADMIN_EMAIL
ADMIN_PASSWORD
PORT
```

---

## Alternative: If You Can't Find Variables Tab

### Try This:
1. In Railway dashboard, click on your service
2. Look for **Settings** tab
3. Scroll down to find **Environment Variables** section
4. Add variables there

### Or Use Railway CLI:
```bash
cd /Users/rishig/Downloads/praxis-plus-main/backend

# Add variables one by one
railway variables --set DATABASE_URL="your_value"
railway variables --set JWT_SECRET="your_value"
railway variables --set JWT_EXPIRES_IN="7d"
railway variables --set ADMIN_EMAIL="dylan.barrett@embeddedcounsel.com"
railway variables --set ADMIN_PASSWORD="your_password"
railway variables --set PORT="3001"
```

---

## Screenshot Guide:
1. **Project page** → Shows all services
2. **Click service card** → Opens service details
3. **Top tabs** → Variables is one of them
4. **+ New Variable button** → Click to add

---

**If you still can't find it, try the CLI method above or let me know what you see on the screen!**
