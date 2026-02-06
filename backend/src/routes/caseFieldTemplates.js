import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all templates
router.get('/', authenticateToken, async (req, res) => {
  try {
    const templates = await prisma.caseFieldTemplate.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Get templates by case type
router.get('/type/:caseType', authenticateToken, async (req, res) => {
  try {
    const { caseType } = req.params;
    
    const templates = await prisma.caseFieldTemplate.findMany({
      where: { caseType },
      orderBy: { isDefault: 'desc' }
    });
    
    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Get a single template
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const template = await prisma.caseFieldTemplate.findUnique({
      where: { id }
    });
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// Create a new template
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, caseType, fields, isDefault } = req.body;
    
    // If setting as default, unset other defaults for this case type
    if (isDefault) {
      await prisma.caseFieldTemplate.updateMany({
        where: { caseType, isDefault: true },
        data: { isDefault: false }
      });
    }
    
    const template = await prisma.caseFieldTemplate.create({
      data: {
        name,
        caseType,
        fields,
        isDefault: isDefault || false
      }
    });
    
    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// Update a template
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, caseType, fields, isDefault } = req.body;
    
    // If setting as default, unset other defaults for this case type
    if (isDefault) {
      await prisma.caseFieldTemplate.updateMany({
        where: { 
          caseType, 
          isDefault: true,
          NOT: { id }
        },
        data: { isDefault: false }
      });
    }
    
    const template = await prisma.caseFieldTemplate.update({
      where: { id },
      data: {
        name,
        caseType,
        fields,
        isDefault
      }
    });
    
    res.json(template);
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// Delete a template
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.caseFieldTemplate.delete({
      where: { id }
    });
    
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

// Update case custom fields
router.put('/case/:caseId/fields', authenticateToken, async (req, res) => {
  try {
    const { caseId } = req.params;
    const { customFields } = req.body;
    
    const updatedCase = await prisma.case.update({
      where: { id: caseId },
      data: { customFields }
    });
    
    res.json(updatedCase);
  } catch (error) {
    console.error('Error updating case fields:', error);
    res.status(500).json({ error: 'Failed to update case fields' });
  }
});

// Get case custom fields
router.get('/case/:caseId/fields', authenticateToken, async (req, res) => {
  try {
    const { caseId } = req.params;
    
    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
      select: { customFields: true, type: true }
    });
    
    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }
    
    res.json(caseData);
  } catch (error) {
    console.error('Error fetching case fields:', error);
    res.status(500).json({ error: 'Failed to fetch case fields' });
  }
});

export default router;
