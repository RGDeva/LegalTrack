# Calendar Tab Debugging Guide

## Issue: Calendar tab not working

### Possible Causes:

1. **Tab not clickable**
   - Check if Tabs component is rendering
   - Verify TabsTrigger is interactive

2. **Calendar iframe not loading**
   - Google may be blocking the embed
   - X-Frame-Options header blocking
   - CORS issues

3. **React component not rendering**
   - Check browser console for errors
   - Verify CalendarView component imports

### How to Debug:

#### Step 1: Check Browser Console
1. Open browser (http://localhost:8080)
2. Press F12 to open DevTools
3. Go to Console tab
4. Look for errors (especially about iframes or X-Frame-Options)

#### Step 2: Test Tab Switching
1. Click on "Calendar" tab
2. Does the tab highlight/activate?
3. Does content below change?

#### Step 3: Check Network Tab
1. Open DevTools → Network tab
2. Click Calendar tab
3. Look for request to calendar.google.com
4. Check if it returns 200 OK or error

#### Step 4: Inspect Element
1. Right-click on Calendar tab
2. Click "Inspect"
3. Verify the HTML structure:
   ```html
   <button role="tab" data-state="active">Calendar</button>
   ```

### Common Fixes:

#### Fix 1: Google Calendar Blocking Embed
**Symptom**: Blank iframe or "Refused to display" error

**Solution**: 
- Calendar must be public
- Or use Google Calendar API instead of iframe
- Check calendar sharing settings

#### Fix 2: Tabs Not Switching
**Symptom**: Clicking tab does nothing

**Check**:
- Tabs component properly imported
- TabsContent has matching value prop
- No JavaScript errors blocking interaction

#### Fix 3: Component Not Rendering
**Symptom**: Tab content is empty

**Check**:
- CalendarView component exports correctly
- No TypeScript errors
- All imports resolved

### Quick Test:

Open browser console and run:
```javascript
// Check if tabs exist
document.querySelector('[role="tablist"]')

// Check if calendar tab exists
document.querySelector('[value="calendar"]')

// Check if iframe exists
document.querySelector('iframe[title="Google Calendar"]')
```

### Expected Behavior:

1. Click "Calendar" tab → Tab becomes active
2. Overview content hides
3. Calendar content shows
4. Google Calendar iframe loads
5. Can interact with calendar

### If Still Not Working:

Try these in order:

1. **Hard refresh**: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
2. **Clear cache**: DevTools → Application → Clear storage
3. **Restart dev server**: `npm run dev`
4. **Check .env loaded**: Console → `import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID`
5. **Try incognito mode**: Rules out extension conflicts

### Alternative: Direct Calendar Page

If tabs don't work, create a dedicated `/calendar` route:

```tsx
// In App.tsx
<Route path="/calendar" element={<Layout><CalendarPage /></Layout>} />

// Create CalendarPage.tsx
export default function CalendarPage() {
  return (
    <div className="p-6">
      <h1>Calendar</h1>
      <CalendarView />
    </div>
  );
}
```

Then access directly at: http://localhost:8080/calendar
