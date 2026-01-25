import express from 'express';
import { runScheduledNotifications } from '../services/notificationService.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Manually trigger all scheduled notifications (admin only)
router.post('/run-scheduled', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const results = await runScheduledNotifications();
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

// Health check endpoint for cron jobs
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
