import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Helper: send notification for @mentions
async function notifyMentions(mentions, entryTitle, commenterName, caseId) {
  if (!mentions || mentions.length === 0) return;
  try {
    for (const userId of mentions) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
      if (user) {
        await prisma.notificationLog.create({
          data: {
            userId,
            recipientEmail: user.email,
            recipientName: user.name,
            type: 'runsheet_mention',
            subject: `${commenterName} mentioned you in "${entryTitle}"`,
            status: 'sent',
            metadata: { caseId, entryTitle }
          }
        });
      }
    }
  } catch (err) {
    console.error('Error sending mention notifications:', err);
  }
}

// Get all runsheet entries for a case (unified activity log)
router.get('/case/:caseId', authenticateToken, async (req, res) => {
  try {
    const { caseId } = req.params;
    
    // Fetch runsheet entries with their comment threads
    const runsheetEntries = await prisma.runsheetEntry.findMany({
      where: { caseId },
      include: {
        comments: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Fetch time entries for this case
    const timeEntries = await prisma.timeEntry.findMany({
      where: { matterId: caseId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        billingCode: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Fetch case comments
    const caseComments = await prisma.caseComment.findMany({
      where: { caseId },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } }
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
        source: 'runsheet',
        comments: entry.comments || []
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
        source: 'time_entry',
        comments: []
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
        source: 'comment',
        comments: []
      }))
    ];
    
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
      },
      include: { comments: true }
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
      data: { title, description },
      include: { comments: true }
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
    await prisma.runsheetEntry.delete({ where: { id } });
    res.json({ message: 'Runsheet entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting runsheet entry:', error);
    res.status(500).json({ error: 'Failed to delete runsheet entry' });
  }
});

// ---- Runsheet Entry Comment Threads ----

// Get comments for a runsheet entry
router.get('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const comments = await prisma.runsheetComment.findMany({
      where: { runsheetEntryId: id },
      orderBy: { createdAt: 'asc' }
    });
    // Build threaded structure
    const topLevel = comments.filter(c => !c.parentId);
    const replies = comments.filter(c => c.parentId);
    const threaded = topLevel.map(c => ({
      ...c,
      replies: replies.filter(r => r.parentId === c.id)
    }));
    res.json(threaded);
  } catch (error) {
    console.error('Error fetching runsheet comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Add a comment (or reply) to a runsheet entry
router.post('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, mentions, parentId } = req.body;
    const userId = req.user.userId;

    const entry = await prisma.runsheetEntry.findUnique({ where: { id } });
    if (!entry) return res.status(404).json({ error: 'Runsheet entry not found' });

    const newComment = await prisma.runsheetComment.create({
      data: {
        runsheetEntryId: id,
        parentId: parentId || null,
        userId,
        userName: req.user.name,
        comment,
        mentions: mentions || []
      }
    });

    // Send notifications for @mentions
    await notifyMentions(mentions, entry.title, req.user.name, entry.caseId);

    res.status(201).json(newComment);
  } catch (error) {
    console.error('Error adding runsheet comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Delete a runsheet comment
router.delete('/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    await prisma.runsheetComment.delete({ where: { id: commentId } });
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    console.error('Error deleting runsheet comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

export default router;
