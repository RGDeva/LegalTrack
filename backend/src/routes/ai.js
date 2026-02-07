import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// ─── Action Parser ───────────────────────────────────────────────
// Parses user messages into structured ProposedActions.
// This is a rule-based parser that can be replaced with an LLM call later.

function parseUserMessage(message, context) {
  const actions = [];
  const msg = message.toLowerCase().trim();

  // --- Log time entry ---
  const timeMatch = msg.match(/log\s+([\d.]+)\s*(hrs?|hours?|min(?:utes?)?)\s+(?:for\s+)?(.+?)(?:\s+under\s+(?:code\s+)?(.+))?$/i);
  if (timeMatch) {
    const amount = parseFloat(timeMatch[1]);
    const unit = timeMatch[2].startsWith('min') ? 'minutes' : 'hours';
    const minutes = unit === 'hours' ? Math.round(amount * 60) : amount;
    const description = timeMatch[3].trim();
    const billingCode = timeMatch[4]?.trim() || null;
    
    actions.push({
      type: 'create',
      entity: 'time_entry',
      fields: {
        description,
        durationMinutesBilled: minutes,
        durationMinutesRaw: minutes,
        matterId: context.caseId || null,
        billingCode,
        status: 'draft'
      },
      summary: `Log ${amount} ${unit} for "${description}"${billingCode ? ` under code ${billingCode}` : ''}${context.caseId ? '' : ' (no case linked)'}`
    });
  }

  // --- Create task ---
  const taskMatch = msg.match(/(?:create|add)\s+task[s]?\s+(?:for\s+)?(.+?)(?:\s+due\s+(.+))?$/i);
  if (taskMatch && actions.length === 0) {
    const title = taskMatch[1].replace(/\s+due\s+.*$/, '').trim();
    const dueDateStr = taskMatch[2]?.trim() || null;
    
    actions.push({
      type: 'create',
      entity: 'task',
      fields: {
        title,
        caseId: context.caseId || null,
        dueDate: dueDateStr,
        status: 'pending',
        priority: 'medium'
      },
      summary: `Create task "${title}"${dueDateStr ? ` due ${dueDateStr}` : ''}${context.caseId ? '' : ' (no case linked)'}`
    });
  }

  // --- Create tasks with subtasks ---
  const tasksWithSubMatch = msg.match(/create\s+tasks?\s+for\s+(.+?)\s+with\s+subtasks?\s+(?:and\s+)?(?:due\s+dates?)?/i);
  if (tasksWithSubMatch && actions.length === 0) {
    const topic = tasksWithSubMatch[1].trim();
    // Generate common legal workflow subtasks
    const subtasks = generateSubtasksForTopic(topic);
    
    actions.push({
      type: 'create',
      entity: 'task',
      fields: {
        title: topic,
        caseId: context.caseId || null,
        status: 'pending',
        priority: 'medium'
      },
      subtasks,
      summary: `Create task "${topic}" with ${subtasks.length} subtasks`
    });
  }

  // --- Add contact ---
  const contactMatch = msg.match(/add\s+(?:opposing\s+counsel\s+)?contact\s+(.+?)(?:\s+and\s+link\s+to\s+case\s+(.+))?$/i);
  if (contactMatch && actions.length === 0) {
    const contactInfo = contactMatch[1].trim();
    const caseRef = contactMatch[2]?.trim() || null;
    
    // Try to parse name and email
    const emailMatch = contactInfo.match(/([^\s]+@[^\s]+)/);
    const name = contactInfo.replace(/([^\s]+@[^\s]+)/, '').trim() || contactInfo;
    
    actions.push({
      type: 'create',
      entity: 'contact',
      fields: {
        name,
        email: emailMatch?.[1] || '',
        category: msg.includes('opposing counsel') ? 'opposing-counsel' : 'client'
      },
      linkToCase: caseRef || context.caseId || null,
      summary: `Add contact "${name}"${msg.includes('opposing counsel') ? ' as opposing counsel' : ''}${caseRef ? ` and link to case ${caseRef}` : ''}`
    });
  }

  // --- Update case ---
  const updateCaseMatch = msg.match(/(?:update|set|change)\s+(?:case\s+)?(?:status|priority|hearing)\s+(?:to\s+)?(.+)/i);
  if (updateCaseMatch && actions.length === 0 && context.caseId) {
    const value = updateCaseMatch[1].trim();
    let field = 'status';
    if (msg.includes('priority')) field = 'priority';
    if (msg.includes('hearing')) field = 'nextHearing';
    
    actions.push({
      type: 'update',
      entity: 'case',
      entityId: context.caseId,
      fields: { [field]: value },
      summary: `Update case ${field} to "${value}"`
    });
  }

  // --- Create invoice ---
  const invoiceMatch = msg.match(/create\s+invoice\s+(?:draft\s+)?(?:for\s+)?(?:(.+?)(?:\s+from\s+(.+?)\s+to\s+(.+))?)?$/i);
  if (invoiceMatch && actions.length === 0) {
    actions.push({
      type: 'create',
      entity: 'invoice',
      fields: {
        caseId: context.caseId || null,
        status: 'draft',
        description: invoiceMatch[1]?.trim() || 'Invoice draft',
        dateFrom: invoiceMatch[2]?.trim() || null,
        dateTo: invoiceMatch[3]?.trim() || null
      },
      summary: `Create invoice draft${context.caseId ? ' for current case' : ''}`
    });
  }

  // --- Add runsheet entry ---
  const runsheetMatch = msg.match(/add\s+(?:runsheet\s+)?(?:entry|note)\s+(.+)/i);
  if (runsheetMatch && actions.length === 0 && context.caseId) {
    actions.push({
      type: 'create',
      entity: 'runsheet',
      fields: {
        caseId: context.caseId,
        type: 'manual',
        title: runsheetMatch[1].trim(),
        description: runsheetMatch[1].trim()
      },
      summary: `Add runsheet entry: "${runsheetMatch[1].trim()}"`
    });
  }

  return actions;
}

