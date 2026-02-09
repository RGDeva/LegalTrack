import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/events - List events with optional date range filter
router.get('/', verifyToken, async (req, res) => {
  try {
    const { start, end, type, caseId } = req.query;

    const where = {};

    if (start || end) {
      where.startTime = {};
      if (start) where.startTime.gte = new Date(start);
      if (end) where.startTime.lte = new Date(end);
    }

    if (type && type !== 'all') {
      where.type = type;
    }

    if (caseId) {
      where.caseId = caseId;
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: { startTime: 'asc' }
    });

    res.json(events);
  } catch (error) {
    console.error('Events list error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/events/:id - Get single event
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/events - Create event
router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      title, description, startTime, endTime, allDay,
      location, type, color, caseId, assignedToId,
      recurrence, reminderMinutes
    } = req.body;

    if (!title || !startTime || !endTime) {
      return res.status(400).json({ error: 'Title, start time, and end time are required' });
    }

    const event = await prisma.event.create({
      data: {
        title,
        description: description || null,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        allDay: allDay || false,
        location: location || null,
        type: type || 'event',
        color: color || null,
        caseId: caseId || null,
        assignedToId: assignedToId || null,
        createdById: req.user.userId,
        recurrence: recurrence || null,
        reminderMinutes: reminderMinutes || null
      }
    });

    res.status(201).json(event);
  } catch (error) {
    console.error('Event create error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/events/:id - Update event
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const existing = await prisma.event.findUnique({
      where: { id: req.params.id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const {
      title, description, startTime, endTime, allDay,
      location, type, color, caseId, assignedToId,
      recurrence, reminderMinutes
    } = req.body;

    const event = await prisma.event.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(startTime !== undefined && { startTime: new Date(startTime) }),
        ...(endTime !== undefined && { endTime: new Date(endTime) }),
        ...(allDay !== undefined && { allDay }),
        ...(location !== undefined && { location }),
        ...(type !== undefined && { type }),
        ...(color !== undefined && { color }),
        ...(caseId !== undefined && { caseId: caseId || null }),
        ...(assignedToId !== undefined && { assignedToId: assignedToId || null }),
        ...(recurrence !== undefined && { recurrence }),
        ...(reminderMinutes !== undefined && { reminderMinutes })
      }
    });

    res.json(event);
  } catch (error) {
    console.error('Event update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/events/:id - Delete event
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const existing = await prisma.event.findUnique({
      where: { id: req.params.id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Event not found' });
    }

    await prisma.event.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Event deleted' });
  } catch (error) {
    console.error('Event delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/events/case/:caseId - Get events for a specific case
router.get('/case/:caseId', verifyToken, async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: { caseId: req.params.caseId },
      orderBy: { startTime: 'asc' }
    });

    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
