# Mail Provider Setup Guide

LegalTrack supports multiple email providers through a pluggable transport layer. This guide covers setup for both **Resend** and **Unosend**.

## Overview

The mail provider system allows you to:
- Switch between email providers without code changes
- Use Resend (default) or Unosend
- Maintain backward compatibility with existing Resend setup
- Get clear error messages when configuration is missing

## Quick Start

### 1. Choose Your Provider

Set the `MAIL_PROVIDER` environment variable:

```bash
# Use Resend (default)
MAIL_PROVIDER=resend

# Or use Unosend
MAIL_PROVIDER=unosend
```

If `MAIL_PROVIDER` is not set, the system defaults to Resend for backward compatibility.

### 2. Configure Provider Credentials

#### Option A: Resend

```bash
MAIL_PROVIDER=resend
RESEND_API_KEY=re_your-resend-api-key-here
EMAIL_FROM=LegalTrack <noreply@yourdomain.com>
```

**Get Resend API Key:**
1. Sign up at https://resend.com
2. Go to API Keys section
3. Create a new API key
4. Copy the key (starts with `re_`)

#### Option B: Unosend

```bash
MAIL_PROVIDER=unosend
UNOSEND_API_KEY=un_your-unosend-api-key-here
UNOSEND_API_BASE_URL=https://api.unosend.com/v1
EMAIL_FROM=LegalTrack <noreply@yourdomain.com>
```

**Get Unosend API Key:**
1. Sign up at https://unosend.com
2. Navigate to API settings
3. Generate a new API key
4. Copy the key (starts with `un_`)

### 3. Restart Backend

```bash
cd backend
npm run dev
```

Check logs for confirmation:
```
Mail provider: resend (configured: ✓)
```

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MAIL_PROVIDER` | No | `resend` | Email provider to use: `resend` or `unosend` |
| `RESEND_API_KEY` | If using Resend | - | Resend API key (starts with `re_`) |
| `UNOSEND_API_KEY` | If using Unosend | - | Unosend API key (starts with `un_`) |
| `UNOSEND_API_BASE_URL` | No | `https://api.unosend.com/v1` | Unosend API base URL |
| `EMAIL_FROM` | No | `onboarding@resend.dev` | Default sender email address |

## Testing Your Configuration

### Quick Test Script

Run the included test script to verify your email provider is working:

```bash
cd backend
node scripts/testEmailProvider.js your-test-email@example.com
```

**Expected output:**
```
Testing email provider: resend
Sending test email to: your-test-email@example.com
✅ Email sent successfully!
Provider: resend
Message ID: abc123...
```

### Manual Test with curl

#### Test Resend

```bash
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer re_your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "LegalTrack <noreply@yourdomain.com>",
    "to": "test@example.com",
    "subject": "Test Email",
    "html": "<p>This is a test email from LegalTrack</p>"
  }'
```

#### Test Unosend

```bash
curl -X POST https://api.unosend.com/v1/emails \
  -H "Authorization: Bearer un_your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "LegalTrack <noreply@yourdomain.com>",
    "to": ["test@example.com"],
    "subject": "Test Email",
    "html": "<p>This is a test email from LegalTrack</p>"
  }'
```

## Email Templates

All existing email templates are preserved and work with both providers:

- **Password Reset** - `sendPasswordResetEmail()`
- **Invoice Reminders** - `sendInvoiceReminderEmail()`
- **Deadline Alerts** - `sendDeadlineAlertEmail()`
- **Task Assignments** - `sendTaskAssignmentEmail()`
- **Welcome Emails** - `sendWelcomeEmail()`
- **User Invitations** - Sent via `/api/invitations/invite`

## Switching Providers

To switch from one provider to another:

1. **Update environment variable:**
   ```bash
   # In your .env file
   MAIL_PROVIDER=unosend  # Change from resend to unosend
   ```

2. **Ensure new provider credentials are set:**
   ```bash
   UNOSEND_API_KEY=un_your-key-here
   ```

3. **Restart backend:**
   ```bash
   npm run dev
   ```

No code changes required!

## Error Handling

The mail provider system provides clear error messages:

### Missing API Key
```
Error: Resend provider error: RESEND_API_KEY is not configured
```
**Fix:** Add the required API key to your `.env` file.

