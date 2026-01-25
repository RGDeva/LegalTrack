import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', verifyToken, async (req, res) => {
  try {
    const contacts = await prisma.contact.findMany({ orderBy: { name: 'asc' } });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { 
      name, email, phone, mobile, organization, title, role, 
      address, city, state, zip, category, notes, tags,
      crmStage, crmSource, crmValue, crmProbability, crmExpectedCloseDate
    } = req.body;
    
    const contact = await prisma.contact.create({
      data: {
        name: name || 'Unnamed Contact',
        email: email || `contact-${Date.now()}@example.com`,
        phone: phone || null,
        mobile: mobile || null,
        organization: organization || null,
        title: title || null,
        role: role || null,
        address: address || null,
        city: city || null,
        state: state || null,
        zip: zip || null,
        category: category || null,
        notes: notes || null,
        tags: tags || [],
        crmStage: crmStage || 'open',
        crmSource: crmSource || null,
        crmValue: crmValue ? parseFloat(crmValue) : null,
        crmProbability: crmProbability ? parseInt(crmProbability) : null,
        crmExpectedCloseDate: crmExpectedCloseDate ? new Date(crmExpectedCloseDate) : null,
        crmLastActivityDate: new Date()
      }
    });
    res.status(201).json(contact);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const contact = await prisma.contact.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(contact);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await prisma.contact.delete({ where: { id: req.params.id } });
    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
