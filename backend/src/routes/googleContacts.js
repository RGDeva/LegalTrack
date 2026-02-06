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

// Generate Google OAuth consent URL
router.get('/auth-url', authenticateToken, async (req, res) => {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const scopes = [
      'https://www.googleapis.com/auth/contacts.readonly',
      'https://www.googleapis.com/auth/contacts'
    ];

    // Pass the user's JWT token as state so we can identify them in the callback
    const state = req.headers.authorization?.replace('Bearer ', '');

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state
    });

    res.json({ url });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ error: 'Failed to generate Google auth URL' });
  }
});

// OAuth callback - exchange code for tokens and auto-sync
router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code) {
      return res.status(400).send('Authorization code missing');
    }

    // Verify the JWT from state to identify the user
    const jwt = await import('jsonwebtoken');
    let userId;
    try {
      const decoded = jwt.default.verify(state, process.env.JWT_SECRET || 'fallback-secret');
      userId = decoded.id;
    } catch (err) {
      return res.status(401).send('Invalid or expired session. Please try connecting again.');
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    // Save tokens to user
    await prisma.user.update({
      where: { id: userId },
      data: {
        googleRefreshToken: tokens.refresh_token,
        googleAccessToken: tokens.access_token,
        googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null
      }
    });

    // Auto-sync contacts after connecting
    try {
      oauth2Client.setCredentials(tokens);
      const people = google.people({ version: 'v1', auth: oauth2Client });
      const response = await people.people.connections.list({
        resourceName: 'people/me',
        pageSize: 1000,
        personFields: 'names,emailAddresses,phoneNumbers,organizations,addresses'
      });

      const connections = response.data.connections || [];
      let imported = 0;

      for (const person of connections) {
        try {
          const name = person.names?.[0]?.displayName;
          const email = person.emailAddresses?.[0]?.value;
          const phone = person.phoneNumbers?.[0]?.value;
          const organization = person.organizations?.[0]?.name;
          const title = person.organizations?.[0]?.title;
          const address = person.addresses?.[0]?.formattedValue;
          const sourceId = person.resourceName;

          if (!email) continue;

          let existingContact = await prisma.contact.findFirst({ where: { googleSourceId: sourceId } });
          if (!existingContact) {
            existingContact = await prisma.contact.findFirst({ where: { email } });
          }

          if (existingContact) {
            await prisma.contact.update({
              where: { id: existingContact.id },
              data: {
                name: name || existingContact.name,
                phone: phone || existingContact.phone,
                organization: organization || existingContact.organization,
                title: title || existingContact.title,
                address: address || existingContact.address,
                googleContactId: sourceId,
                googleSourceId: sourceId,
                googleSyncedAt: new Date(),
                googleSyncDirection: 'one_way'
              }
            });
          } else {
            await prisma.contact.create({
              data: {
                name: name || email,
                email,
                phone,
                organization,
                title,
                address,
                googleContactId: sourceId,
                googleSourceId: sourceId,
                googleSyncedAt: new Date(),
                googleSyncDirection: 'one_way',
                leadSource: 'google_contacts',
                category: 'imported'
              }
            });
            imported++;
          }
        } catch (err) {
          console.error('Error processing contact during auto-sync:', err);
        }
      }

      console.log(`Auto-synced ${imported} new contacts from Google for user ${userId}`);
    } catch (syncErr) {
      console.error('Auto-sync after connect failed (non-fatal):', syncErr.message);
    }

    // Redirect back to the frontend settings page with success
    const frontendUrl = process.env.FRONTEND_URL || 'https://legal-track-nine.vercel.app';
    res.redirect(`${frontendUrl}/settings?google=connected`);
  } catch (error) {
    console.error('Error in Google callback:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'https://legal-track-nine.vercel.app';
    res.redirect(`${frontendUrl}/settings?google=error`);
  }
});

