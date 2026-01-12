# Quick Login Troubleshooting

## Backend Status: ✅ WORKING
Tested with curl - returns valid token and user data.

## Issue: Frontend login showing "Invalid email or password"

## Possible Causes:

1. **CORS Issue** - Frontend can't reach backend
   - Backend CORS configured for ports 8080 and 8081 ✅
   
2. **API URL Mismatch** - Frontend calling wrong URL
   - Frontend API_URL = 'http://localhost:3001/api' ✅
   
3. **Error Handling** - Frontend not properly catching/displaying error
   - Updated SignIn.tsx to show actual error message ✅

## Quick Test:

Open browser console (F12) and run:
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

If this works in console but not in the app, the issue is in the React code.

## Login Credentials:
- Email: dylan.barrett@embeddedcounsel.com
- Password: 123456

## Next Steps:
1. Open http://localhost:8080 in browser
2. Open browser console (F12)
3. Try to login
4. Check console for actual error message
5. Look for network request to /api/auth/login
6. Check if request is being made and what response is

## If Still Not Working:
Try clearing browser cache and localStorage:
```javascript
localStorage.clear();
location.reload();
```
