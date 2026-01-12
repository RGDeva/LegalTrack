import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET all billing codes
router.get('/', verifyToken, async (req, res) => {
  try {
    const codes = await prisma.billingCode.findMany({
      orderBy: { code: 'asc' }
    });
    res.json(codes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET active billing codes
router.get('/active', verifyToken, async (req, res) => {
  try {
    const codes = await prisma.billingCode.findMany({
      where: { active: true },
      orderBy: { code: 'asc' }
    });
    res.json(codes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create billing code
router.post('/', verifyToken, async (req, res) => {
  try {
    const code = await prisma.billingCode.create({
      data: req.body
    });
    res.status(201).json(code);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update billing code
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const code = await prisma.billingCode.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(code);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE billing code
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await prisma.billingCode.delete({ where: { id: req.params.id } });
    res.json({ message: 'Billing code deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
