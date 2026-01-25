import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Log a sent notification
export const logNotification = async (type, recipientEmail, recipientName, subject, metadata = {}, userId = null) => {
  try {
    const log = await prisma.notificationLog.create({
      data: {
        type,
        recipientEmail,
        recipientName,
        subject,
        status: 'sent',
        metadata,
        userId
      }
    });
    return log;
  } catch (error) {
    console.error('Error logging notification:', error);
    // Don't throw - logging shouldn't break email sending
  }
};

// Log a failed notification
export const logFailedNotification = async (type, recipientEmail, recipientName, subject, error, metadata = {}, userId = null) => {
  try {
    await prisma.notificationLog.create({
      data: {
        type,
        recipientEmail,
        recipientName,
        subject,
        status: 'failed',
        metadata: { ...metadata, error: error.message },
        userId
      }
    });
  } catch (err) {
    console.error('Error logging failed notification:', err);
  }
};

// Get notification history for a user
export const getUserNotifications = async (userId, limit = 50) => {
  try {
    return await prisma.notificationLog.findMany({
      where: { userId },
      orderBy: { sentAt: 'desc' },
      take: limit
    });
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    return [];
  }
};

// Get all notifications (admin)
export const getAllNotifications = async (filters = {}, limit = 100, offset = 0) => {
  try {
    const where = {};
    
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;
    if (filters.startDate) {
      where.sentAt = { gte: new Date(filters.startDate) };
    }
    if (filters.endDate) {
      where.sentAt = { ...where.sentAt, lte: new Date(filters.endDate) };
    }

    const [notifications, total] = await Promise.all([
      prisma.notificationLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { sentAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.notificationLog.count({ where })
    ]);

    return { notifications, total };
  } catch (error) {
    console.error('Error fetching all notifications:', error);
    return { notifications: [], total: 0 };
  }
};

// Get notification statistics
export const getNotificationStats = async (days = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [total, byType, byStatus] = await Promise.all([
      prisma.notificationLog.count({
        where: { sentAt: { gte: startDate } }
      }),
      prisma.notificationLog.groupBy({
        by: ['type'],
        where: { sentAt: { gte: startDate } },
        _count: true
      }),
      prisma.notificationLog.groupBy({
        by: ['status'],
        where: { sentAt: { gte: startDate } },
        _count: true
      })
    ]);

    return {
      total,
      byType: byType.reduce((acc, item) => {
        acc[item.type] = item._count;
        return acc;
      }, {}),
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {}),
      period: `Last ${days} days`
    };
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    return { total: 0, byType: {}, byStatus: {}, period: `Last ${days} days` };
  }
};
