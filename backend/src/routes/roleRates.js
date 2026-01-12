import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET all role rates
router.get('/', verifyToken, async (req, res) => {
  try {
    const rates = await prisma.roleRate.findMany();
    res.json(rates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create or update role rate
router.post('/', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { role, rateCents } = req.body;
    
    const rate = await prisma.roleRate.upsert({
      where: { role },
      update: { rateCents },
      create: { role, rateCents }
    });
    
    res.json(rate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
