import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

console.log('Starting LegalTrack API v2.4...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('GOOGLE_SERVICE_ACCOUNT_EMAIL exists:', !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
console.log('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY exists:', !!process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY);
console.log('GOOGLE_DRIVE_FOLDER_ID exists:', !!process.env.GOOGLE_DRIVE_FOLDER_ID);
console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
console.log('GOOGLE_CLIENT_ID exists:', !!process.env.GOOGLE_CLIENT_ID);
console.log('GOOGLE_CLIENT_ID prefix:', process.env.GOOGLE_CLIENT_ID?.substring(0, 15) || 'missing');
console.log('GOOGLE_CLIENT_SECRET exists:', !!process.env.GOOGLE_CLIENT_SECRET);
console.log('GOOGLE_CLIENT_SECRET prefix:', process.env.GOOGLE_CLIENT_SECRET?.substring(0, 10) || 'missing');
console.log('GOOGLE_REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI || 'not set (using fallback)');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || 'not set');

// Allowed origins for CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://legal-track-nine.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

// Rate limiting configurations
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window per IP
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per 15 minutes
  message: { error: 'Too many login attempts, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
});

const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute (for sensitive operations)
  message: { error: 'Rate limit exceeded for this operation.' },
  standardHeaders: true,
  legacyHeaders: false,
});

import authRoutes from './routes/auth.js';
import caseRoutes from './routes/cases.js';
import contactRoutes from './routes/contacts.js';
import staffRoutes from './routes/staff.js';
import invoiceRoutes from './routes/invoices.js';
import documentRoutes from './routes/documents.js';
import adminRoutes from './routes/admin.js';
import taskRoutes from './routes/tasks.js';
import timeEntriesRoutes from './routes/timeEntries.js';
import billingCodesRoutes from './routes/billingCodes.js';
import roleRatesRoutes from './routes/roleRates.js';
import invoiceDocxRoutes from './routes/invoiceDocx.js';
import notificationRoutes from './routes/notifications.js';
import userSettingsRoutes from './routes/userSettings.js';
import invitationRoutes from './routes/invitations.js';
import subtasksRoutes from './routes/subtasks.js';
import runsheetRoutes from './routes/runsheet.js';
import caseFieldTemplatesRoutes from './routes/caseFieldTemplates.js';
import leadFormsRoutes from './routes/leadForms.js';
import googleContactsRoutes from './routes/googleContacts.js';
import googleDriveCaseRoutes from './routes/googleDriveCase.js';
import voiceCaptureRoutes from './routes/voiceCapture.js';
import aiRoutes from './routes/ai.js';

// Conditionally import Google routes to prevent startup failures
let googleDriveRoutes = null;
let googleCalendarRoutes = null;

try {
  const driveModule = await import('./routes/googleDrive.js');
  googleDriveRoutes = driveModule.default;
  console.log('Google Drive routes imported successfully');
} catch (error) {
  console.error('Failed to import Google Drive routes:', error.message);
}

try {
  const calendarModule = await import('./routes/googleCalendar.js');
  googleCalendarRoutes = calendarModule.default;
  console.log('Google Calendar routes imported successfully');
} catch (error) {
  console.error('Failed to import Google Calendar routes:', error.message);
}

console.log('All core routes imported successfully');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
}));

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.) in development
    if (!origin && process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    // Check if origin is in allowed list
    if (!origin || allowedOrigins.some(allowed => origin.startsWith(allowed.replace(/\/$/, '')))) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(null, true); // Allow for now, log for monitoring
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Apply general rate limiting to all requests
app.use(generalLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply strict rate limiting to auth routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/time-entries', timeEntriesRoutes);
app.use('/api/billing-codes', billingCodesRoutes);
app.use('/api/role-rates', roleRatesRoutes);
app.use('/api/invoices', invoiceDocxRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/user/settings', userSettingsRoutes);
if (googleDriveRoutes) {
  app.use('/api/google-drive', googleDriveRoutes);
  console.log('Google Drive routes registered');
}
if (googleCalendarRoutes) {
  app.use('/api/google-calendar', googleCalendarRoutes);
  console.log('Google Calendar routes registered');
}

// Invitation routes
app.use('/api/invitations', invitationRoutes);

// Enhanced features routes
app.use('/api/subtasks', subtasksRoutes);
app.use('/api/runsheet', runsheetRoutes);
app.use('/api/case-field-templates', caseFieldTemplatesRoutes);
app.use('/api/lead-forms', leadFormsRoutes);
app.use('/api/google-contacts', googleContactsRoutes);
app.use('/api/google-drive-case', googleDriveCaseRoutes);
app.use('/api/voice-capture', voiceCaptureRoutes);
app.use('/api/ai', aiRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

// Import and start cron jobs
import { startCronJobs, stopCronJobs } from './services/cronService.js';

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 LegalTrack API running on port ${PORT}`);
  
  // Start automated cron jobs for notifications
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_CRON === 'true') {
    startCronJobs();
  } else {
    console.log('⚠️  Cron jobs disabled (set ENABLE_CRON=true to enable in development)');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  stopCronJobs();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  stopCronJobs();
  process.exit(0);
});
