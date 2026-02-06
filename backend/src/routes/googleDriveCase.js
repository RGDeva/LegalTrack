import express from 'express';
import { PrismaClient } from '@prisma/client';
import { google } from 'googleapis';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Helper to get OAuth2 client
function getOAuth2Client(tokens) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  
  oauth2Client.setCredentials(tokens);
  return oauth2Client;
}

// Link a Google Drive folder to a case
router.post('/case/:caseId/link-folder', authenticateToken, async (req, res) => {
  try {
    const { caseId } = req.params;
    const { folderId } = req.body;
    const userId = req.user.id;
    
    // Get user's Google tokens
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        googleRefreshToken: true,
        googleAccessToken: true,
        googleTokenExpiry: true
      }
    });
    
    if (!user?.googleRefreshToken) {
      return res.status(400).json({ 
        error: 'Google account not connected' 
      });
    }
    
    const oauth2Client = getOAuth2Client({
      refresh_token: user.googleRefreshToken,
      access_token: user.googleAccessToken,
      expiry_date: user.googleTokenExpiry
    });
    
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    // Verify folder exists and user has access
    try {
      await drive.files.get({
        fileId: folderId,
        fields: 'id, name'
      });
    } catch (error) {
      return res.status(400).json({ 
        error: 'Invalid folder ID or no access to folder' 
      });
    }
    
    // Update case with folder ID
    const updatedCase = await prisma.case.update({
      where: { id: caseId },
      data: { googleDriveFolderId: folderId }
    });
    
    res.json({ 
      message: 'Google Drive folder linked successfully',
      case: updatedCase
    });
  } catch (error) {
    console.error('Error linking folder:', error);
    res.status(500).json({ error: 'Failed to link Google Drive folder' });
  }
});

// List files in case's Google Drive folder
router.get('/case/:caseId/files', authenticateToken, async (req, res) => {
  try {
    const { caseId } = req.params;
    const userId = req.user.id;
    
    // Get case and user
    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
      select: { googleDriveFolderId: true }
    });
    
    if (!caseData?.googleDriveFolderId) {
      return res.status(400).json({ 
        error: 'No Google Drive folder linked to this case' 
      });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        googleRefreshToken: true,
        googleAccessToken: true,
        googleTokenExpiry: true
      }
    });
    
    if (!user?.googleRefreshToken) {
      return res.status(400).json({ 
        error: 'Google account not connected' 
      });
    }
    
    const oauth2Client = getOAuth2Client({
      refresh_token: user.googleRefreshToken,
      access_token: user.googleAccessToken,
      expiry_date: user.googleTokenExpiry
    });
    
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    // List files in folder
    const response = await drive.files.list({
      q: `'${caseData.googleDriveFolderId}' in parents and trashed=false`,
      fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, iconLink)',
      orderBy: 'modifiedTime desc'
    });
    
    res.json(response.data.files || []);
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// Upload file to case's Google Drive folder
router.post('/case/:caseId/upload', authenticateToken, async (req, res) => {
  try {
    const { caseId } = req.params;
    const { fileName, fileContent, mimeType } = req.body;
    const userId = req.user.id;
    
    // Get case and user
    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
      select: { googleDriveFolderId: true }
    });
    
    if (!caseData?.googleDriveFolderId) {
      return res.status(400).json({ 
        error: 'No Google Drive folder linked to this case' 
      });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        googleRefreshToken: true,
        googleAccessToken: true,
        googleTokenExpiry: true
      }
    });
    
    if (!user?.googleRefreshToken) {
      return res.status(400).json({ 
        error: 'Google account not connected' 
      });
    }
    
    const oauth2Client = getOAuth2Client({
      refresh_token: user.googleRefreshToken,
      access_token: user.googleAccessToken,
      expiry_date: user.googleTokenExpiry
    });
    
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    // Upload file
    const fileMetadata = {
      name: fileName,
      parents: [caseData.googleDriveFolderId]
    };
    
    const media = {
      mimeType: mimeType,
      body: Buffer.from(fileContent, 'base64')
    };
    
    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink'
    });
    
    res.json({ 
      message: 'File uploaded successfully',
      file: file.data
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Create a backup of all case files
router.post('/case/:caseId/backup', authenticateToken, async (req, res) => {
  try {
    const { caseId } = req.params;
    const userId = req.user.id;
    
    // Get case and user
    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
      select: { 
        googleDriveFolderId: true,
        caseNumber: true,
        title: true
      }
    });
    
    if (!caseData?.googleDriveFolderId) {
      return res.status(400).json({ 
        error: 'No Google Drive folder linked to this case' 
      });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        googleRefreshToken: true,
        googleAccessToken: true,
        googleTokenExpiry: true
      }
    });
    
    if (!user?.googleRefreshToken) {
      return res.status(400).json({ 
        error: 'Google account not connected' 
      });
    }
    
    const oauth2Client = getOAuth2Client({
      refresh_token: user.googleRefreshToken,
      access_token: user.googleAccessToken,
      expiry_date: user.googleTokenExpiry
    });
    
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    // Create backup folder
    const backupFolderName = `Backup_${caseData.caseNumber}_${new Date().toISOString().split('T')[0]}`;
    
    const folderMetadata = {
      name: backupFolderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [caseData.googleDriveFolderId]
    };
    
    const backupFolder = await drive.files.create({
      requestBody: folderMetadata,
      fields: 'id, name, webViewLink'
    });
    
    // List all files in the case folder
    const response = await drive.files.list({
      q: `'${caseData.googleDriveFolderId}' in parents and trashed=false and mimeType != 'application/vnd.google-apps.folder'`,
      fields: 'files(id, name)'
    });
    
    const files = response.data.files || [];
    let backedUp = 0;
    
    // Copy each file to backup folder
    for (const file of files) {
      try {
        await drive.files.copy({
          fileId: file.id,
          requestBody: {
            parents: [backupFolder.data.id],
            name: file.name
          }
        });
        backedUp++;
      } catch (error) {
        console.error(`Error backing up file ${file.name}:`, error);
      }
    }
    
    res.json({ 
      message: 'Backup created successfully',
      backupFolder: backupFolder.data,
      filesBackedUp: backedUp,
      totalFiles: files.length
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

// Unlink Google Drive folder from case
router.delete('/case/:caseId/unlink-folder', authenticateToken, async (req, res) => {
  try {
    const { caseId } = req.params;
    
    await prisma.case.update({
      where: { id: caseId },
      data: { googleDriveFolderId: null }
    });
    
    res.json({ message: 'Google Drive folder unlinked successfully' });
  } catch (error) {
    console.error('Error unlinking folder:', error);
    res.status(500).json({ error: 'Failed to unlink folder' });
  }
});

export default router;