function generateSubtasksForTopic(topic) {
  const lower = topic.toLowerCase();
  
  if (lower.includes('discovery')) {
    return [
      { title: 'Prepare initial disclosure documents', dueOffset: 7 },
      { title: 'Draft interrogatories', dueOffset: 14 },
      { title: 'Draft requests for production', dueOffset: 14 },
      { title: 'Draft requests for admission', dueOffset: 21 },
      { title: 'Review opposing party responses', dueOffset: 45 },
      { title: 'Prepare deposition notices', dueOffset: 30 },
      { title: 'Conduct depositions', dueOffset: 60 },
      { title: 'Compile discovery summary', dueOffset: 75 }
    ];
  }
  
  if (lower.includes('trial') || lower.includes('hearing')) {
    return [
      { title: 'File pre-trial motions', dueOffset: 30 },
      { title: 'Prepare witness list', dueOffset: 21 },
      { title: 'Prepare exhibit list', dueOffset: 21 },
      { title: 'Draft opening statement', dueOffset: 14 },
      { title: 'Prepare direct examination outlines', dueOffset: 14 },
      { title: 'Prepare cross-examination outlines', dueOffset: 14 },
      { title: 'Draft closing argument', dueOffset: 7 },
      { title: 'Final trial binder preparation', dueOffset: 3 }
    ];
  }
  
  if (lower.includes('filing') || lower.includes('complaint')) {
    return [
      { title: 'Research applicable law', dueOffset: 7 },
      { title: 'Draft complaint/petition', dueOffset: 14 },
      { title: 'Review and revise draft', dueOffset: 17 },
      { title: 'Prepare exhibits', dueOffset: 19 },
      { title: 'File with court', dueOffset: 21 },
      { title: 'Arrange service of process', dueOffset: 23 }
    ];
  }

  // Generic subtasks
  return [
    { title: `Research for ${topic}`, dueOffset: 7 },
    { title: `Draft documents for ${topic}`, dueOffset: 14 },
    { title: `Review and finalize ${topic}`, dueOffset: 21 },
    { title: `Complete ${topic}`, dueOffset: 28 }
  ];
}

function generateAssistantResponse(message, actions, context) {
  if (actions.length === 0) {
    return `I understand you said: "${message}"\n\nI can help you with:\n• **Log time**: "Log 1.5 hrs for client call under code CONSULT"\n• **Create tasks**: "Create tasks for discovery with subtasks and due dates"\n• **Add contacts**: "Add opposing counsel contact John Smith john@law.com"\n• **Update case**: "Set status to pending" (when inside a case)\n• **Create invoice**: "Create invoice draft"\n• **Add runsheet entry**: "Add note: Filed motion for summary judgment"\n\nPlease try one of these commands or rephrase your request.`;
  }

  const summaries = actions.map((a, i) => `${i + 1}. **${a.summary}**`).join('\n');
  let response = `I've prepared the following action${actions.length > 1 ? 's' : ''} for your review:\n\n${summaries}\n\n`;
  
  if (actions.some(a => a.subtasks)) {
    const taskAction = actions.find(a => a.subtasks);
    response += `\n**Subtasks:**\n${taskAction.subtasks.map((s, i) => `  ${i + 1}. ${s.title} (due in ${s.dueOffset} days)`).join('\n')}\n\n`;
  }
  
  response += `Please review the proposed changes above and click **"Apply"** to execute them, or modify your request.`;
  return response;
}

