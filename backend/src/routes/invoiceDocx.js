import express from 'express';
import { PrismaClient } from '@prisma/client';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate DOCX invoice from template
router.post('/:invoiceId/generate-docx', async (req, res) => {
  try {
    const { invoiceId } = req.params;

    // Load invoice with related data
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        matter: {
          include: {
            client: true
          }
        },
        timeEntries: {
          include: {
            user: true,
            billingCode: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Load template file
    const templatePath = path.join(__dirname, '../../templates/EC Invoice Template 07.03.25.docx');
    
    if (!fs.existsSync(templatePath)) {
      return res.status(500).json({ 
        error: 'Invoice template not found. Please place "EC Invoice Template 07.03.25.docx" in backend/templates/' 
      });
    }

    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Prepare client data
    const client = invoice.matter?.client || {};
    const clientAddress = client.address || '';
    const addressParts = clientAddress.split(',').map(p => p.trim());
    
    // Prepare template data
    const templateData = {
      // Client information
      'client.name': client.name || 'N/A',
      clientAddress1Line1: addressParts[0] || '',
      clientAddress1Line2: addressParts[1] || '',
      clientAddress1City: client.city || '',
      clientAddress1State: client.state || '',
      clientAddress1Zip: client.zip || '',

      // Invoice details
      invoiceNumber: invoice.invoiceNumber || 'N/A',
      invoiceDate: invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString('en-US') : new Date().toLocaleDateString('en-US'),
      invoiceTermsDays: invoice.terms || 30,
      invoiceDueDate: invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-US') : 'N/A',
      invoiceTotalBalance: (invoice.amount / 100).toFixed(2),
      
      // Date range from time entries
      invoiceStartDate: invoice.timeEntries.length > 0 
        ? new Date(invoice.timeEntries[0].createdAt).toLocaleDateString('en-US')
        : new Date().toLocaleDateString('en-US'),
      invoiceEndDate: invoice.timeEntries.length > 0
        ? new Date(invoice.timeEntries[invoice.timeEntries.length - 1].createdAt).toLocaleDateString('en-US')
        : new Date().toLocaleDateString('en-US'),

      // Time entries array
      ProjectTime: invoice.timeEntries.map(entry => {
        // Use stored billed minutes (already 6-min rounded) and stored rate
        const billedHours = entry.durationMinutesBilled / 60;
        const ratePerHour = entry.rateCentsApplied / 100;
        const total = entry.amountCents / 100;

        return {
          billingitemdate: new Date(entry.createdAt).toLocaleDateString('en-US'),
          billingitemdescription: entry.description || 'N/A',
          billingitemuserFullName: entry.user?.name || 'N/A',
          billingitemrate: ratePerHour.toFixed(2),
          billingitemquantity: billedHours.toFixed(2),
          billingItemTotal: total.toFixed(2)
        };
      })
    };

    // Render template
    doc.render(templateData);

    // Generate output
    const buf = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    // Set headers for download
    const filename = `Invoice_${invoice.invoiceNumber}_${Date.now()}.docx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buf.length);

    res.send(buf);

  } catch (error) {
    console.error('Error generating DOCX:', error);
    res.status(500).json({ 
      error: 'Failed to generate invoice DOCX',
      details: error.message 
    });
  }
});

export default router;
