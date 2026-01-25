import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

console.log('Starting LegalTrack API v2.2...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('GOOGLE_SERVICE_ACCOUNT_EMAIL exists:', !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
console.log('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY exists:', !!process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY);
console.log('GOOGLE_DRIVE_FOLDER_ID exists:', !!process.env.GOOGLE_DRIVE_FOLDER_ID);

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

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
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
if (googleDriveRoutes) {
  app.use('/api/google-drive', googleDriveRoutes);
  console.log('Google Drive routes registered');
}
if (googleCalendarRoutes) {
  app.use('/api/google-calendar', googleCalendarRoutes);
  console.log('Google Calendar routes registered');
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 LegalTrack API running on port ${PORT}`);
});
