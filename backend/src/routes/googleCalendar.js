import express from 'express';
import { google } from 'googleapis';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Initialize Google Calendar API with service account
const getGoogleCalendarClient = () => {
  const credentials = {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

  return google.calendar({ version: 'v3', auth });
};

// List events from calendar
router.get('/events', verifyToken, async (req, res) => {
  try {
    const calendar = getGoogleCalendarClient();
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
    
    const timeMin = req.query.timeMin || new Date().toISOString();
    const timeMax = req.query.timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const response = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 100,
    });

    const events = response.data.items?.map(event => ({
      id: event.id,
      title: event.summary,
      description: event.description,
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      location: event.location,
      attendees: event.attendees?.map(a => ({ email: a.email, name: a.displayName })),
      htmlLink: event.htmlLink,
      status: event.status,
      colorId: event.colorId,
    })) || [];

    res.json(events);
  } catch (error) {
    console.error('Google Calendar list error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create event
router.post('/events', verifyToken, async (req, res) => {
  try {
    const { title, description, start, end, location, attendees, caseId } = req.body;
    
    if (!title || !start || !end) {
      return res.status(400).json({ error: 'Title, start, and end are required' });
    }

    const calendar = getGoogleCalendarClient();
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

    const event = {
      summary: title,
      description: description || '',
      location: location || '',
      start: {
        dateTime: new Date(start).toISOString(),
        timeZone: 'America/New_York',
      },
      end: {
        dateTime: new Date(end).toISOString(),
        timeZone: 'America/New_York',
      },
      attendees: attendees?.map(email => ({ email })) || [],
    };

    if (caseId) {
      event.extendedProperties = {
        private: { caseId }
      };
    }

    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
      sendUpdates: 'all',
    });

    res.status(201).json({
      id: response.data.id,
      title: response.data.summary,
      start: response.data.start?.dateTime,
      end: response.data.end?.dateTime,
      htmlLink: response.data.htmlLink,
    });
  } catch (error) {
    console.error('Google Calendar create error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update event
router.put('/events/:eventId', verifyToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { title, description, start, end, location, attendees } = req.body;

    const calendar = getGoogleCalendarClient();
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

    const event = {
      summary: title,
      description: description || '',
      location: location || '',
      start: {
        dateTime: new Date(start).toISOString(),
        timeZone: 'America/New_York',
      },
      end: {
        dateTime: new Date(end).toISOString(),
        timeZone: 'America/New_York',
      },
      attendees: attendees?.map(email => ({ email })) || [],
    };

    const response = await calendar.events.update({
      calendarId,
      eventId,
      requestBody: event,
      sendUpdates: 'all',
    });

    res.json({
      id: response.data.id,
      title: response.data.summary,
      start: response.data.start?.dateTime,
      end: response.data.end?.dateTime,
      htmlLink: response.data.htmlLink,
    });
  } catch (error) {
    console.error('Google Calendar update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete event
router.delete('/events/:eventId', verifyToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const calendar = getGoogleCalendarClient();
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

    await calendar.events.delete({
      calendarId,
      eventId,
      sendUpdates: 'all',
    });

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Google Calendar delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
