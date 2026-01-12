# Login Guide - LegalTrack

## 🔐 Two Ways to Login

### **Option 1: Google OAuth** (Recommended for Production)

**Steps**:
1. Go to http://localhost:8080
2. You'll be redirected to `/signin`
3. Click the **"Sign in with Google"** button
4. Google OAuth popup will appear
5. Select your Google account
6. Authenticate
7. You'll be redirected to the dashboard
8. Your Google profile info will be used to create/login your account

**Requirements**:
- Valid Google account
- Google OAuth Client ID configured in `.env`
- Internet connection

**Troubleshooting**:
- If Google button doesn't work, check browser console (F12) for errors
- Make sure `VITE_GOOGLE_CLIENT_ID` is set in `.env`
- Try in incognito mode if you have browser extensions blocking OAuth

---

### **Option 2: Demo Login** (Quick Testing)

**Steps**:
1. Go to http://localhost:8080
2. You'll be redirected to `/signin`
3. Scroll down to "Or use a demo account:"
4. Click one of the demo login buttons:
   - **Login as Admin (Sarah Chen)** - Full access
   - **Login as Attorney (Michael Rodriguez)** - Attorney access
   - **Login as Staff (Emily Watson)** - Staff access
5. Instantly logged in and redirected to dashboard

**No Google account needed!**

---

## 🧪 Testing Login

### **Test 1: Demo Login (Easiest)**
```
1. Open browser
2. Go to http://localhost:8080
3. Should redirect to /signin
4. Click "Login as Admin (Sarah Chen)"
5. Success toast appears
6. Redirected to dashboard
7. ✅ You're logged in!
```

### **Test 2: Google OAuth**
```
1. Open browser
2. Go to http://localhost:8080
3. Should redirect to /signin
4. Click "Sign in with Google"
5. Google popup appears
6. Select account
7. Authenticate
8. Redirected to dashboard
9. ✅ You're logged in!
```

### **Test 3: Logout & Re-login**
```
1. While logged in, open browser console (F12)
2. Run: localStorage.clear()
3. Refresh page
4. Redirected to /signin
5. Login again using either method
6. ✅ Works!
```

---

## 👥 Demo Accounts

### **Admin Account**
- **Name**: Sarah Chen
- **Email**: sarah@firm.com
- **Role**: Admin
- **Access**: Full access to all features

### **Attorney Account**
- **Name**: Michael Rodriguez
- **Email**: michael@firm.com
- **Role**: Attorney
- **Access**: Case management, time tracking, client access

### **Staff Account**
- **Name**: Emily Watson
- **Email**: emily@firm.com
- **Role**: Staff
- **Access**: Limited access, support functions

---

## 🔧 How It Works

### **Demo Login Flow**:
1. Click demo button
2. `login(email)` function called
3. Finds user in `mockUsers` by email
4. Saves user to `localStorage.currentUser`
5. Sets user in AuthContext
6. Redirects to dashboard

### **Google OAuth Flow**:
1. Click Google button
2. Google OAuth popup
3. User authenticates
4. Google returns JWT credential
5. `loginWithGoogle(credential)` decodes JWT
6. Extracts user info (name, email)
7. Checks if user exists in `mockUsers`
8. If not, creates new user
9. Saves to `localStorage.currentUser`
10. Sets user in AuthContext
11. Redirects to dashboard

---

## 🛡️ Protected Routes

All pages except `/signin` are protected:
- `/` (Dashboard)
- `/cases`
- `/contacts`
- `/staff`
- `/documents`
- `/calendar`
- `/invoices`
- `/time`
- `/clients`
- `/crm`
- `/settings`

**If not logged in**: Automatically redirected to `/signin`

---

## 💾 Session Persistence

**Login persists across page refreshes!**

Data stored in localStorage:
- `currentUser` - User object
- `googleCredential` - Google JWT token (if using OAuth)

**To logout**:
```javascript
// In browser console
localStorage.removeItem('currentUser')
localStorage.removeItem('googleCredential')
location.reload()
```

Or implement a logout button that calls `logout()` from AuthContext.

---

## 🚀 Quick Start

**Fastest way to test the app**:

1. Open http://localhost:8080
2. Click **"Login as Admin (Sarah Chen)"**
3. Start testing features!

**No Google account needed for testing!**

---

## ⚙️ Configuration

### **Google OAuth Setup** (Optional)

If you want to use real Google OAuth:

1. **Get Google OAuth Credentials**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a project
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized JavaScript origins: `http://localhost:8080`
   - Add authorized redirect URIs: `http://localhost:8080`

2. **Update `.env`**:
   ```
   VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   VITE_GOOGLE_CLIENT_SECRET=your-client-secret
   ```

3. **Restart dev server**:
   ```bash
   npm run dev
   ```

---

## 🎯 Summary

**For Testing**: Use demo login buttons (instant access)
**For Production**: Use Google OAuth (real authentication)

Both methods work perfectly! Choose whichever is easier for your current needs. 🚀
