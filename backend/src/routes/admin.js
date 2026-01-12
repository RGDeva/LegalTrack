import express from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.delete('/clear-all-data', verifyToken, verifyAdmin, async (req, res) => {
  try {
    await prisma.timeEntry.deleteMany({});
    await prisma.document.deleteMany({});
    await prisma.invoice.deleteMany({});
    await prisma.case.deleteMany({});
    await prisma.contact.deleteMany({});
    await prisma.user.deleteMany({ where: { role: { not: 'Admin' } } });
    
    res.json({ message: 'All data cleared successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/seed-admin', async (req, res) => {
  try {
    const existing = await prisma.user.findUnique({
      where: { email: process.env.ADMIN_EMAIL }
    });
    
    if (existing) {
      return res.json({ message: 'Admin already exists', user: existing });
    }
    
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
    const admin = await prisma.user.create({
      data: {
        email: process.env.ADMIN_EMAIL,
        password: hashedPassword,
        name: 'Dylan Barrett',
        role: 'Admin',
        department: 'Administration',
        status: 'active'
      }
    });
    
    res.status(201).json({ message: 'Admin created', user: admin });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/stats', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const stats = {
      users: await prisma.user.count(),
      cases: await prisma.case.count(),
      contacts: await prisma.contact.count(),
      invoices: await prisma.invoice.count(),
      documents: await prisma.document.count(),
      tasks: await prisma.task.count()
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all users (Admin only)
router.get('/users', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create user (Admin only)
router.post('/users', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const hashedPassword = req.body.password 
      ? await bcrypt.hash(req.body.password, 10)
      : null;
    
    const user = await prisma.user.create({
      data: {
        ...req.body,
        password: hashedPassword
      }
    });
    
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE user (Admin only)
router.delete('/users/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    // Prevent deleting the admin account
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (user.email === process.env.ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Cannot delete admin account' });
    }
    
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
