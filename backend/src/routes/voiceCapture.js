import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// POST /transcribe - Accept audio blob, return transcript
// In production this would call Whisper/Deepgram; here we accept text directly too
router.post('/transcribe', authenticateToken, async (req, res) => {
  try {
    const { transcript, audioBase64 } = req.body;

    // If raw transcript text is provided (for testing / fallback), use it directly
    if (transcript) {
      return res.json({ transcript });
    }

    // If audioBase64 is provided, we would call a speech-to-text API here
    // For now, return an error indicating the service needs configuration
    if (audioBase64) {
      // Placeholder: in production, send audioBase64 to Whisper API / Deepgram
      // const result = await callWhisperAPI(audioBase64);
      return res.status(501).json({
        error: 'Speech-to-text service not yet configured. Please provide transcript text directly or configure WHISPER_API_KEY.'
      });
    }

    return res.status(400).json({ error: 'Provide either transcript text or audioBase64' });
  } catch (error) {
    console.error('Error transcribing:', error);
    res.status(500).json({ error: 'Failed to transcribe audio' });
  }
});

// POST /propose-actions - Parse transcript and propose structured actions
router.post('/propose-actions', authenticateToken, async (req, res) => {
  try {
    const { transcript, caseId } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    const actions = parseTranscriptToActions(transcript, caseId);

    res.json({
      transcript,
      proposedActions: actions,
      status: 'pending_review'
    });
  } catch (error) {
    console.error('Error proposing actions:', error);
    res.status(500).json({ error: 'Failed to propose actions' });
  }
});

// POST /confirm-actions - Execute confirmed actions
router.post('/confirm-actions', authenticateToken, async (req, res) => {
  try {
    const { actions, caseId } = req.body;
    const userId = req.user.id;
    const userName = req.user.name || req.user.email;

    if (!actions || !Array.isArray(actions)) {
      return res.status(400).json({ error: 'Actions array is required' });
    }

    const results = [];

    for (const action of actions) {
      if (action.rejected) continue; // Skip rejected actions

      try {
        switch (action.type) {
          case 'runsheet_entry': {
            const entry = await prisma.runsheetEntry.create({
              data: {
                caseId: action.caseId || caseId,
                type: 'manual',
                title: action.title,
                description: action.description,
                userId,
                userName
              }
            });
            results.push({ type: 'runsheet_entry', id: entry.id, status: 'created' });
            break;
          }

          case 'time_entry': {
            const roleRates = {};
            const rates = await prisma.roleRate.findMany();
            rates.forEach(r => { roleRates[r.role] = r.rateCents; });

            const user = await prisma.user.findUnique({ where: { id: userId } });
            const rateCents = roleRates[user?.role] || 0;
            const billedMinutes = Math.ceil((action.durationMinutes || 6) / 6) * 6;
            const amountCents = Math.round((rateCents / 60) * billedMinutes);

            const entry = await prisma.timeEntry.create({
              data: {
                userId,
                matterId: action.caseId || caseId,
                description: action.description || action.title,
                durationMinutesRaw: action.durationMinutes || 6,
                durationMinutesBilled: billedMinutes,
                rateCentsApplied: rateCents,
                amountCents,
                status: 'draft',
                tags: []
              }
            });

            // Log to runsheet
            if (action.caseId || caseId) {
              await prisma.runsheetEntry.create({
                data: {
                  caseId: action.caseId || caseId,
                  type: 'time_entry_created',
                  title: `Voice capture time entry: ${action.description?.substring(0, 60) || ''}`,
                  description: action.description,
                  userId,
                  userName,
                  metadata: { timeEntryId: entry.id, action: 'voice_capture' }
                }
              });
            }

            results.push({ type: 'time_entry', id: entry.id, status: 'created' });
            break;
          }

          case 'task': {
            const task = await prisma.task.create({
              data: {
                title: action.title,
                description: action.description,
                caseId: action.caseId || caseId,
                createdById: userId,
                assignedToId: action.assignedToId || userId,
                priority: action.priority || 'medium',
                dueDate: action.dueDate ? new Date(action.dueDate) : null,
                status: 'pending'
              }
            });

            if (action.caseId || caseId) {
              await prisma.runsheetEntry.create({
                data: {
                  caseId: action.caseId || caseId,
                  type: 'task_created',
                  title: `Task created via voice: ${action.title}`,
                  userId,
                  userName,
                  metadata: { taskId: task.id }
                }
              });
            }

            results.push({ type: 'task', id: task.id, status: 'created' });
            break;
          }

          case 'subtask': {
            if (!action.taskId) {
              results.push({ type: 'subtask', status: 'error', error: 'taskId required' });
              break;
            }
            const subtask = await prisma.subtask.create({
              data: {
                title: action.title,
                description: action.description,
                taskId: action.taskId,
                createdById: userId,
                assignedToId: action.assignedToId,
                dueDate: action.dueDate ? new Date(action.dueDate) : null,
                status: 'pending'
              }
            });
            results.push({ type: 'subtask', id: subtask.id, status: 'created' });
            break;
          }

          case 'comment': {
            if (action.caseId || caseId) {
              const comment = await prisma.caseComment.create({
                data: {
                  caseId: action.caseId || caseId,
                  userId,
                  comment: action.text || action.description
                }
              });
              results.push({ type: 'comment', id: comment.id, status: 'created' });
            }
            break;
          }

          default:
            results.push({ type: action.type, status: 'unknown_type' });
        }
      } catch (actionError) {
        console.error(`Error executing action ${action.type}:`, actionError);
        results.push({ type: action.type, status: 'error', error: actionError.message });
      }
    }

    res.json({ results, totalExecuted: results.filter(r => r.status === 'created').length });
  } catch (error) {
    console.error('Error confirming actions:', error);
    res.status(500).json({ error: 'Failed to execute actions' });
  }
});

