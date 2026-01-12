# Testing Guide for Time Tracking & Billing Features

## Prerequisites
- Dev server running at http://localhost:8080
- Browser with localStorage enabled
- Clear localStorage to start fresh (optional)

## Test Scenarios

### 1. Test User Login & Roles

**Test Admin User:**
```
Email: admin@firm.com
Role: Admin
```

**Test Attorney User:**
```
Email: sarah@firm.com
Role: Attorney
```

**Test Staff User:**
```
Email: emily@firm.com
Role: Staff
```

**Steps:**
1. Open app at http://localhost:8080
2. Login dialog should appear
3. Enter one of the test emails
4. Verify dashboard loads with appropriate metrics

**Expected Results:**
- Admin sees: Active Cases, Billable Hours, Ready to Invoice, Active Timers
- Attorney/Staff see: Active Cases, Billable Hours, Ready to Invoice, Pending Invoices

---

### 2. Test Run Timer

**Steps:**
1. Login as Attorney (sarah@firm.com)
2. Navigate to Cases → Click on "Johnson v. Smith Corp"
3. Scroll to find the Timer component
4. Enter description: "Reviewing case documents"
5. Select billing code: "004 - Drafting or reviewing documents"
6. Click Start
7. Wait 10-15 seconds
8. Click Stop

**Expected Results:**
- Timer shows elapsed time in hh:mm format
- Rate preview shows (for Attorney: $350/hr)
- On Stop: Success toast appears
- Time entry saved to localStorage
- Timer resets to 00:00

**Verify:**
- Check browser console: `localStorage.getItem('timeEntries')`
- Should see new entry with your description

---

### 3. Test /log Command Parser

**Steps:**
1. Stay on case detail page
2. Click on "Runsheet" tab
3. Click "Log Activity" button
4. In description field, type: `/log 11m drafted discovery letter`
5. Observe the blue preview box appears
6. Click "Add Activity"

**Expected Results:**
- Preview shows: "Time Entry Preview: 11m • drafted discovery letter"
- Activity appears in runsheet timeline
- Success toast: "Time entry created: 12m logged" (rounded to 6-min increment)
- Both runsheet entry and time entry created

**Verify:**
- Check localStorage for new time entry
- Billable minutes should be 12 (11 rounded up)

---

### 4. Test Billing Codes Management

**Steps:**
1. Login as Admin (admin@firm.com)
2. Navigate to Settings (or /settings route)
3. View existing billing codes table
4. Click "Add Billing Code"
5. Enter:
   - Code: 008
   - Label: Client consultation
   - Attorney/Admin Rate: 375
   - Staff Rate: 85
6. Click Create

**Expected Results:**
- New code appears in table
- Shows as "Active" status
- Rates display correctly

**Test Edit:**
1. Click edit icon on code 008
2. Change label to "Client consultation and advice"
3. Click Update
4. Verify change appears

**Test Access Control:**
1. Logout and login as Staff (emily@firm.com)
2. Navigate to Settings
3. Should see "Access Denied" message

---

### 5. Test Invoice Generation

**Steps:**
1. Login as Attorney (sarah@firm.com)
2. Navigate to Invoices page
3. Click "Generate Invoice" button
4. Select case: "2024-CV-001 - Johnson v. Smith Corp"
5. Click "Generate & Download"

**Expected Results:**
- Success toast with total amount and hours
- Text file downloads: `Invoice_2024-CV-001_[date].txt`
- File contains:
  - Case number and client name
  - List of time entries with codes
  - Hours, rates, and amounts
  - Total hours and total amount

**Verify:**
1. Open downloaded file
2. Check calculations are correct
3. Try generating again for same case
4. Should show "No unbilled time entries" message

---

### 6. Test Dashboard Metrics

**Steps:**
1. Login as Admin (admin@firm.com)
2. View Dashboard
3. Note the metric cards

**Expected Metrics:**
- **Active Cases**: Should show count of active cases
- **Billable Hours (Month)**: Sum of current month's billable time
- **Ready to Invoice**: Dollar amount of unbilled time entries
- **Active Timers**: Count of entries in last 24 hours

**Test Calculation:**
1. Create a new time entry using timer
2. Refresh dashboard
3. Verify "Ready to Invoice" increases
4. Verify "Active Timers" increases
5. Generate invoice for that case
6. Refresh dashboard
7. Verify "Ready to Invoice" decreases

---

### 7. Test Role-Based Rate Visibility

**As Attorney (sarah@firm.com):**
1. Go to case detail
2. Use timer with billing code
3. Should see rate preview: "Rate: $350.00/hr"

**As Staff (emily@firm.com):**
1. Go to case detail
2. Use timer with billing code
3. Should NOT see rate preview
4. Timer should still work normally

---

### 8. Test Data Persistence

**Steps:**
1. Create several time entries
2. Close browser tab
3. Reopen app at http://localhost:8080
4. Login again
5. Check Dashboard metrics
6. Navigate to case and check timer history

**Expected Results:**
- All data persists across sessions
- Metrics reflect saved data
- Time entries remain in localStorage

---

### 9. Test 6-Minute Rounding

**Test Cases:**
| Input Minutes | Expected Billable |
|--------------|-------------------|
| 1 | 6 |
| 5 | 6 |
| 6 | 6 |
| 7 | 12 |
| 11 | 12 |
| 12 | 12 |
| 13 | 18 |

**Steps:**
1. Use /log command with different durations
2. Verify billable minutes in success toast
3. Check localStorage entries

---

### 10. Test Edge Cases

**Empty Description:**
1. Try to start timer without description
2. Should be disabled/show error

**No Billing Code:**
1. Start timer without selecting billing code
2. Should still work (optional field)
3. Rate preview should not show

**Generate Invoice - No Unbilled Time:**
1. Generate invoice for a case
2. Try to generate again immediately
3. Should show error: "No unbilled time entries found"

**Access Control:**
1. Try to access /settings as Staff
2. Should show "Access Denied"

---

## Cleanup

To reset all data:
```javascript
// In browser console:
localStorage.clear();
location.reload();
```

This will:
- Clear all time entries
- Clear current user
- Re-seed sample data on next load

---

## Known Issues / Future Enhancements

1. **PDF Generation**: Currently generates text file. Need to integrate DOCX template for PDF.
2. **Backend**: All data in localStorage. Need API integration.
3. **Real-time Updates**: Dashboard metrics don't auto-refresh. Need to manually refresh page.
4. **Timer Persistence**: Timer state lost on page refresh. Consider persisting active timer state.
5. **Bulk Operations**: No way to edit/delete multiple time entries at once.

---

## Success Criteria

All features working if:
- ✓ Timer creates time entries with correct rounding
- ✓ /log parser creates both runsheet and time entries
- ✓ Billing codes display and can be managed (Admin only)
- ✓ Invoice generation downloads file with correct calculations
- ✓ Rates hidden from Staff users
- ✓ Dashboard shows correct metrics
- ✓ Data persists across sessions
- ✓ Build completes without errors
- ✓ No console errors during normal usage
