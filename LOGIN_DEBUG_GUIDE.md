# Login Issue - Debug Guide

## ✅ CONFIRMED WORKING: Backend API

Tested with curl - backend returns valid token:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dylan.barrett@embeddedcounsel.com","password":"123456"}'
```

**Result**: HTTP 200 + valid JWT token + user data

## 🔍 DEBUGGING STEPS

### Step 1: Open Browser Console
1. Go to http://localhost:8080
2. Press F12 (or Cmd+Option+I on Mac)
3. Go to Console tab

### Step 2: Try Login
1. Enter email: dylan.barrett@embeddedcounsel.com
2. Enter password: 123456
3. Click "Sign In with Email"

### Step 3: Check Console Logs
You should see these logs (I added them):
```
API: Attempting login to: http://localhost:3001/api/auth/login
API: Email: dylan.barrett@embeddedcounsel.com
API: Response status: 200
API: Response ok: true
API: Response data: {token: "...", user: {...}}
```

### Step 4: Check Network Tab
1. Go to Network tab in browser console
2. Try login again
3. Look for request to "login"
4. Check:
   - Status code (should be 200)
   - Response (should have token and user)
   - Headers (check CORS)

## 🐛 POSSIBLE ISSUES

### Issue 1: CORS Error
**Symptom**: Console shows CORS error
**Fix**: Backend already configured for ports 8080 and 8081
**Check**: Look for "Access-Control-Allow-Origin" error

### Issue 2: Network Error
**Symptom**: Console shows "Failed to fetch" or "Network error"
**Fix**: Backend might not be running
**Check**: Run `curl http://localhost:3001/health`

### Issue 3: Wrong Credentials
**Symptom**: Status 401, error: "Invalid credentials"
**Fix**: Use exact credentials:
- Email: dylan.barrett@embeddedcounsel.com
- Password: 123456

### Issue 4: Browser Cache
**Symptom**: Old code running
**Fix**: Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)

## 🔧 QUICK FIXES

### Fix 1: Clear Browser Storage
Open console and run:
```javascript
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Fix 2: Test API Directly in Console
Open console and run:
```javascript
fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'dylan.barrett@embeddedcounsel.com',
    password: '123456'
  })
})
.then(r => r.json())
.then(d => console.log('SUCCESS:', d))
.catch(e => console.error('ERROR:', e));
```

If this works, the backend is fine and issue is in React code.

### Fix 3: Check Backend Logs
Look at the terminal running the backend server.
Should see incoming POST request to /api/auth/login

## 📊 WHAT I'VE DONE

1. ✅ Verified backend works with curl
2. ✅ Fixed CORS to allow port 8080
3. ✅ Updated error handling in SignIn.tsx
4. ✅ Added detailed logging to api.ts
5. ✅ Updated AuthContext with better error logging

## 🎯 NEXT STEPS

1. **Open browser console** and try login
2. **Check the console logs** I added
3. **Look at Network tab** to see the actual request/response
4. **Report back** what you see in the console

The backend is 100% working. The issue is either:
- Frontend not making the request correctly
- Browser blocking the request (CORS)
- Old cached code running

**With the new logging, we'll see exactly what's happening!**