// POST /edit - Simple edit command: parse "edit <target> <field> <value>"
router.post('/edit', authenticateToken, async (req, res) => {
  try {
    const { command, caseId } = req.body;

    if (!command) {
      return res.status(400).json({ error: 'Edit command is required' });
    }

    const editResult = parseEditCommand(command);
    if (!editResult) {
      return res.status(400).json({ error: 'Could not parse edit command. Try: "edit task <title> status completed"' });
    }

    res.json({
      parsed: editResult,
      status: 'pending_review',
      message: `Proposed: set ${editResult.field} to "${editResult.value}" on ${editResult.target} "${editResult.identifier}"`
    });
  } catch (error) {
    console.error('Error parsing edit command:', error);
    res.status(500).json({ error: 'Failed to parse edit command' });
  }
});

// ---- Parsing helpers ----

function parseTranscriptToActions(transcript, caseId) {
  const actions = [];
  const lower = transcript.toLowerCase();
  const sentences = transcript.split(/[.!?\n]+/).map(s => s.trim()).filter(Boolean);

  for (const sentence of sentences) {
    const sl = sentence.toLowerCase();

    // Detect time entry patterns
    const timeMatch = sl.match(/(?:spent|worked|logged?)\s+(\d+)\s*(?:min(?:utes?)?|hours?|hrs?)/i);
    if (timeMatch) {
      let minutes = parseInt(timeMatch[1]);
      if (sl.includes('hour') || sl.includes('hr')) minutes *= 60;
      actions.push({
        type: 'time_entry',
        title: `Time entry from voice`,
        description: sentence,
        durationMinutes: minutes,
        caseId
      });
      continue;
    }

    // Detect task creation patterns
    if (sl.match(/(?:create|add|new|make)\s+(?:a\s+)?task/i)) {
      const titleMatch = sentence.match(/task[:\s]+["']?(.+?)["']?$/i);
      actions.push({
        type: 'task',
        title: titleMatch ? titleMatch[1].trim() : sentence,
        description: sentence,
        caseId
      });
      continue;
    }

    // Detect subtask creation
    if (sl.match(/(?:create|add|new|make)\s+(?:a\s+)?subtask/i)) {
      const titleMatch = sentence.match(/subtask[:\s]+["']?(.+?)["']?$/i);
      actions.push({
        type: 'subtask',
        title: titleMatch ? titleMatch[1].trim() : sentence,
        description: sentence
      });
      continue;
    }

    // Detect comment patterns
    if (sl.match(/(?:add|leave|post)\s+(?:a\s+)?comment/i)) {
      const textMatch = sentence.match(/comment[:\s]+["']?(.+?)["']?$/i);
      actions.push({
        type: 'comment',
        text: textMatch ? textMatch[1].trim() : sentence,
        caseId
      });
      continue;
    }

    // Default: treat as a runsheet entry / note
    if (sentence.length > 10) {
      actions.push({
        type: 'runsheet_entry',
        title: sentence.length > 80 ? sentence.substring(0, 77) + '...' : sentence,
        description: sentence,
        caseId
      });
    }
  }

  return actions;
}

function parseEditCommand(command) {
  // Pattern: "edit <target_type> <identifier> <field> <value>"
  // e.g. "edit task Review Documents status completed"
  const match = command.match(/^edit\s+(task|subtask|entry)\s+["']?(.+?)["']?\s+(status|title|priority|description|dueDate)\s+(.+)$/i);
  if (!match) return null;

  return {
    target: match[1].toLowerCase(),
    identifier: match[2].trim(),
    field: match[3].toLowerCase(),
    value: match[4].trim()
  };
}

export default router;
