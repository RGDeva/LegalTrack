import express from 'express';
import { google } from 'googleapis';
import multer from 'multer';
import { Readable } from 'stream';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Google Drive API with service account
const getGoogleDriveClient = () => {
  const credentials = {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  return google.drive({ version: 'v3', auth });
};

// List files in a folder
router.get('/files', verifyToken, async (req, res) => {
  try {
    const drive = getGoogleDriveClient();
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    
    if (!folderId) {
      return res.status(400).json({ error: 'Google Drive folder ID not configured' });
    }

    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink)',
      orderBy: 'modifiedTime desc',
    });

    res.json(response.data.files || []);
  } catch (error) {
    console.error('Google Drive list error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upload file to Google Drive
router.post('/upload', verifyToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const drive = getGoogleDriveClient();
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!folderId) {
      return res.status(400).json({ error: 'Google Drive folder ID not configured' });
    }

    // Convert buffer to readable stream
    const bufferStream = new Readable();
    bufferStream.push(req.file.buffer);
    bufferStream.push(null);

    const fileMetadata = {
      name: req.body.name || req.file.originalname,
      parents: [folderId],
    };

    const media = {
      mimeType: req.file.mimetype,
      body: bufferStream,
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, mimeType, size, createdTime, webViewLink, webContentLink',
    });

    res.status(201).json(response.data);
  } catch (error) {
    console.error('Google Drive upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create folder in Google Drive
router.post('/folder', verifyToken, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Folder name required' });
    }

    const drive = getGoogleDriveClient();
    const parentFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    const fileMetadata = {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentFolderId ? [parentFolderId] : [],
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id, name, mimeType, webViewLink',
    });

    res.status(201).json(response.data);
  } catch (error) {
    console.error('Google Drive folder creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete file from Google Drive
router.delete('/files/:fileId', verifyToken, async (req, res) => {
  try {
    const drive = getGoogleDriveClient();
    await drive.files.delete({ fileId: req.params.fileId });
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Google Drive delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get file download URL
router.get('/files/:fileId/download', verifyToken, async (req, res) => {
  try {
    const drive = getGoogleDriveClient();
    const response = await drive.files.get({
      fileId: req.params.fileId,
      fields: 'webContentLink, webViewLink',
    });
    res.json(response.data);
  } catch (error) {
    console.error('Google Drive download error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
