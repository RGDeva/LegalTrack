import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/auth.js';
import multer from 'multer';

const router = express.Router();
const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

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

// Bulk delete contacts
router.post('/bulk-delete', verifyToken, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No contact IDs provided' });
    }
    const result = await prisma.contact.deleteMany({ where: { id: { in: ids } } });
    res.json({ message: `${result.count} contacts deleted successfully`, count: result.count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Import contacts from CSV/XLS file
router.post('/import', verifyToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileName = req.file.originalname.toLowerCase();
    let rows = [];

    if (fileName.endsWith('.csv')) {
      // Parse CSV
      const content = req.file.buffer.toString('utf-8');
      const lines = content.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) {
        return res.status(400).json({ error: 'CSV file must have a header row and at least one data row' });
      }

      // Parse header
      const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());

      // Parse data rows
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const row = {};
        headers.forEach((h, idx) => { row[h] = values[idx]?.trim() || ''; });
        rows.push(row);
      }
    } else if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) {
      // Parse XLS/XLSX using xlsx library
      let XLSX;
      try {
        XLSX = await import('xlsx');
      } catch {
        return res.status(400).json({ error: 'XLS/XLSX parsing not available. Please use CSV format.' });
      }
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      rows = jsonData.map(row => {
        const normalized = {};
        Object.keys(row).forEach(key => { normalized[key.trim().toLowerCase()] = String(row[key]).trim(); });
        return normalized;
      });
    } else {
      return res.status(400).json({ error: 'Unsupported file format. Please upload a .csv, .xls, or .xlsx file.' });
    }

    if (rows.length === 0) {
      return res.status(400).json({ error: 'No data rows found in file' });
    }

    // Map columns - support common header names
    let imported = 0;
    let skipped = 0;
    const errors = [];

    for (const row of rows) {
      try {
        const name = row.name || row['full name'] || row['first name'] || '';
        const email = row.email || row['email address'] || row['e-mail'] || '';
        const phone = row.phone || row['phone number'] || row.telephone || row.tel || '';
        const organization = row.organization || row.company || row.org || '';
        const title = row.title || row['job title'] || row.position || '';
        const category = row.category || row.type || '';
        const address = row.address || row['street address'] || '';
        const notes = row.notes || row.note || row.comments || '';

        if (!name && !email) {
          skipped++;
          continue;
        }

        // Check for duplicate by email
        if (email) {
          const existing = await prisma.contact.findFirst({ where: { email } });
          if (existing) {
            skipped++;
            continue;
          }
        }

        const validCategories = ['client', 'opposing-counsel', 'court', 'expert', 'vendor', 'other', 'imported'];
        const normalizedCategory = validCategories.includes(category.toLowerCase()) ? category.toLowerCase() : null;

        await prisma.contact.create({
          data: {
            name: name || email,
            email: email || `import-${Date.now()}-${imported}@placeholder.com`,
            phone: phone || null,
            organization: organization || null,
            title: title || null,
            category: normalizedCategory,
            address: address || null,
            notes: notes || null,
            leadSource: 'csv_import'
          }
        });
        imported++;
      } catch (err) {
        errors.push(err.message);
        skipped++;
      }
    }

    res.json({
      message: `Import complete: ${imported} imported, ${skipped} skipped`,
      imported,
      skipped,
      total: rows.length,
      errors: errors.slice(0, 5)
    });
  } catch (error) {
    console.error('Error importing contacts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper to parse CSV lines (handles quoted fields with commas)
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export default router;
