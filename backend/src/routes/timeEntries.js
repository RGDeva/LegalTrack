import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/auth.js';
import { processTimeEntry, calculateRawMinutes, calculateBilledMinutes, calculateAmountCents } from '../utils/billing.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET all time entries
router.get('/', verifyToken, async (req, res) => {
  try {
    const entries = await prisma.timeEntry.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        billingCode: true,
        matter: { select: { id: true, title: true, caseNumber: true } },
        task: { select: { id: true, title: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to most recent 50 entries
    });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all time entries for a matter
router.get('/matter/:matterId', verifyToken, async (req, res) => {
  try {
    const entries = await prisma.timeEntry.findMany({
      where: { matterId: req.params.matterId },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        billingCode: true,
        task: { select: { id: true, title: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET running timer for current user
router.get('/running', verifyToken, async (req, res) => {
  try {
    const runningEntry = await prisma.timeEntry.findFirst({
      where: {
        userId: req.user.id,
        endedAt: null,
        startedAt: { not: null }
      },
      include: {
        matter: { select: { id: true, title: true, caseNumber: true } },
        billingCode: true
      }
    });
    res.json(runningEntry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST start timer
router.post('/start', verifyToken, async (req, res) => {
  try {
    const { matterId, description, taskId, billingCodeId } = req.body;
    
    // Check if there's already a running timer
    const existing = await prisma.timeEntry.findFirst({
      where: {
        userId: req.user.id,
        endedAt: null,
        startedAt: { not: null }
      }
    });
    
    if (existing) {
      return res.status(400).json({ error: 'Timer already running' });
    }
    
    const entry = await prisma.timeEntry.create({
      data: {
        userId: req.user.id,
        matterId,
        taskId,
        billingCodeId,
        description: description || '',
        startedAt: new Date(),
        durationMinutesBilled: 0,
        rateCentsApplied: 0,
        amountCents: 0,
        status: 'draft',
        tags: []
      },
      include: {
        matter: true,
        billingCode: true,
        user: true
      }
    });
    
    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST stop timer
router.post('/stop/:id', verifyToken, async (req, res) => {
  try {
    const { billingCodeId } = req.body;
    
    const entry = await prisma.timeEntry.findUnique({
      where: { id: req.params.id },
      include: { user: true, billingCode: true }
    });
    
    if (!entry) {
      return res.status(404).json({ error: 'Time entry not found' });
    }
    
    if (entry.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    if (entry.endedAt) {
      return res.status(400).json({ error: 'Timer already stopped' });
    }
    
    const endedAt = new Date();
    const rawMinutes = calculateRawMinutes(entry.startedAt, endedAt);
    const billedMinutes = calculateBilledMinutes(rawMinutes);
    
    // Get billing code if provided
    let billingCode = entry.billingCode;
    if (billingCodeId && billingCodeId !== entry.billingCodeId) {
      billingCode = await prisma.billingCode.findUnique({
        where: { id: billingCodeId }
      });
    }
    
    // Get role rates
    const roleRates = {};
    const rates = await prisma.roleRate.findMany();
    rates.forEach(r => { roleRates[r.role] = r.rateCents; });
    
    // Process entry to calculate billing
    const processed = processTimeEntry(
      { ...entry, endedAt, durationMinutesRaw: rawMinutes, billingCodeId },
      entry.user,
      billingCode,
      roleRates
    );
    
    const updated = await prisma.timeEntry.update({
      where: { id: req.params.id },
      data: {
        endedAt,
        durationMinutesRaw: processed.durationMinutesRaw,
        durationMinutesBilled: processed.durationMinutesBilled,
        rateCentsApplied: processed.rateCentsApplied,
        amountCents: processed.amountCents,
        billingCodeId: billingCodeId || entry.billingCodeId
      },
      include: {
        user: true,
        billingCode: true,
        matter: true,
        task: true
      }
    });
    
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST manual time entry
router.post('/manual', verifyToken, async (req, res) => {
  try {
    const { matterId, description, durationMinutesRaw, billingCodeId, taskId, tags } = req.body;
    
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    
    let billingCode = null;
    if (billingCodeId) {
      billingCode = await prisma.billingCode.findUnique({ where: { id: billingCodeId } });
    }
    
    // Get role rates
    const roleRates = {};
    const rates = await prisma.roleRate.findMany();
    rates.forEach(r => { roleRates[r.role] = r.rateCents; });
    
    // Process entry
    const processed = processTimeEntry(
      { durationMinutesRaw, description, matterId, taskId, billingCodeId, tags: tags || [] },
      user,
      billingCode,
      roleRates
    );
    
    const entry = await prisma.timeEntry.create({
      data: {
        userId: req.user.id,
        matterId,
        taskId,
        billingCodeId,
        description: description || '',
        durationMinutesRaw: processed.durationMinutesRaw,
        durationMinutesBilled: processed.durationMinutesBilled,
        rateCentsApplied: processed.rateCentsApplied,
        amountCents: processed.amountCents,
        status: 'draft',
        tags: processed.tags
      },
      include: {
        user: true,
        billingCode: true,
        matter: true,
        task: true
      }
    });
    
    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update time entry
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { description, billingCodeId, tags, recalculateRate } = req.body;
    
    const entry = await prisma.timeEntry.findUnique({
      where: { id: req.params.id },
      include: { user: true, billingCode: true }
    });
    
    if (!entry) {
      return res.status(404).json({ error: 'Time entry not found' });
    }
    
    if (entry.status === 'billed') {
      return res.status(400).json({ error: 'Cannot edit billed time entry' });
    }
    
    let updateData = {
      description: description !== undefined ? description : entry.description,
      billingCodeId: billingCodeId !== undefined ? billingCodeId : entry.billingCodeId,
      tags: tags !== undefined ? tags : entry.tags
    };
    
    // If recalculating rate or billing code changed
    if (recalculateRate || (billingCodeId && billingCodeId !== entry.billingCodeId)) {
      let billingCode = null;
      if (billingCodeId) {
        billingCode = await prisma.billingCode.findUnique({ where: { id: billingCodeId } });
      }
      
      const roleRates = {};
      const rates = await prisma.roleRate.findMany();
      rates.forEach(r => { roleRates[r.role] = r.rateCents; });
      
      const processed = processTimeEntry(
        { ...entry, billingCodeId },
        entry.user,
        billingCode,
        roleRates
      );
      
      updateData.rateCentsApplied = processed.rateCentsApplied;
      updateData.amountCents = processed.amountCents;
    }
    
    const updated = await prisma.timeEntry.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        user: true,
        billingCode: true,
        matter: true,
        task: true
      }
    });
    
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE time entry
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const entry = await prisma.timeEntry.findUnique({
      where: { id: req.params.id }
    });
    
    if (!entry) {
      return res.status(404).json({ error: 'Time entry not found' });
    }
    
    if (entry.status === 'billed') {
      return res.status(400).json({ error: 'Cannot delete billed time entry' });
    }
    
    await prisma.timeEntry.delete({ where: { id: req.params.id } });
    res.json({ message: 'Time entry deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
