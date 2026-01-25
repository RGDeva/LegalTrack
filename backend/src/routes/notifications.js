import express from 'express';
import { runScheduledNotifications } from '../services/notificationService.js';
import { getCronJobStatus, triggerDailyNotifications } from '../services/cronService.js';
import { getAllNotifications, getNotificationStats } from '../services/notificationLogger.js';
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

// Get all notification logs (admin only)
router.get('/logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const filters = {
      type: req.query.type,
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const result = await getAllNotifications(filters, limit, offset);
    res.json(result);
  } catch (error) {
    console.error('Error fetching notification logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Get notification statistics (admin only)
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const stats = await getNotificationStats(days);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Health check endpoint for cron jobs
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
