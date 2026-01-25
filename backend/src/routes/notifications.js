import express from 'express';
import { runScheduledNotifications } from '../services/notificationService.js';
import { getCronJobStatus, triggerDailyNotifications } from '../services/cronService.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Manually trigger all scheduled notifications (admin only)
router.post('/run-scheduled', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const results = await triggerDailyNotifications();
    res.json({ 
      success: true, 
      message: 'Scheduled notifications sent',
      results 
    });
  } catch (error) {
    console.error('Error running scheduled notifications:', error);
    res.status(500).json({ error: 'Failed to send notifications' });
  }
});

// Get cron job status (admin only)
router.get('/cron-status', authenticateToken, requireAdmin, (req, res) => {
  try {
    const status = getCronJobStatus();
    res.json({ success: true, jobs: status });
  } catch (error) {
    console.error('Error getting cron status:', error);
    res.status(500).json({ error: 'Failed to get cron status' });
  }
});

// Health check endpoint for cron jobs
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