### Invalid API Key
```
Error: Resend API error: Invalid API key
```
**Fix:** Verify your API key is correct and active.

### Network Issues
```
Error: Unosend provider error: fetch failed
```
**Fix:** Check your network connection and API base URL.

## Production Deployment

### Railway / Render / Heroku

Add environment variables in your platform's dashboard:

```bash
MAIL_PROVIDER=resend
RESEND_API_KEY=re_your-production-key
EMAIL_FROM=LegalTrack <noreply@yourdomain.com>
```

### Docker

Add to your `docker-compose.yml`:

```yaml
environment:
  - MAIL_PROVIDER=resend
  - RESEND_API_KEY=${RESEND_API_KEY}
  - EMAIL_FROM=LegalTrack <noreply@yourdomain.com>
```

### Vercel / Netlify Functions

Set environment variables in your deployment settings.

## Monitoring & Logs

All email sends are logged with the notification logger:

```javascript
// Success log
await logNotification('password_reset', email, userName, subject, metadata);

// Failure log
await logFailedNotification('password_reset', email, userName, subject, error);
```

Check your database `NotificationLog` table for email history.

## API Response Format

Both providers return a normalized response:

```javascript
{
  id: "msg_abc123",           // Message ID from provider
  provider: "resend",         // Which provider was used
  raw: { /* provider data */ } // Raw response from provider
}
```

## Troubleshooting

### Emails Not Sending

1. **Check provider configuration:**
   ```bash
   node scripts/testEmailProvider.js test@example.com
   ```

2. **Verify API key is valid:**
   - Resend: https://resend.com/api-keys
   - Unosend: https://unosend.com/settings/api

3. **Check backend logs:**
   ```bash
   tail -f logs/backend.log
   ```

4. **Test with curl** (see examples above)

### Wrong Provider Being Used

Check your `.env` file:
```bash
grep MAIL_PROVIDER .env
```

Should output:
```
MAIL_PROVIDER=resend
```

### Backward Compatibility Issues

If you had Resend working before:
- Your existing `RESEND_API_KEY` will continue to work
- No need to set `MAIL_PROVIDER` (defaults to `resend`)
- All existing code paths remain unchanged

## Advanced Configuration

### Custom Unosend Base URL

If using a self-hosted Unosend instance:

```bash
UNOSEND_API_BASE_URL=https://mail.yourcompany.com/v1
```

### Multiple From Addresses

Override the default `EMAIL_FROM` per email:

```javascript
await sendEmail({
  from: 'billing@yourdomain.com',
  to: 'client@example.com',
  subject: 'Invoice',
  html: '<p>Your invoice...</p>'
});
```

### Provider-Specific Features

Both providers support:
- HTML emails ✓
- Plain text fallback ✓
- Multiple recipients ✓
- Custom headers (via raw API)

## Cost Comparison

| Provider | Free Tier | Pricing |
|----------|-----------|---------|
| **Resend** | 100 emails/day | $20/month for 50k emails |
| **Unosend** | 1,000 emails/month | $10/month for 10k emails |

## Support

- **Resend Docs:** https://resend.com/docs
- **Unosend Docs:** https://unosend.com/docs
- **LegalTrack Issues:** https://github.com/yourrepo/issues

## Migration Guide

### From Direct Resend to Mail Provider

If you have custom email code using Resend directly:

**Before:**
```javascript
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);
await resend.emails.send({ from, to, subject, html });
```

**After:**
```javascript
import { sendEmail } from './services/mailProvider.js';
await sendEmail({ from, to, subject, html });
```

### From Other Providers

1. Set up your Resend or Unosend account
2. Add credentials to `.env`
3. Update `MAIL_PROVIDER` variable
4. Test with the test script
5. Deploy!

## Security Best Practices

1. **Never commit API keys** - Use `.env` files (gitignored)
2. **Rotate keys regularly** - Update keys every 90 days
3. **Use environment-specific keys** - Different keys for dev/staging/prod
4. **Monitor usage** - Set up alerts for unusual activity
5. **Validate sender domains** - Configure SPF/DKIM records

## Next Steps

1. ✅ Configure your preferred provider
2. ✅ Run the test script
3. ✅ Send a test email through the app
4. ✅ Monitor logs for any issues
5. ✅ Set up production credentials

---

**Need help?** Check the troubleshooting section or open an issue on GitHub.
