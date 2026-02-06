import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all runsheet entries for a case (unified activity log)
router.get('/case/:caseId', authenticateToken, async (req, res) => {
  try {
    const { caseId } = req.params;
    
    // Fetch runsheet entries
    const runsheetEntries = await prisma.runsheetEntry.findMany({
      where: { caseId },
      orderBy: { createdAt: 'desc' }
    });
    
    // Fetch time entries for this case
    const timeEntries = await prisma.timeEntry.findMany({
      where: { matterId: caseId },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        billingCode: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Fetch case comments
    const caseComments = await prisma.caseComment.findMany({
      where: { caseId },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Combine all entries into a unified timeline
    const unifiedEntries = [
      ...runsheetEntries.map(entry => ({
        id: entry.id,
        type: entry.type,
        title: entry.title,
        description: entry.description,
        userId: entry.userId,
        userName: entry.userName,
        metadata: entry.metadata,
        createdAt: entry.createdAt,
        source: 'runsheet'
      })),
      ...timeEntries.map(entry => ({
        id: entry.id,
        type: 'time_entry',
        title: `Time Entry: ${entry.description.substring(0, 50)}${entry.description.length > 50 ? '...' : ''}`,
        description: entry.description,
        userId: entry.userId,
        userName: entry.user.name,
        metadata: {
          durationMinutes: entry.durationMinutesBilled,
          amountCents: entry.amountCents,
          billingCode: entry.billingCode?.code
        },
        createdAt: entry.createdAt,
        source: 'time_entry'
      })),
      ...caseComments.map(comment => ({
        id: comment.id,
        type: 'comment',
        title: 'Case Comment',
        description: comment.comment,
        userId: comment.userId,
        userName: comment.user.name,
        metadata: {},
        createdAt: comment.createdAt,
        source: 'comment'
      }))
    ];
    
    // Sort by createdAt descending
    unifiedEntries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json(unifiedEntries);
  } catch (error) {
    console.error('Error fetching runsheet:', error);
    res.status(500).json({ error: 'Failed to fetch runsheet' });
  }
});

// Create a manual runsheet entry
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { caseId, title, description } = req.body;
    const userId = req.user.userId;
    
    const entry = await prisma.runsheetEntry.create({
      data: {
        caseId,
        type: 'manual',
        title,
        description,
        userId,
        userName: req.user.name
      }
    });
    
    res.status(201).json(entry);
  } catch (error) {
    console.error('Error creating runsheet entry:', error);
    res.status(500).json({ error: 'Failed to create runsheet entry' });
  }
});

// Update a runsheet entry
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    
    const entry = await prisma.runsheetEntry.update({
      where: { id },
      data: { title, description }
    });
    
    res.json(entry);
  } catch (error) {
    console.error('Error updating runsheet entry:', error);
    res.status(500).json({ error: 'Failed to update runsheet entry' });
  }
});

// Delete a runsheet entry
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.runsheetEntry.delete({
      where: { id }
    });
    
    res.json({ message: 'Runsheet entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting runsheet entry:', error);
    res.status(500).json({ error: 'Failed to delete runsheet entry' });
  }
});

export default router;
