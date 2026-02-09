import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/dashboard/stats - Aggregated dashboard statistics
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      activeCases,
      totalContacts,
      monthlyTimeEntries,
      unbilledEntries,
      pendingInvoices,
      activeTimers,
      totalCases,
      overdueTasks
    ] = await Promise.all([
      // Active cases count
      prisma.case.count({
        where: { status: { in: ['Active', 'In Progress', 'Open'] } }
      }),
      // Total contacts
      prisma.contact.count(),
      // Monthly billable time entries
      prisma.timeEntry.aggregate({
        where: {
          createdAt: { gte: startOfMonth },
          durationMinutesBilled: { gt: 0 }
        },
        _sum: { durationMinutesBilled: true, amountCents: true }
      }),
      // Unbilled time entries (ready to invoice)
      prisma.timeEntry.aggregate({
        where: {
          invoiceId: null,
          durationMinutesBilled: { gt: 0 },
          amountCents: { gt: 0 }
        },
        _sum: { amountCents: true },
        _count: true
      }),
      // Pending invoices
      prisma.invoice.aggregate({
        where: { status: { in: ['Pending', 'Sent', 'Overdue'] } },
        _sum: { amount: true },
        _count: true
      }),
      // Active timers (started but not stopped)
      prisma.timeEntry.count({
        where: { startedAt: { not: null }, endedAt: null }
      }),
      // Total cases
      prisma.case.count(),
      // Overdue tasks
      prisma.task.count({
        where: {
          status: { not: 'completed' },
          dueDate: { lt: now }
        }
      })
    ]);

    const monthlyBillableMinutes = monthlyTimeEntries._sum.durationMinutesBilled || 0;
    const monthlyRevenueCents = monthlyTimeEntries._sum.amountCents || 0;

    res.json({
      activeCases,
      totalCases,
      totalContacts,
      monthlyBillableHours: +(monthlyBillableMinutes / 60).toFixed(1),
      monthlyRevenue: +(monthlyRevenueCents / 100).toFixed(2),
      amountReadyToInvoice: +((unbilledEntries._sum.amountCents || 0) / 100).toFixed(2),
      unbilledEntriesCount: unbilledEntries._count || 0,
      pendingInvoicesAmount: +(pendingInvoices._sum.amount || 0).toFixed(2),
      pendingInvoicesCount: pendingInvoices._count || 0,
      activeTimers,
      overdueTasks
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/dashboard/activity - Recent activity feed
router.get('/activity', verifyToken, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 15, 50);

    const [recentCases, recentContacts, recentTimeEntries, recentInvoices, recentTasks] = await Promise.all([
      prisma.case.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, title: true, type: true, status: true, createdAt: true }
      }),
      prisma.contact.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, organization: true, createdAt: true }
      }),
      prisma.timeEntry.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true, description: true, durationMinutesBilled: true,
          amountCents: true, createdAt: true,
          user: { select: { name: true } },
          matter: { select: { title: true, caseNumber: true } }
        }
      }),
      prisma.invoice.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, invoiceNumber: true, amount: true, status: true, createdAt: true }
      }),
      prisma.task.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true, title: true, status: true, createdAt: true,
          assignedTo: { select: { name: true } },
          case: { select: { title: true } }
        }
      })
    ]);

    // Merge and sort all activities
    const activities = [];

    recentCases.forEach(c => activities.push({
      id: `case-${c.id}`,
      type: 'case',
      title: 'Case opened',
      description: `${c.title} - ${c.type}`,
      status: c.status,
      createdAt: c.createdAt
    }));

    recentContacts.forEach(c => activities.push({
      id: `contact-${c.id}`,
      type: 'contact',
      title: 'Contact added',
      description: `${c.name}${c.organization ? ` - ${c.organization}` : ''}`,
      createdAt: c.createdAt
    }));

    recentTimeEntries.forEach(e => activities.push({
      id: `time-${e.id}`,
      type: 'time',
      title: 'Time logged',
      description: `${((e.durationMinutesBilled || 0) / 60).toFixed(1)}h - ${e.description || 'No description'}`,
      meta: e.matter ? `${e.matter.caseNumber}` : null,
      createdAt: e.createdAt
    }));

    recentInvoices.forEach(i => activities.push({
      id: `invoice-${i.id}`,
      type: 'invoice',
      title: 'Invoice created',
      description: `${i.invoiceNumber} - $${(i.amount || 0).toFixed(2)}`,
      status: i.status,
      createdAt: i.createdAt
    }));

    recentTasks.forEach(t => activities.push({
      id: `task-${t.id}`,
      type: 'task',
      title: t.status === 'completed' ? 'Task completed' : 'Task created',
      description: t.title,
      meta: t.case?.title || null,
      createdAt: t.createdAt
    }));

    activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(activities.slice(0, limit));
  } catch (error) {
    console.error('Dashboard activity error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/dashboard/deadlines - Upcoming deadlines
router.get('/deadlines', verifyToken, async (req, res) => {
  try {
    const now = new Date();
    const limit = Math.min(parseInt(req.query.limit) || 10, 30);

    const [hearings, tasks, events] = await Promise.all([
      // Cases with upcoming hearings
      prisma.case.findMany({
        where: {
          nextHearing: { gte: now },
          status: { in: ['Active', 'In Progress', 'Open'] }
        },
        orderBy: { nextHearing: 'asc' },
        take: limit,
        select: { id: true, title: true, caseNumber: true, nextHearing: true }
      }),
      // Tasks with upcoming due dates
      prisma.task.findMany({
        where: {
          dueDate: { gte: now },
          status: { not: 'completed' }
        },
        orderBy: { dueDate: 'asc' },
        take: limit,
        select: {
          id: true, title: true, dueDate: true, priority: true,
          case: { select: { title: true, caseNumber: true } },
          assignedTo: { select: { name: true } }
        }
      }),
      // Upcoming events from local Event model
      prisma.event.findMany({
        where: {
          startTime: { gte: now }
        },
        orderBy: { startTime: 'asc' },
        take: limit,
        select: { id: true, title: true, startTime: true, type: true, caseId: true }
      })
    ]);

    const deadlines = [];

    hearings.forEach(c => deadlines.push({
      id: `hearing-${c.id}`,
      type: 'hearing',
      title: 'Court Hearing',
      description: `${c.caseNumber} - ${c.title}`,
      date: c.nextHearing,
      priority: 'high'
    }));

    tasks.forEach(t => deadlines.push({
      id: `task-${t.id}`,
      type: 'task',
      title: t.title,
      description: t.case ? `${t.case.caseNumber} - ${t.case.title}` : '',
      date: t.dueDate,
      priority: t.priority,
      assignedTo: t.assignedTo?.name
    }));

    events.forEach(e => deadlines.push({
      id: `event-${e.id}`,
      type: e.type || 'event',
      title: e.title,
      description: '',
      date: e.startTime,
      priority: e.type === 'hearing' ? 'high' : 'medium'
    }));

    deadlines.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json(deadlines.slice(0, limit));
  } catch (error) {
    console.error('Dashboard deadlines error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
