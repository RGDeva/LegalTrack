import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET all tasks
router.get('/', verifyToken, async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        assignedTo: true,
        createdBy: true,
        case: true,
        comments: {
          include: { user: true },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET tasks by user
router.get('/my-tasks', verifyToken, async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { assignedToId: req.user.id },
      include: {
        assignedTo: true,
        createdBy: true,
        case: true,
        comments: {
          include: { user: true },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create task
router.post('/', verifyToken, async (req, res) => {
  try {
    const task = await prisma.task.create({
      data: {
        ...req.body,
        createdById: req.user.id
      },
      include: {
        assignedTo: true,
        createdBy: true,
        case: true
      }
    });
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update task
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        assignedTo: true,
        createdBy: true,
        case: true,
        comments: {
          include: { user: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE task
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST add comment to task
router.post('/:id/comments', verifyToken, async (req, res) => {
  try {
    const comment = await prisma.taskComment.create({
      data: {
        taskId: req.params.id,
        userId: req.user.id,
        comment: req.body.comment
      },
      include: { user: true }
    });
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET comments for task
router.get('/:id/comments', verifyToken, async (req, res) => {
  try {
    const comments = await prisma.taskComment.findMany({
      where: { taskId: req.params.id },
      include: { user: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
