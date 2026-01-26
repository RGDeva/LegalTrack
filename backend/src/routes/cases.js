import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', verifyToken, async (req, res) => {
  try {
    const cases = await prisma.case.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(cases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    console.log('Creating case with body:', JSON.stringify(req.body, null, 2));
    
    const { title, clientId, clientName, status, type, priority, description, matterNumber, assignedTo, billingType, hourlyRate, nextHearing } = req.body;
    
    // Generate case number if not provided
    const caseNumber = matterNumber || `CASE-${Date.now()}`;
    
    const caseData = await prisma.case.create({
      data: {
        caseNumber,
        title: title || 'Untitled Case',
        clientId: clientId || null,
        clientName: clientName || null,
        status: status || 'Active',
        type: type || 'General',
        priority: priority || 'Medium',
        description: description || null,
        assignedTo: assignedTo || null,
        billingType: billingType || null,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        nextHearing: nextHearing ? new Date(nextHearing) : null,
        dateOpened: new Date()
      }
    });
    console.log('Case created successfully:', caseData.id);
    res.status(201).json(caseData);
  } catch (error) {
    console.error('Case creation error:', error);
    res.status(500).json({ error: error.message, details: error.toString() });
  }
});

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const caseData = await prisma.case.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(caseData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await prisma.case.delete({ where: { id: req.params.id } });
    res.json({ message: 'Case deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET comments for a case
router.get('/:id/comments', verifyToken, async (req, res) => {
  try {
    const comments = await prisma.caseComment.findMany({
      where: { caseId: req.params.id },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST add comment to case
router.post('/:id/comments', verifyToken, async (req, res) => {
  try {
    const { comment } = req.body;
    if (!comment || !comment.trim()) {
      return res.status(400).json({ error: 'Comment is required' });
    }
    
    const newComment = await prisma.caseComment.create({
      data: {
        caseId: req.params.id,
        userId: req.user.id,
        comment: comment.trim()
      },
      include: { user: { select: { id: true, name: true, email: true, role: true } } }
    });
    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update comment
router.put('/:caseId/comments/:commentId', verifyToken, async (req, res) => {
  try {
    const { comment } = req.body;
    const existingComment = await prisma.caseComment.findUnique({
      where: { id: req.params.commentId }
    });
    
    if (!existingComment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    if (existingComment.userId !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own comments' });
    }
    
    const updatedComment = await prisma.caseComment.update({
      where: { id: req.params.commentId },
      data: { comment },
      include: { user: { select: { id: true, name: true, email: true, role: true } } }
    });
    res.json(updatedComment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE comment
router.delete('/:caseId/comments/:commentId', verifyToken, async (req, res) => {
  try {
    const existingComment = await prisma.caseComment.findUnique({
      where: { id: req.params.commentId }
    });
    
    if (!existingComment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    if (existingComment.userId !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'You can only delete your own comments' });
    }
    
    await prisma.caseComment.delete({ where: { id: req.params.commentId } });
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
