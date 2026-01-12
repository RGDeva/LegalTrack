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
    const documents = await prisma.document.findMany({
      include: { case: true, uploader: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/upload', verifyToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }
    
    const fileKey = await uploadToS3(req.file, 'documents');
    const document = await prisma.document.create({
      data: {
        name: req.body.name || req.file.originalname,
        fileName: req.file.originalname,
        fileKey,
        mimeType: req.file.mimetype,
        size: req.file.size,
        type: req.body.type,
        category: req.body.category,
        caseId: req.body.caseId,
        uploadedBy: req.user.id,
        tags: req.body.tags ? JSON.parse(req.body.tags) : []
      }
    });
    
    res.status(201).json(document);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/download-url', verifyToken, async (req, res) => {
  try {
    const document = await prisma.document.findUnique({ where: { id: req.params.id } });
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    const url = await getSignedUrl(document.fileKey);
    res.json({ url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const document = await prisma.document.findUnique({ where: { id: req.params.id } });
    if (document) await deleteFromS3(document.fileKey);
    await prisma.document.delete({ where: { id: req.params.id } });
    res.json({ message: 'Document deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
