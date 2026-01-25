import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get user notification preferences
router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        emailNotifications: true,
        notifyInvoices: true,
        notifyDeadlines: true,
        notifyTasks: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

// Update user notification preferences
router.put('/notifications', authenticateToken, async (req, res) => {
  try {
    const { emailNotifications, notifyInvoices, notifyDeadlines, notifyTasks } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        emailNotifications: emailNotifications !== undefined ? emailNotifications : undefined,
        notifyInvoices: notifyInvoices !== undefined ? notifyInvoices : undefined,
        notifyDeadlines: notifyDeadlines !== undefined ? notifyDeadlines : undefined,
        notifyTasks: notifyTasks !== undefined ? notifyTasks : undefined
      },
      select: {
        emailNotifications: true,
        notifyInvoices: true,
        notifyDeadlines: true,
        notifyTasks: true
      }
    });

    res.json({ success: true, preferences: user });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Get user notification history
router.get('/notification-history', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const [notifications, total] = await Promise.all([
      prisma.notificationLog.findMany({
        where: { userId: req.user.id },
        orderBy: { sentAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.notificationLog.count({
        where: { userId: req.user.id }
      })
    ]);

    res.json({ notifications, total, limit, offset });
  } catch (error) {
    console.error('Error fetching notification history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

export default router;
