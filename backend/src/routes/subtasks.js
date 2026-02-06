import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all subtasks for a task
router.get('/task/:taskId', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    
    const subtasks = await prisma.subtask.findMany({
      where: { taskId },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        comments: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { orderIndex: 'asc' }
    });
    
    res.json(subtasks);
  } catch (error) {
    console.error('Error fetching subtasks:', error);
    res.status(500).json({ error: 'Failed to fetch subtasks' });
  }
});

// Create a new subtask
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, taskId, assignedToId, dueDate, orderIndex } = req.body;
    const userId = req.user.userId;
    
    // Get the task to find the case ID for runsheet entry
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { case: true }
    });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const subtask = await prisma.subtask.create({
      data: {
        title,
        description,
        taskId,
        assignedToId,
        dueDate: dueDate ? new Date(dueDate) : null,
        orderIndex: orderIndex || 0,
        createdById: userId
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });
    
    // Create runsheet entry if task has a case
    if (task.caseId) {
      await prisma.runsheetEntry.create({
        data: {
          caseId: task.caseId,
          type: 'subtask_created',
          title: `Subtask created: ${title}`,
          description: description,
          userId: userId,
          userName: req.user.name,
          metadata: {
            subtaskId: subtask.id,
            taskId: taskId,
            taskTitle: task.title
          }
        }
      });
    }
    
    res.status(201).json(subtask);
  } catch (error) {
    console.error('Error creating subtask:', error);
    res.status(500).json({ error: 'Failed to create subtask' });
  }
});

// Update a subtask
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, assignedToId, dueDate, orderIndex } = req.body;
    const userId = req.user.userId;
    
    const existingSubtask = await prisma.subtask.findUnique({
      where: { id },
      include: { task: { include: { case: true } } }
    });
    
    if (!existingSubtask) {
      return res.status(404).json({ error: 'Subtask not found' });
    }
    
    const wasCompleted = existingSubtask.status === 'completed';
    const isNowCompleted = status === 'completed';
    
    const subtask = await prisma.subtask.update({
      where: { id },
      data: {
        title,
        description,
        status,
        assignedToId,
        dueDate: dueDate ? new Date(dueDate) : null,
        orderIndex,
        completedAt: isNowCompleted && !wasCompleted ? new Date() : existingSubtask.completedAt
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });
    
    // Create runsheet entry if subtask was just completed
    if (isNowCompleted && !wasCompleted && existingSubtask.task.caseId) {
      await prisma.runsheetEntry.create({
        data: {
          caseId: existingSubtask.task.caseId,
          type: 'subtask_completed',
          title: `Subtask completed: ${title}`,
          description: description,
          userId: userId,
          userName: req.user.name,
          metadata: {
            subtaskId: id,
            taskId: existingSubtask.taskId,
            taskTitle: existingSubtask.task.title
          }
        }
      });
    }
    
    res.json(subtask);
  } catch (error) {
    console.error('Error updating subtask:', error);
    res.status(500).json({ error: 'Failed to update subtask' });
  }
});

// Delete a subtask
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.subtask.delete({
      where: { id }
    });
    
    res.json({ message: 'Subtask deleted successfully' });
  } catch (error) {
    console.error('Error deleting subtask:', error);
    res.status(500).json({ error: 'Failed to delete subtask' });
  }
});

// Add a comment to a subtask
router.post('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, mentions } = req.body;
    const userId = req.user.userId;
    
    const subtaskComment = await prisma.subtaskComment.create({
      data: {
        subtaskId: id,
        userId,
        comment,
        mentions: mentions || []
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    });
    
    // TODO: Send notifications to mentioned users
    
    res.status(201).json(subtaskComment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Get comments for a subtask
router.get('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const comments = await prisma.subtaskComment.findMany({
      where: { subtaskId: id },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
    
    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

export default router;