// Sync contacts from Google
router.post('/sync', authenticateToken, async (req, res) => {
  try {
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
        error: 'Google account not connected. Please connect your Google account first.' 
      });
    }
    
    const oauth2Client = getOAuth2Client({
      refresh_token: user.googleRefreshToken,
      access_token: user.googleAccessToken,
      expiry_date: user.googleTokenExpiry
    });
    
    const people = google.people({ version: 'v1', auth: oauth2Client });
    
    // Fetch contacts from Google
    const response = await people.people.connections.list({
      resourceName: 'people/me',
      pageSize: 1000,
      personFields: 'names,emailAddresses,phoneNumbers,organizations,addresses'
    });
    
    const connections = response.data.connections || [];
    let imported = 0;
    let updated = 0;
    let skipped = 0;
    
    const { syncDirection } = req.body; // 'one_way', 'two_way', 'manual'

    for (const person of connections) {
      try {
        const name = person.names?.[0]?.displayName;
        const email = person.emailAddresses?.[0]?.value;
        const phone = person.phoneNumbers?.[0]?.value;
        const organization = person.organizations?.[0]?.name;
        const title = person.organizations?.[0]?.title;
        const address = person.addresses?.[0]?.formattedValue;
        // Stable source ID from Google for reliable dedupe
        const sourceId = person.resourceName; // e.g. "people/c12345"
        
        if (!email) {
          skipped++;
          continue;
        }
        
        // Check if contact already exists by sourceId first (stable), then email (fallback)
        let existingContact = await prisma.contact.findFirst({
          where: { googleSourceId: sourceId }
        });
        if (!existingContact) {
          existingContact = await prisma.contact.findFirst({
            where: { email }
          });
        }
        
        if (existingContact) {
          // Update if it was previously synced from Google or matched by email
          await prisma.contact.update({
            where: { id: existingContact.id },
            data: {
              name: name || existingContact.name,
              phone: phone || existingContact.phone,
              organization: organization || existingContact.organization,
              title: title || existingContact.title,
              address: address || existingContact.address,
              googleContactId: sourceId,
              googleSourceId: sourceId,
              googleSyncedAt: new Date(),
              googleSyncDirection: syncDirection || existingContact.googleSyncDirection || 'one_way'
            }
          });
          updated++;

          // Two-way sync: push local changes back to Google
          if ((syncDirection === 'two_way' || existingContact.googleSyncDirection === 'two_way') && existingContact.googleContactId) {
            try {
              await people.people.updateContact({
                resourceName: existingContact.googleContactId,
                updatePersonFields: 'names,emailAddresses,phoneNumbers,organizations',
                requestBody: {
                  etag: person.etag,
                  names: [{ givenName: existingContact.name }],
                  emailAddresses: [{ value: existingContact.email }],
                  phoneNumbers: existingContact.phone ? [{ value: existingContact.phone }] : [],
                  organizations: existingContact.organization ? [{ name: existingContact.organization }] : []
                }
              });
            } catch (pushErr) {
              console.error('Error pushing contact to Google:', pushErr.message);
            }
          }
        } else {
          // Create new contact
          await prisma.contact.create({
            data: {
              name: name || email,
              email,
              phone,
              organization,
              title,
              address,
              googleContactId: sourceId,
              googleSourceId: sourceId,
              googleSyncedAt: new Date(),
              googleSyncDirection: syncDirection || 'one_way',
              leadSource: 'google_contacts',
              category: 'imported'
            }
          });
          imported++;
        }
      } catch (error) {
        console.error('Error processing contact:', error);
        skipped++;
      }
    }
    
    res.json({
      message: 'Contacts synced successfully',
      imported,
      updated,
      skipped,
      total: connections.length
    });
  } catch (error) {
    console.error('Error syncing Google contacts:', error);
    res.status(500).json({ error: 'Failed to sync Google contacts' });
  }
});

// Import contacts from CSV
router.post('/import-csv', authenticateToken, async (req, res) => {
  try {
    const { contacts } = req.body; // Array of contact objects
    
    if (!Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({ error: 'Invalid contacts data' });
    }
    
    let imported = 0;
    let updated = 0;
    let skipped = 0;
    
    for (const contactData of contacts) {
      try {
        const { name, email, phone, mobile, organization, title, address, city, state, zip, notes } = contactData;
        
        if (!email) {
          skipped++;
          continue;
        }
        
        // Check if contact exists by email (de-duplication)
        const existingContact = await prisma.contact.findFirst({
          where: { email }
        });
        
        if (existingContact) {
          // Update existing contact
          await prisma.contact.update({
            where: { id: existingContact.id },
            data: {
              name: name || existingContact.name,
              phone: phone || existingContact.phone,
              mobile: mobile || existingContact.mobile,
              organization: organization || existingContact.organization,
              title: title || existingContact.title,
              address: address || existingContact.address,
              city: city || existingContact.city,
              state: state || existingContact.state,
              zip: zip || existingContact.zip,
              notes: notes || existingContact.notes
            }
          });
          updated++;
        } else {
          // Create new contact
          await prisma.contact.create({
            data: {
              name: name || email,
              email,
              phone,
              mobile,
              organization,
              title,
              address,
              city,
              state,
              zip,
              notes,
              leadSource: 'csv_import',
              category: 'imported'
            }
          });
          imported++;
        }
      } catch (error) {
        console.error('Error processing contact:', error);
        skipped++;
      }
    }
    
    res.json({
      message: 'CSV import completed',
      imported,
      updated,
      skipped,
      total: contacts.length
    });
  } catch (error) {
    console.error('Error importing CSV:', error);
    res.status(500).json({ error: 'Failed to import CSV' });
  }
});

// Connect Google account (save tokens) - used by frontend code-exchange flow
router.post('/connect', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code required' });
    }
    
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    // Save tokens to user
    await prisma.user.update({
      where: { id: userId },
      data: {
        googleRefreshToken: tokens.refresh_token,
        googleAccessToken: tokens.access_token,
        googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null
      }
    });
    
    res.json({ message: 'Google account connected successfully', connected: true });
  } catch (error) {
    console.error('Error connecting Google account:', error);
    res.status(500).json({ error: 'Failed to connect Google account' });
  }
});

// Disconnect Google account
router.post('/disconnect', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        googleRefreshToken: null,
        googleAccessToken: null,
        googleTokenExpiry: null
      }
    });
    
    res.json({ message: 'Google account disconnected successfully' });
  } catch (error) {
    console.error('Error disconnecting Google account:', error);
    res.status(500).json({ error: 'Failed to disconnect Google account' });
  }
});

// Check Google connection status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        googleRefreshToken: true,
        googleTokenExpiry: true
      }
    });
    
    const isConnected = !!user?.googleRefreshToken;
    const tokenExpiry = user?.googleTokenExpiry;
    
    res.json({ 
      isConnected,
      tokenExpiry,
      needsReauth: tokenExpiry && new Date(tokenExpiry) < new Date()
    });
  } catch (error) {
    console.error('Error checking Google status:', error);
    res.status(500).json({ error: 'Failed to check Google status' });
  }
});

export default router;
