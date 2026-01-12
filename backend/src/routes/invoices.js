import express from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/auth.js';
import { uploadToS3, getSignedUrl, deleteFromS3 } from '../utils/s3.js';

const router = express.Router();
const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', verifyToken, async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: { case: true, contact: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', verifyToken, upload.single('file'), async (req, res) => {
  try {
    let fileKey = null, fileName = null, mimeType = null;
    
    if (req.file) {
      fileKey = await uploadToS3(req.file, 'invoices');
      fileName = req.file.originalname;
      mimeType = req.file.mimetype;
    }
    
    const data = req.body.data ? JSON.parse(req.body.data) : req.body;
    
    // Auto-generate invoice number if not provided
    const invoiceNumber = data.invoiceNumber || `INV-${Date.now()}`;
    
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        caseId: data.caseId || null,
        contactId: data.contactId || null,
        amount: data.amount || 0,
        status: data.status || 'draft',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        description: data.description || null,
        fileKey,
        fileName,
        mimeType
      }
    });
    
    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/download-url', verifyToken, async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id } });
    if (!invoice?.fileKey) {
      return res.status(404).json({ error: 'No file attached' });
    }
    const url = await getSignedUrl(invoice.fileKey);
    res.json({ url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', verifyToken, upload.single('file'), async (req, res) => {
  try {
    const data = req.body.data ? JSON.parse(req.body.data) : req.body;
    
    if (req.file) {
      const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id } });
      if (invoice?.fileKey) await deleteFromS3(invoice.fileKey);
      data.fileKey = await uploadToS3(req.file, 'invoices');
      data.fileName = req.file.originalname;
      data.mimeType = req.file.mimetype;
    }
    
    const updated = await prisma.invoice.update({
      where: { id: req.params.id },
      data
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: { timeEntries: true }
    });
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    // Only allow deleting draft invoices
    if (invoice.status !== 'draft' && invoice.status !== 'Draft') {
      return res.status(400).json({ error: 'Can only delete draft invoices' });
    }
    
    // Revert time entries back to draft status
    if (invoice.timeEntries && invoice.timeEntries.length > 0) {
      await prisma.timeEntry.updateMany({
        where: { invoiceId: req.params.id },
        data: { status: 'draft', invoiceId: null }
      });
    }
    
    if (invoice.fileKey) {
      await deleteFromS3(invoice.fileKey);
    }
    
    await prisma.invoice.delete({
      where: { id: req.params.id }
    });
    
    res.json({ message: 'Invoice deleted and time entries reverted to draft' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET draft time entries for invoice builder
router.get('/draft-entries/:matterId', verifyToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where = {
      matterId: req.params.matterId,
      status: 'draft'
    };
    
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }
    
    const entries = await prisma.timeEntry.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, role: true } },
        billingCode: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create invoice from time entries
router.post('/from-entries', verifyToken, async (req, res) => {
  try {
    const { matterId, entryIds, invoiceNumber, dueDate, description } = req.body;
    
    if (!entryIds || entryIds.length === 0) {
      return res.status(400).json({ error: 'No time entries selected' });
    }
    
    // Get all selected entries
    const entries = await prisma.timeEntry.findMany({
      where: {
        id: { in: entryIds },
        status: 'draft'
      }
    });
    
    if (entries.length !== entryIds.length) {
      return res.status(400).json({ error: 'Some entries are not available or already billed' });
    }
    
    // Calculate total amount
    const totalAmountCents = entries.reduce((sum, e) => sum + e.amountCents, 0);
    
    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        caseId: matterId,
        amount: totalAmountCents / 100, // Convert to dollars
        status: 'draft',
        dueDate: dueDate ? new Date(dueDate) : null,
        description: description || `Invoice for ${entries.length} time entries`
      }
    });
    
    // Mark entries as billed and link to invoice
    await prisma.timeEntry.updateMany({
      where: { id: { in: entryIds } },
      data: {
        status: 'billed',
        invoiceId: invoice.id
      }
    });
    
    // Return invoice with entries
    const invoiceWithEntries = await prisma.invoice.findUnique({
      where: { id: invoice.id },
      include: {
        case: true,
        timeEntries: {
          include: {
            user: true,
            billingCode: true
          }
        }
      }
    });
    
    res.status(201).json(invoiceWithEntries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
