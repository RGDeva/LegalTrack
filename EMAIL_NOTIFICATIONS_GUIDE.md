# Email Notifications System - Complete Guide

## Overview

LegalTrack now has a fully automated email notification system that sends timely reminders and alerts to users and clients.

## Automated Notifications

### Daily Notifications (9:00 AM EST)

The system automatically sends these emails every day at 9:00 AM:

1. **Overdue Invoice Reminders**
   - Sent to: Clients with unpaid invoices past due date
   - Content: Invoice number, amount due, days overdue
   - Action: Link to view invoice

2. **Upcoming Invoice Reminders**
   - Sent to: Clients with invoices due within 3 days
   - Content: Invoice number, amount due, due date
   - Action: Friendly reminder to pay

3. **Deadline Alerts**
   - Sent to: Staff with tasks/hearings due within 7 days
   - Content: Task/hearing details, due date, priority
   - Action: Link to view case details

### Real-Time Notifications

These emails are sent immediately when triggered:

1. **Password Reset**
   - Trigger: User requests password reset
   - Content: Secure reset link (1-hour expiry)
   - Action: Reset password

2. **Welcome Email**
   - Trigger: New user registration
   - Content: Welcome message, feature overview
   - Action: Link to dashboard

3. **Task Assignment**
   - Trigger: Task assigned to staff member
   - Content: Task details, due date, priority
   - Action: Link to view task

## Configuration

### Environment Variables

Required on Railway backend:

```bash
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=LegalTrack <noreply@legaltrack.app>
FRONTEND_URL=https://legal-track-nine.vercel.app
NODE_ENV=production
```

### Cron Schedule

- **Daily Notifications**: `0 9 * * *` (9:00 AM daily)
- **Weekly Reminders**: `0 8 * * 1` (8:00 AM Mondays) - Future feature
- **Timezone**: America/New_York (EST/EDT)

## Manual Testing

### Trigger Notifications Manually

As an admin user, you can manually trigger all scheduled notifications:

```bash
curl -X POST https://legaltrack-production.up.railway.app/api/notifications/run-scheduled \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

### Check Cron Job Status

```bash
curl https://legaltrack-production.up.railway.app/api/notifications/cron-status \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Response:
```json
{
  "success": true,
  "jobs": {
    "dailyNotifications": {
      "running": true,
      "schedule": "9:00 AM daily",
      "timezone": "America/New_York"
    },
    "weeklyReminders": {
      "running": true,
      "schedule": "8:00 AM Mondays",
      "timezone": "America/New_York"
    }
  }
}
```

## Email Templates

All emails use professional HTML templates with:
- Responsive design
- Branded header
- Clear call-to-action buttons
- Mobile-friendly layout
- Consistent styling

### Template Features

- **Invoice Reminders**: Color-coded (red for overdue, blue for upcoming)
- **Deadline Alerts**: Priority badges (High/Medium/Low)
- **Task Assignments**: Full task details with assignee info
- **Password Reset**: Secure token with expiry notice

## Development Mode

In development, cron jobs are disabled by default. To enable:

```bash
# In .env
ENABLE_CRON=true
```

Or test manually via API endpoint.

## Monitoring

### Check Logs

Railway logs show cron job execution:

```bash
railway logs | grep -i "cron\|notification"
```

Expected output:
```
Starting cron jobs...
✓ Daily notifications scheduled (9:00 AM daily)
✓ Weekly reminders scheduled (8:00 AM Mondays)
All cron jobs started successfully
```

### Notification Results

When cron runs, you'll see:
```
Running daily notifications at 9:00 AM...
Found X overdue invoices
Found Y invoices due soon
Found Z tasks with upcoming deadlines
Daily notifications completed: { ... }
```

## Troubleshooting

### Emails Not Sending

1. **Check Resend API Key**
   ```bash
   railway variables | grep RESEND_API_KEY
   ```

2. **Check Email Service Logs**
   ```bash
   railway logs | grep -i "resend\|email"
   ```

3. **Verify Email Addresses**
   - Resend free tier requires verified sender addresses
   - Add test emails to Resend dashboard

### Cron Jobs Not Running

1. **Check if Cron Started**
   ```bash
   railway logs | grep "Starting cron jobs"
   ```

2. **Verify NODE_ENV**
   ```bash
   railway variables | grep NODE_ENV
   ```
   Should be `production` for auto-start

3. **Manual Trigger Test**
   Use the API endpoint to test notification logic

## Future Enhancements

- [ ] Email preferences (opt-in/opt-out)
- [ ] Notification history in admin panel
- [ ] Weekly summary emails
- [ ] Custom notification schedules
- [ ] Email templates customization
- [ ] Notification analytics dashboard

## API Endpoints

### POST /api/notifications/run-scheduled
Manually trigger all scheduled notifications (admin only)

**Headers:**
- `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "success": true,
  "message": "Scheduled notifications sent",
  "results": {
    "overdueInvoices": { "sent": 5 },
    "upcomingInvoices": { "sent": 3 },
    "deadlines": { "taskAlerts": 8, "hearingAlerts": 2 }
  }
}
```

### GET /api/notifications/cron-status
Get status of all cron jobs (admin only)

**Headers:**
- `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "success": true,
  "jobs": {
    "dailyNotifications": {
      "running": true,
      "schedule": "9:00 AM daily",
      "timezone": "America/New_York"
    }
  }
}
```

## Support

For issues or questions:
1. Check Railway logs for errors
2. Verify environment variables
3. Test with manual trigger endpoint
4. Check Resend dashboard for delivery status

---

**Version:** 2.4  
**Last Updated:** January 25, 2026  
**Status:** ✅ Production Ready
