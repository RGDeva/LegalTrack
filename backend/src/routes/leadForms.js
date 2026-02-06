import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Public endpoint - Submit a lead form (no auth required)
router.post('/submit', async (req, res) => {
  try {
    const { name, email, phone, message, customFields, source } = req.body;
    
    // Basic validation
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    
    // Check if contact with this email already exists
    let contact = await prisma.contact.findFirst({
      where: { email }
    });
    
    // Create lead form submission
    const submission = await prisma.leadFormSubmission.create({
      data: {
        name,
        email,
        phone,
        message,
        customFields,
        source,
        contactId: contact?.id,
        status: 'new'
      }
    });
    
    // If contact doesn't exist, create one as a lead
    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          name,
          email,
          phone,
          isLead: true,
          leadSource: 'web_form',
          leadCustomFields: customFields,
          crmStage: 'open',
          notes: message
        }
      });
      
      // Update submission with contact ID
      await prisma.leadFormSubmission.update({
        where: { id: submission.id },
        data: { contactId: contact.id }
      });
    }
    
    res.status(201).json({ 
      message: 'Lead submitted successfully',
      submissionId: submission.id
    });
  } catch (error) {
    console.error('Error submitting lead form:', error);
    res.status(500).json({ error: 'Failed to submit lead form' });
  }
});

// Get all lead submissions
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;
    
    const where = status ? { status } : {};
    
    const submissions = await prisma.leadFormSubmission.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(submissions);
  } catch (error) {
    console.error('Error fetching lead submissions:', error);
    res.status(500).json({ error: 'Failed to fetch lead submissions' });
  }
});

// Get a single lead submission
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const submission = await prisma.leadFormSubmission.findUnique({
      where: { id }
    });
    
    if (!submission) {
      return res.status(404).json({ error: 'Lead submission not found' });
    }
    
    res.json(submission);
  } catch (error) {
    console.error('Error fetching lead submission:', error);
    res.status(500).json({ error: 'Failed to fetch lead submission' });
  }
});

// Update lead submission status
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const submission = await prisma.leadFormSubmission.update({
      where: { id },
      data: { status }
    });
    
    res.json(submission);
  } catch (error) {
    console.error('Error updating lead submission:', error);
    res.status(500).json({ error: 'Failed to update lead submission' });
  }
});

// Convert lead to contact (if not already)
router.post('/:id/convert', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const submission = await prisma.leadFormSubmission.findUnique({
      where: { id }
    });
    
    if (!submission) {
      return res.status(404).json({ error: 'Lead submission not found' });
    }
    
    let contact;
    
    if (submission.contactId) {
      // Contact already exists, just update status
      contact = await prisma.contact.findUnique({
        where: { id: submission.contactId }
      });
    } else {
      // Create new contact
      contact = await prisma.contact.create({
        data: {
          name: submission.name,
          email: submission.email,
          phone: submission.phone,
          isLead: true,
          leadSource: 'web_form',
          leadCustomFields: submission.customFields,
          crmStage: 'open',
          notes: submission.message
        }
      });
      
      // Update submission with contact ID
      await prisma.leadFormSubmission.update({
        where: { id },
        data: { 
          contactId: contact.id,
          status: 'converted'
        }
      });
    }
    
    res.json({ contact, submission });
  } catch (error) {
    console.error('Error converting lead:', error);
    res.status(500).json({ error: 'Failed to convert lead' });
  }
});

// Delete a lead submission
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.leadFormSubmission.delete({
      where: { id }
    });
    
    res.json({ message: 'Lead submission deleted successfully' });
  } catch (error) {
    console.error('Error deleting lead submission:', error);
    res.status(500).json({ error: 'Failed to delete lead submission' });
  }
});

export default router;
