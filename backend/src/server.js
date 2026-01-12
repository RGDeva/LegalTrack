import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: [
    'http://localhost:8080', 
    'http://localhost:8081',
    'https://legaltrack.vercel.app',
    'https://*.vercel.app'
  ],
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