// ─── Routes ──────────────────────────────────────────────────────

// GET conversations for current user
router.get('/conversations', verifyToken, async (req, res) => {
  try {
    const conversations = await prisma.aiConversation.findMany({
      where: { userId: req.user.id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single conversation with messages
router.get('/conversations/:id', verifyToken, async (req, res) => {
  try {
    const conversation = await prisma.aiConversation.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } }
      }
    });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /ai/actions - Parse user message and return proposed actions
router.post('/actions', verifyToken, async (req, res) => {
  try {
    const { message, conversationId, caseId } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const context = { caseId: caseId || null, userId: req.user.id };

    // Create or get conversation
    let conversation;
    if (conversationId) {
      conversation = await prisma.aiConversation.findFirst({
        where: { id: conversationId, userId: req.user.id }
      });
    }
    if (!conversation) {
      conversation = await prisma.aiConversation.create({
        data: {
          userId: req.user.id,
          caseId: caseId || null,
          title: message.substring(0, 80)
        }
      });
    }

    // Parse message into actions
    const proposedActions = parseUserMessage(message, context);
    const assistantResponse = generateAssistantResponse(message, proposedActions, context);

    // Save user message
    await prisma.aiMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: message
      }
    });

    // Save assistant response
    const assistantMsg = await prisma.aiMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: assistantResponse,
        proposedActions: proposedActions.length > 0 ? proposedActions : undefined
      }
    });

    // Update conversation timestamp
    await prisma.aiConversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() }
    });

    res.json({
      conversationId: conversation.id,
      messageId: assistantMsg.id,
      response: assistantResponse,
      proposedActions
    });
  } catch (error) {
    console.error('AI actions error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /ai/apply-actions - Execute confirmed actions transactionally
router.post('/apply-actions', verifyToken, async (req, res) => {
  try {
    const { messageId, actions } = req.body;
    if (!actions || !Array.isArray(actions) || actions.length === 0) {
      return res.status(400).json({ error: 'No actions to apply' });
    }

    const results = [];
    const userId = req.user.id;

    for (const action of actions) {
      try {
        let result = null;

        // ── CREATE TIME ENTRY ──
        if (action.entity === 'time_entry' && action.type === 'create') {
          const rateCents = 25000; // Default $250/hr, should come from user/billing code
          const minutes = action.fields.durationMinutesBilled || 0;
          const amountCents = Math.round((minutes / 60) * rateCents);
          
          result = await prisma.timeEntry.create({
            data: {
              description: action.fields.description || 'AI-created entry',
              durationMinutesBilled: minutes,
              durationMinutesRaw: action.fields.durationMinutesRaw || minutes,
              matterId: action.fields.matterId || null,
              userId,
              rateCentsApplied: rateCents,
              amountCents,
              status: 'draft'
            }
          });

          await prisma.aiAuditLog.create({
            data: {
              userId,
              actionType: 'create',
              entityType: 'time_entry',
              entityId: result.id,
              fieldsAfter: result,
              description: `AI created time entry: ${action.fields.description} (${minutes} min)`
            }
          });
        }

        // ── CREATE TASK ──
        if (action.entity === 'task' && action.type === 'create') {
          let dueDate = null;
          if (action.fields.dueDate) {
            try { dueDate = new Date(action.fields.dueDate); } catch {}
          }

          result = await prisma.task.create({
            data: {
              title: action.fields.title,
              description: action.fields.description || null,
              caseId: action.fields.caseId || null,
              assignedToId: action.fields.assignedToId || null,
              createdById: userId,
              status: 'pending',
              priority: action.fields.priority || 'medium',
              dueDate
            }
          });

          // Create subtasks if provided
          if (action.subtasks && Array.isArray(action.subtasks)) {
            for (let i = 0; i < action.subtasks.length; i++) {
              const sub = action.subtasks[i];
              const subDue = sub.dueOffset ? new Date(Date.now() + sub.dueOffset * 86400000) : null;
              await prisma.subtask.create({
                data: {
                  title: sub.title,
                  taskId: result.id,
                  createdById: userId,
                  assignedToId: sub.assignedToId || null,
                  orderIndex: i,
                  dueDate: subDue,
                  status: 'pending'
                }
              });
            }
          }

          await prisma.aiAuditLog.create({
            data: {
              userId,
              actionType: 'create',
              entityType: 'task',
              entityId: result.id,
              fieldsAfter: result,
              description: `AI created task: ${action.fields.title}${action.subtasks ? ` with ${action.subtasks.length} subtasks` : ''}`
            }
          });
        }

        // ── CREATE CONTACT ──
        if (action.entity === 'contact' && action.type === 'create') {
          // Check for duplicate email
          if (action.fields.email) {
            const existing = await prisma.contact.findFirst({ where: { email: action.fields.email } });
            if (existing) {
              results.push({ action, error: `Contact with email ${action.fields.email} already exists`, skipped: true });
              continue;
            }
          }

          result = await prisma.contact.create({
            data: {
              name: action.fields.name || 'Unnamed',
              email: action.fields.email || `ai-${Date.now()}@placeholder.com`,
              phone: action.fields.phone || null,
              organization: action.fields.organization || null,
              category: action.fields.category || null,
              leadSource: 'ai_assistant'
            }
          });

          await prisma.aiAuditLog.create({
            data: {
              userId,
              actionType: 'create',
              entityType: 'contact',
              entityId: result.id,
              fieldsAfter: result,
              description: `AI created contact: ${action.fields.name}`
            }
          });
        }

        // ── UPDATE CASE ──
        if (action.entity === 'case' && action.type === 'update' && action.entityId) {
          const before = await prisma.case.findUnique({ where: { id: action.entityId } });
          if (!before) {
            results.push({ action, error: 'Case not found', skipped: true });
            continue;
          }

          const updateData = {};
          if (action.fields.status) updateData.status = action.fields.status;
          if (action.fields.priority) updateData.priority = action.fields.priority;
          if (action.fields.nextHearing) {
            try { updateData.nextHearing = new Date(action.fields.nextHearing); } catch {}
          }
          if (action.fields.assignedTo) updateData.assignedTo = action.fields.assignedTo;

          result = await prisma.case.update({
            where: { id: action.entityId },
            data: updateData
          });

          await prisma.aiAuditLog.create({
            data: {
              userId,
              actionType: 'update',
              entityType: 'case',
              entityId: action.entityId,
              fieldsBefore: before,
              fieldsAfter: result,
              description: `AI updated case: ${Object.keys(updateData).join(', ')}`
            }
          });
        }

        // ── CREATE RUNSHEET ENTRY ──
        if (action.entity === 'runsheet' && action.type === 'create') {
          result = await prisma.runsheetEntry.create({
            data: {
              caseId: action.fields.caseId,
              type: 'manual',
              title: action.fields.title,
              description: action.fields.description || null,
              userId,
              userName: req.user.name || req.user.email
            }
          });

          await prisma.aiAuditLog.create({
            data: {
              userId,
              actionType: 'create',
              entityType: 'runsheet',
              entityId: result.id,
              fieldsAfter: result,
              description: `AI created runsheet entry: ${action.fields.title}`
            }
          });
        }

        // ── CREATE INVOICE DRAFT ──
        if (action.entity === 'invoice' && action.type === 'create') {
          const invoiceNumber = `INV-AI-${Date.now()}`;
          result = await prisma.invoice.create({
            data: {
              invoiceNumber,
              caseId: action.fields.caseId || null,
              amount: 0,
              status: 'draft',
              description: action.fields.description || 'AI-generated invoice draft'
            }
          });

          await prisma.aiAuditLog.create({
            data: {
              userId,
              actionType: 'create',
              entityType: 'invoice',
              entityId: result.id,
              fieldsAfter: result,
              description: `AI created invoice draft: ${invoiceNumber}`
            }
          });
        }

        results.push({ action, result, success: true });
      } catch (err) {
        console.error('Error applying action:', err);
        results.push({ action, error: err.message, success: false });
      }
    }

    // Mark the message as applied
    if (messageId) {
      await prisma.aiMessage.update({
        where: { id: messageId },
        data: { appliedAt: new Date() }
      }).catch(() => {});
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success && !r.skipped).length;

    res.json({
      message: `Applied ${successCount} action(s)${failCount > 0 ? `, ${failCount} failed` : ''}`,
      results
    });
  } catch (error) {
    console.error('Apply actions error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET audit log
router.get('/audit-log', verifyToken, async (req, res) => {
  try {
    const logs = await prisma.aiAuditLog.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
