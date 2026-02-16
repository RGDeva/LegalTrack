import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────────────

function parseFuzzyDate(str) {
  if (!str) return null;
  const lower = str.toLowerCase().trim();
  const now = new Date();

  if (lower === 'today') return now;
  if (lower === 'tomorrow') return new Date(now.getTime() + 86400000);
  if (lower === 'yesterday') return new Date(now.getTime() - 86400000);

  const relDays = lower.match(/in\s+(\d+)\s+days?/);
  if (relDays) return new Date(now.getTime() + parseInt(relDays[1]) * 86400000);
  const relWeeks = lower.match(/in\s+(\d+)\s+weeks?/);
  if (relWeeks) return new Date(now.getTime() + parseInt(relWeeks[1]) * 7 * 86400000);
  const relMonths = lower.match(/in\s+(\d+)\s+months?/);
  if (relMonths) return new Date(now.getFullYear(), now.getMonth() + parseInt(relMonths[1]), now.getDate());

  if (lower.startsWith('next week')) return new Date(now.getTime() + 7 * 86400000);
  if (lower.startsWith('next month')) return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
  if (lower.startsWith('next monday')) { const d = new Date(now); d.setDate(d.getDate() + ((1 + 7 - d.getDay()) % 7 || 7)); return d; }
  if (lower.startsWith('next friday')) { const d = new Date(now); d.setDate(d.getDate() + ((5 + 7 - d.getDay()) % 7 || 7)); return d; }
  if (lower.startsWith('end of week')) { const d = new Date(now); d.setDate(d.getDate() + (5 - d.getDay())); return d; }
  if (lower.startsWith('end of month')) return new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return parsed;
  return null;
}

function extractPhoneNumber(str) {
  const m = str.match(/(\+?[\d\s\-().]{7,})/);
  return m ? m[1].trim() : null;
}

function extractEmail(str) {
  const m = str.match(/([^\s<>]+@[^\s<>]+\.[^\s<>]+)/);
  return m ? m[1].trim() : null;
}

function extractAmount(str) {
  const m = str.match(/\$?([\d,]+(?:\.\d{1,2})?)/);
  return m ? parseFloat(m[1].replace(/,/g, '')) : null;
}

// ─── Action Parser ───────────────────────────────────────────────

function parseUserMessage(message, context) {
  const actions = [];
  const msg = message.trim();
  const lower = msg.toLowerCase();

  // ── HELP ──
  if (lower === 'help' || lower === '?' || /^what\s+can\s+you\s+do/i.test(lower) || /^commands$/i.test(lower)) {
    return { actions: [], isHelpQuery: true };
  }

  // ── STATUS / SUMMARY ──
  if (/(?:show|what|give|get|my)\s+(?:me\s+)?(?:a\s+)?(?:summary|status|overview|stats|dashboard)/i.test(lower)) {
    return { actions: [], isStatusQuery: true };
  }

  // ═══════════════════════════════════════════════════════════════
  // 1. TIME ENTRIES
  // ═══════════════════════════════════════════════════════════════

  // "log 1.5 hrs for client call under code CONSULT"
  // "record 30 min for research"
  // "track 2 hours for document review"
  const timeMatch = lower.match(/(?:log|record|track|add|enter)\s+([\d.]+)\s*(hrs?|hours?|min(?:utes?)?|mins?)\s+(?:for\s+|on\s+)?(.+?)(?:\s+under\s+(?:code\s+)?(.+?))?$/i);
  if (timeMatch) {
    const amount = parseFloat(timeMatch[1]);
    const unit = timeMatch[2].startsWith('min') ? 'minutes' : 'hours';
    const minutes = unit === 'hours' ? Math.round(amount * 60) : Math.round(amount);
    const description = timeMatch[3].trim();
    const billingCode = timeMatch[4]?.trim() || null;

    actions.push({
      type: 'create', entity: 'time_entry',
      fields: {
        description,
        durationMinutesBilled: minutes,
        durationMinutesRaw: minutes,
        matterId: context.caseId || null,
        billingCode, status: 'draft'
      },
      summary: `Log ${amount} ${unit} for "${description}"${billingCode ? ` (code: ${billingCode})` : ''}${context.caseId ? '' : ' (no case linked)'}`
    });
    return { actions };
  }

  // ═══════════════════════════════════════════════════════════════
  // 2. CASES — create, edit
  // ═══════════════════════════════════════════════════════════════

  // "create case Smith v. Jones type Civil priority High"
  // "new case for Johnson Estate"
  // "open case titled Contract Dispute"
  const createCaseMatch = lower.match(/(?:create|new|open|add)\s+(?:a\s+)?case\s+(?:titled?\s+|for\s+|named?\s+)?(.+)/i);
  if (createCaseMatch && actions.length === 0) {
    const rest = createCaseMatch[1].trim();
    // Extract optional fields from the rest
    let title = rest;
    let caseType = 'General';
    let priority = 'Medium';
    let clientName = null;
    let description = null;

    const typeMatch = rest.match(/\s+type\s+([\w\s]+?)(?:\s+priority|\s+client|\s+description|$)/i);
    if (typeMatch) { caseType = typeMatch[1].trim(); title = title.replace(typeMatch[0], '').trim(); }

    const priMatch = rest.match(/\s+priority\s+(high|medium|low|urgent)/i);
    if (priMatch) { priority = priMatch[1].trim(); title = title.replace(priMatch[0], '').trim(); }

    const clientMatch = rest.match(/\s+(?:client|for)\s+(.+?)(?:\s+type|\s+priority|\s+description|$)/i);
    if (clientMatch && !createCaseMatch[0].match(/case\s+for/i)) { clientName = clientMatch[1].trim(); title = title.replace(clientMatch[0], '').trim(); }

    const descMatch = rest.match(/\s+description\s+(.+)/i);
    if (descMatch) { description = descMatch[1].trim(); title = title.replace(descMatch[0], '').trim(); }

    actions.push({
      type: 'create', entity: 'case',
      fields: {
        title: title || 'Untitled Case',
        type: caseType, priority,
        clientName, description,
        status: 'Active'
      },
      summary: `Create case "${title}"${caseType !== 'General' ? ` (${caseType})` : ''}`
    });
    return { actions };
  }

  // "update case status to Pending" / "set case priority to High" / "change case type to Criminal"
  // "set hearing to March 15" / "set description to ..."
  // "close case" / "reopen case"
  const closeCaseMatch = lower.match(/^(close|reopen|archive)\s+(?:this\s+)?case$/i);
  if (closeCaseMatch && context.caseId) {
    const verb = closeCaseMatch[1].toLowerCase();
    const status = verb === 'close' ? 'Closed' : verb === 'archive' ? 'Archived' : 'Active';
    actions.push({
      type: 'update', entity: 'case', entityId: context.caseId,
      fields: { status },
      summary: `${verb.charAt(0).toUpperCase() + verb.slice(1)} case (set status to ${status})`
    });
    return { actions };
  }

  const updateCaseMatch = lower.match(/(?:update|set|change|edit)\s+(?:case\s+)?(?:the\s+)?(status|priority|type|hearing|next\s*hearing|description|title|assigned\s*to|billing\s*type|hourly\s*rate)\s+(?:to\s+)?(.+)/i);
  if (updateCaseMatch && context.caseId) {
    let field = updateCaseMatch[1].toLowerCase().replace(/\s+/g, '');
    const value = updateCaseMatch[2].trim();
    const fieldMap = {
      status: 'status', priority: 'priority', type: 'type',
      hearing: 'nextHearing', nexthearing: 'nextHearing',
      description: 'description', title: 'title',
      assignedto: 'assignedTo', billingtype: 'billingType',
      hourlyrate: 'hourlyRate'
    };
    const prismaField = fieldMap[field] || field;

    actions.push({
      type: 'update', entity: 'case', entityId: context.caseId,
      fields: { [prismaField]: value },
      summary: `Update case ${prismaField} to "${value}"`
    });
    return { actions };
  }

  // ═══════════════════════════════════════════════════════════════
  // 3. CONTACTS — create, edit
  // ═══════════════════════════════════════════════════════════════

  // "add contact John Smith john@law.com 555-1234 at Smith & Associates"
  // "create contact Jane Doe category client"
  // "add opposing counsel contact Bob Lee bob@firm.com"
  const addContactMatch = lower.match(/(?:add|create|new)\s+(?:(opposing\s+counsel|client|expert|vendor|court)\s+)?contact\s+(.+)/i);
  if (addContactMatch && actions.length === 0) {
    const categoryHint = addContactMatch[1]?.toLowerCase().replace(/\s+/g, '-') || null;
    const rest = addContactMatch[2].trim();

    const email = extractEmail(rest);
    const phone = extractPhoneNumber(rest.replace(email || '', ''));
    let nameStr = rest
      .replace(email || '', '')
      .replace(phone || '', '')
      .replace(/\s{2,}/g, ' ').trim();

    let organization = null;
    let category = categoryHint;
    let title = null;
    let notes = null;

    const orgMatch = nameStr.match(/\s+(?:at|from|org|organization|company)\s+(.+?)(?:\s+category|\s+title|\s+notes|$)/i);
    if (orgMatch) { organization = orgMatch[1].trim(); nameStr = nameStr.replace(orgMatch[0], '').trim(); }

    const catMatch = nameStr.match(/\s+category\s+([\w-]+)/i);
    if (catMatch) { category = catMatch[1].trim(); nameStr = nameStr.replace(catMatch[0], '').trim(); }

    const titleMatch = nameStr.match(/\s+title\s+(.+?)(?:\s+notes|$)/i);
    if (titleMatch) { title = titleMatch[1].trim(); nameStr = nameStr.replace(titleMatch[0], '').trim(); }

    const notesMatch = nameStr.match(/\s+notes?\s+(.+)/i);
    if (notesMatch) { notes = notesMatch[1].trim(); nameStr = nameStr.replace(notesMatch[0], '').trim(); }

    actions.push({
      type: 'create', entity: 'contact',
      fields: {
        name: nameStr || 'Unnamed Contact',
        email: email || '',
        phone: phone || null,
        organization, category, title, notes
      },
      summary: `Add contact "${nameStr}"${category ? ` (${category})` : ''}${email ? ` — ${email}` : ''}`
    });
    return { actions };
  }

  // "edit contact John Smith set email to john@new.com"
  // "update contact email to newemail@test.com" (needs entityId from context or search)
  const editContactMatch = lower.match(/(?:edit|update|change)\s+contact\s+(.+?)\s+(?:set\s+)?(name|email|phone|mobile|organization|title|category|notes|address|city|state|zip)\s+(?:to\s+)?(.+)/i);
  if (editContactMatch && actions.length === 0) {
    const contactSearch = editContactMatch[1].trim();
    const field = editContactMatch[2].toLowerCase();
    const value = editContactMatch[3].trim();

    actions.push({
      type: 'update', entity: 'contact',
      searchBy: contactSearch,
      fields: { [field]: value },
      summary: `Update contact "${contactSearch}" — set ${field} to "${value}"`
    });
    return { actions };
  }

  // ═══════════════════════════════════════════════════════════════
  // 4. TASKS — create, edit, complete
  // ═══════════════════════════════════════════════════════════════

  // "create tasks for discovery with subtasks and due dates"
  const tasksWithSubMatch = lower.match(/create\s+tasks?\s+for\s+(.+?)\s+with\s+subtasks/i);
  if (tasksWithSubMatch && actions.length === 0) {
    const topic = tasksWithSubMatch[1].trim();
    const subtasks = generateSubtasksForTopic(topic);
    actions.push({
      type: 'create', entity: 'task',
      fields: { title: topic, caseId: context.caseId || null, status: 'pending', priority: 'medium' },
      subtasks,
      summary: `Create task "${topic}" with ${subtasks.length} subtasks`
    });
    return { actions };
  }

  // "create task Review contract due tomorrow priority high"
  // "add task File motion due next Friday"
  const taskMatch = lower.match(/(?:create|add|new)\s+task\s+(?:for\s+|titled?\s+)?(.+)/i);
  if (taskMatch && actions.length === 0) {
    let rest = taskMatch[1].trim();
    let dueDate = null;
    let priority = 'medium';
    let description = null;

    const dueMatch = rest.match(/\s+due\s+(.+?)(?:\s+priority|\s+description|$)/i);
    if (dueMatch) { dueDate = parseFuzzyDate(dueMatch[1].trim()); rest = rest.replace(dueMatch[0], '').trim(); }

    const priMatch = rest.match(/\s+priority\s+(high|medium|low|urgent)/i);
    if (priMatch) { priority = priMatch[1].toLowerCase(); rest = rest.replace(priMatch[0], '').trim(); }

    const descMatch = rest.match(/\s+description\s+(.+)/i);
    if (descMatch) { description = descMatch[1].trim(); rest = rest.replace(descMatch[0], '').trim(); }

    actions.push({
      type: 'create', entity: 'task',
      fields: {
        title: rest || 'Untitled Task',
        caseId: context.caseId || null,
        dueDate: dueDate ? dueDate.toISOString() : null,
        status: 'pending',
        priority: priority === 'urgent' ? 'high' : priority,
        description
      },
      summary: `Create task "${rest}"${dueDate ? ` due ${dueDate.toLocaleDateString()}` : ''}${priority !== 'medium' ? ` (${priority})` : ''}`
    });
    return { actions };
  }

  // "complete task Review contract" / "mark task done"
  const completeTaskMatch = lower.match(/(?:complete|finish|close|mark\s+(?:as\s+)?(?:done|completed?))\s+task\s+(.+)/i);
  if (completeTaskMatch && actions.length === 0) {
    actions.push({
      type: 'update', entity: 'task',
      searchBy: completeTaskMatch[1].trim(),
      fields: { status: 'completed' },
      summary: `Mark task "${completeTaskMatch[1].trim()}" as completed`
    });
    return { actions };
  }

  // ═══════════════════════════════════════════════════════════════
  // 5. EVENTS / CALENDAR
  // ═══════════════════════════════════════════════════════════════

  // "schedule hearing for Smith v. Jones on March 15"
  // "add meeting Client intake tomorrow at 2pm"
  // "create deadline Filing deadline on next Friday"
  // "schedule reminder Follow up in 3 days"
  const eventMatch = lower.match(/(?:schedule|add|create|set)\s+(?:a\s+|an\s+)?(event|hearing|meeting|deadline|reminder|appointment|consultation|deposition|mediation)\s+(?:for\s+|titled?\s+|called\s+)?(.+)/i);
  if (eventMatch && actions.length === 0) {
    const eventType = eventMatch[1].toLowerCase();
    let rest = eventMatch[2].trim();
    let startTime = null;
    let location = null;
    let description = null;

    // Extract date: "on March 15", "at tomorrow", "for next Friday"
    const dateMatch = rest.match(/\s+(?:on|at|for)\s+(today|tomorrow|next\s+\w+|in\s+\d+\s+\w+|end\s+of\s+\w+|\w+\s+\d{1,2}(?:,?\s+\d{4})?|\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?)(?:\s|$)/i);
    if (dateMatch) { startTime = parseFuzzyDate(dateMatch[1].trim()); rest = rest.replace(dateMatch[0], ' ').trim(); }

    const locMatch = rest.match(/\s+(?:at|location|in)\s+(.+?)(?:\s+description|$)/i);
    if (locMatch && !dateMatch) { location = locMatch[1].trim(); rest = rest.replace(locMatch[0], '').trim(); }

    const descMatch = rest.match(/\s+description\s+(.+)/i);
    if (descMatch) { description = descMatch[1].trim(); rest = rest.replace(descMatch[0], '').trim(); }

    actions.push({
      type: 'create', entity: 'event',
      fields: {
        title: rest || `New ${eventType}`,
        type: eventType,
        startTime: startTime ? startTime.toISOString() : null,
        endTime: startTime ? new Date(startTime.getTime() + 3600000).toISOString() : null,
        location, description,
        caseId: context.caseId || null
      },
      summary: `Schedule ${eventType}: "${rest}"${startTime ? ` on ${startTime.toLocaleDateString()}` : ' (date TBD)'}`
    });
    return { actions };
  }

  // ═══════════════════════════════════════════════════════════════
  // 6. INVOICES
  // ═══════════════════════════════════════════════════════════════

  // "create invoice draft" / "generate invoice for $5000"
  // "create invoice for current case amount $2500 due next month"
  const invoiceMatch = lower.match(/(?:create|generate|new|draft)\s+(?:an?\s+)?invoice\s*(?:draft)?\s*(?:for\s+)?(.+)?/i);
  if (invoiceMatch && actions.length === 0) {
    const rest = (invoiceMatch[1] || '').trim();
    const amount = extractAmount(rest);
    let dueDate = null;
    let description = rest;

    const dueMatch = rest.match(/\s+due\s+(.+?)(?:\s+amount|$)/i);
    if (dueMatch) { dueDate = parseFuzzyDate(dueMatch[1].trim()); description = description.replace(dueMatch[0], '').trim(); }

    // Clean up description
    description = description.replace(/\$[\d,.]+/, '').replace(/amount\s+/i, '').trim() || 'Invoice draft';

    actions.push({
      type: 'create', entity: 'invoice',
      fields: {
        caseId: context.caseId || null,
        status: 'draft',
        amount: amount || 0,
        description,
        dueDate: dueDate ? dueDate.toISOString() : null
      },
      summary: `Create invoice draft${amount ? ` for $${amount.toLocaleString()}` : ''}${context.caseId ? ' for current case' : ''}${dueDate ? ` due ${dueDate.toLocaleDateString()}` : ''}`
    });
    return { actions };
  }

  // ═══════════════════════════════════════════════════════════════
  // 7. NOTES / COMMENTS / RUNSHEET
  // ═══════════════════════════════════════════════════════════════

  // "add note Filed motion for summary judgment"
  // "add case comment Client called about status"
  // "add meeting notes Discussed settlement options"
  const noteMatch = lower.match(/(?:add|create|write|post)\s+(?:a\s+)?(note|comment|case\s*comment|meeting\s*note|case\s*note|runsheet\s*entry)\s*[:\-]?\s*(.+)/i);
  if (noteMatch && actions.length === 0) {
    const noteType = noteMatch[1].toLowerCase();
    const content = noteMatch[2].trim();

    if ((noteType.includes('comment') || noteType.includes('case')) && context.caseId) {
      actions.push({
        type: 'create', entity: 'case_comment',
        fields: { caseId: context.caseId, comment: content },
        summary: `Add case comment: "${content.substring(0, 60)}${content.length > 60 ? '...' : ''}"`
      });
    } else if (context.caseId) {
      actions.push({
        type: 'create', entity: 'runsheet',
        fields: {
          caseId: context.caseId, type: noteType.includes('meeting') ? 'meeting' : 'manual',
          title: content.substring(0, 80),
          description: content
        },
        summary: `Add ${noteType.includes('meeting') ? 'meeting note' : 'note'}: "${content.substring(0, 60)}${content.length > 60 ? '...' : ''}"`
      });
    } else {
      // No case context — create as a general task/note
      actions.push({
        type: 'create', entity: 'task',
        fields: { title: `Note: ${content.substring(0, 80)}`, description: content, status: 'pending', priority: 'low' },
        summary: `Add note as task: "${content.substring(0, 60)}${content.length > 60 ? '...' : ''}" (no case linked)`
      });
    }
    return { actions };
  }

  // ═══════════════════════════════════════════════════════════════
  // 8. QUICK SHORTCUTS
  // ═══════════════════════════════════════════════════════════════

  // "bill 2 hrs for research" (alias for log time)
  const billMatch = lower.match(/bill\s+([\d.]+)\s*(hrs?|hours?|min(?:utes?)?)\s+(?:for\s+)?(.+)/i);
  if (billMatch && actions.length === 0) {
    const amount = parseFloat(billMatch[1]);
    const unit = billMatch[2].startsWith('min') ? 'minutes' : 'hours';
    const minutes = unit === 'hours' ? Math.round(amount * 60) : Math.round(amount);
    actions.push({
      type: 'create', entity: 'time_entry',
      fields: { description: billMatch[3].trim(), durationMinutesBilled: minutes, durationMinutesRaw: minutes, matterId: context.caseId || null, status: 'draft' },
      summary: `Bill ${amount} ${unit} for "${billMatch[3].trim()}"`
    });
    return { actions };
  }

  // "remind me to file motion in 3 days"
  const remindMatch = lower.match(/remind\s+(?:me\s+)?(?:to\s+)?(.+?)(?:\s+(?:in|on|at|by)\s+(.+))?$/i);
  if (remindMatch && actions.length === 0) {
    const title = remindMatch[1].trim();
    const dateStr = remindMatch[2]?.trim();
    const dueDate = parseFuzzyDate(dateStr);
    actions.push({
      type: 'create', entity: 'event',
      fields: {
        title: `Reminder: ${title}`, type: 'reminder',
        startTime: dueDate ? dueDate.toISOString() : new Date(Date.now() + 86400000).toISOString(),
        endTime: dueDate ? new Date(dueDate.getTime() + 1800000).toISOString() : new Date(Date.now() + 86400000 + 1800000).toISOString(),
        caseId: context.caseId || null
      },
      summary: `Set reminder: "${title}"${dueDate ? ` on ${dueDate.toLocaleDateString()}` : ' (tomorrow)'}`
    });
    return { actions };
  }

  // ═══════════════════════════════════════════════════════════════
  // FALLBACK
  // ═══════════════════════════════════════════════════════════════
  return { actions: [], isStatusQuery: false, isHelpQuery: false };
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
      { title: 'Prepare direct/cross examination outlines', dueOffset: 14 },
      { title: 'Draft closing argument', dueOffset: 7 },
      { title: 'Final trial binder preparation', dueOffset: 3 }
    ];
  }
  if (lower.includes('filing') || lower.includes('complaint') || lower.includes('motion')) {
    return [
      { title: 'Research applicable law', dueOffset: 7 },
      { title: 'Draft complaint/motion', dueOffset: 14 },
      { title: 'Review and revise draft', dueOffset: 17 },
      { title: 'Prepare exhibits', dueOffset: 19 },
      { title: 'File with court', dueOffset: 21 },
      { title: 'Arrange service of process', dueOffset: 23 }
    ];
  }
  if (lower.includes('mediation') || lower.includes('settlement')) {
    return [
      { title: 'Prepare mediation brief', dueOffset: 14 },
      { title: 'Gather settlement documentation', dueOffset: 10 },
      { title: 'Calculate damages/settlement range', dueOffset: 12 },
      { title: 'Prepare client for mediation', dueOffset: 3 },
      { title: 'Attend mediation session', dueOffset: 21 },
      { title: 'Draft settlement agreement', dueOffset: 28 }
    ];
  }
  if (lower.includes('client') && lower.includes('intake')) {
    return [
      { title: 'Initial client interview', dueOffset: 1 },
      { title: 'Conflict check', dueOffset: 2 },
      { title: 'Engagement letter', dueOffset: 3 },
      { title: 'Collect initial documents', dueOffset: 7 },
      { title: 'Open matter file', dueOffset: 3 },
      { title: 'Set up billing', dueOffset: 5 }
    ];
  }
  return [
    { title: `Research for ${topic}`, dueOffset: 7 },
    { title: `Draft documents for ${topic}`, dueOffset: 14 },
    { title: `Review and finalize ${topic}`, dueOffset: 21 },
    { title: `Complete ${topic}`, dueOffset: 28 }
  ];
}

// ─── Response Generator ──────────────────────────────────────────

function generateAssistantResponse(message, parseResult, context) {
  const { actions, isStatusQuery, isHelpQuery } = parseResult;

  if (isHelpQuery) {
    return `Here's everything I can do:\n\n` +
      `**⏱ Time Tracking**\n` +
      `• "Log 2 hrs for client consultation"\n` +
      `• "Bill 30 min for document review"\n` +
      `• "Track 1.5 hours for research under code RESEARCH"\n\n` +
      `**📁 Cases**\n` +
      `• "Create case Smith v. Jones type Civil priority High"\n` +
      `• "Set case status to Pending" · "Close case" · "Reopen case"\n` +
      `• "Update case priority to High" · "Set hearing to March 15"\n\n` +
      `**👤 Contacts**\n` +
      `• "Add contact Jane Smith jane@law.com at Smith & Associates"\n` +
      `• "Add opposing counsel contact Bob Lee"\n` +
      `• "Edit contact John Smith set email to new@email.com"\n\n` +
      `**📋 Tasks**\n` +
      `• "Create task Review contract due next Friday priority high"\n` +
      `• "Create tasks for discovery with subtasks"\n` +
      `• "Complete task Review contract"\n\n` +
      `**📅 Calendar & Events**\n` +
      `• "Schedule hearing for Smith case on March 15"\n` +
      `• "Add meeting Client intake tomorrow"\n` +
      `• "Schedule deposition for next Monday"\n` +
      `• "Remind me to file motion in 3 days"\n\n` +
      `**💰 Invoices**\n` +
      `• "Create invoice draft for $5000 due next month"\n` +
      `• "Generate invoice for current case"\n\n` +
      `**📝 Notes & Comments**\n` +
      `• "Add note Filed motion for summary judgment"\n` +
      `• "Add case comment Client called about status"\n` +
      `• "Add meeting notes Discussed settlement options"\n\n` +
      `All actions are shown for review before being applied. Type a command to get started!`;
  }

  if (isStatusQuery) {
    return `Here's what you can check:\n\n` +
      `• **Dashboard** — case stats, billable hours, deadlines\n` +
      `• **Time Tracking** — recent entries and running timers\n` +
      `• **Calendar** — upcoming events, hearings, deadlines\n` +
      `• **Tasks** — your assigned and pending tasks\n\n` +
      `Or tell me what to do: "Create a case", "Log time", "Add a contact", etc.`;
  }

  if (actions.length === 0) {
    return `I didn't quite catch that. Here are some things you can say:\n\n` +
      `• **"Create case Smith v. Jones"** — open a new case\n` +
      `• **"Add contact John Smith john@law.com"** — new contact\n` +
      `• **"Log 1.5 hrs for client call"** — track time\n` +
      `• **"Create task Review documents due Friday"** — add task\n` +
      `• **"Schedule hearing for March 15"** — calendar event\n` +
      `• **"Create invoice draft for $2500"** — billing\n` +
      `• **"Add note: Filed motion"** — case notes\n` +
      `• **"Remind me to follow up in 3 days"** — reminders\n\n` +
      `Type **"help"** for the complete list of commands.`;
  }

  const summaries = actions.map((a, i) => `${i + 1}. **${a.summary}**`).join('\n');
  let response = `I've prepared the following action${actions.length > 1 ? 's' : ''} for your review:\n\n${summaries}\n\n`;

  if (actions.some(a => a.subtasks)) {
    const taskAction = actions.find(a => a.subtasks);
    response += `**Subtasks:**\n${taskAction.subtasks.map((s, i) => `  ${i + 1}. ${s.title} (due in ${s.dueOffset} days)`).join('\n')}\n\n`;
  }

  response += `Click **"Apply"** to execute, or rephrase to adjust.`;
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
    const parseResult = parseUserMessage(message, context);
    const proposedActions = parseResult.actions || parseResult;
    const assistantResponse = generateAssistantResponse(message, 
      Array.isArray(parseResult) ? { actions: parseResult } : parseResult, 
      context
    );

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
          const rateCents = 25000;
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
            data: { userId, actionType: 'create', entityType: 'time_entry', entityId: result.id, fieldsAfter: result,
              description: `AI created time entry: ${action.fields.description} (${minutes} min)` }
          });
        }

        // ── CREATE CASE ──
        if (action.entity === 'case' && action.type === 'create') {
          const caseNumber = `CASE-${Date.now()}`;
          result = await prisma.case.create({
            data: {
              caseNumber,
              title: action.fields.title || 'Untitled Case',
              clientName: action.fields.clientName || null,
              status: action.fields.status || 'Active',
              type: action.fields.type || 'General',
              priority: action.fields.priority || 'Medium',
              description: action.fields.description || null,
              dateOpened: new Date()
            }
          });

          await prisma.aiAuditLog.create({
            data: { userId, actionType: 'create', entityType: 'case', entityId: result.id, fieldsAfter: result,
              description: `AI created case: ${action.fields.title} (${caseNumber})` }
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
          const fields = action.fields || {};
          if (fields.status) updateData.status = fields.status;
          if (fields.priority) updateData.priority = fields.priority;
          if (fields.type) updateData.type = fields.type;
          if (fields.title) updateData.title = fields.title;
          if (fields.description) updateData.description = fields.description;
          if (fields.assignedTo) updateData.assignedTo = fields.assignedTo;
          if (fields.billingType) updateData.billingType = fields.billingType;
          if (fields.hourlyRate) updateData.hourlyRate = parseFloat(fields.hourlyRate);
          if (fields.nextHearing) {
            try { updateData.nextHearing = new Date(fields.nextHearing); } catch {}
          }

          result = await prisma.case.update({ where: { id: action.entityId }, data: updateData });

          await prisma.aiAuditLog.create({
            data: { userId, actionType: 'update', entityType: 'case', entityId: action.entityId,
              fieldsBefore: before, fieldsAfter: result,
              description: `AI updated case: ${Object.keys(updateData).join(', ')}` }
          });
        }

        // ── CREATE CONTACT ──
        if (action.entity === 'contact' && action.type === 'create') {
          if (action.fields.email && action.fields.email.includes('@')) {
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
              title: action.fields.title || null,
              category: action.fields.category || null,
              notes: action.fields.notes || null,
              leadSource: 'ai_assistant'
            }
          });

          await prisma.aiAuditLog.create({
            data: { userId, actionType: 'create', entityType: 'contact', entityId: result.id, fieldsAfter: result,
              description: `AI created contact: ${action.fields.name}` }
          });
        }

        // ── UPDATE CONTACT (by search) ──
        if (action.entity === 'contact' && action.type === 'update') {
          let contact = null;
          if (action.entityId) {
            contact = await prisma.contact.findUnique({ where: { id: action.entityId } });
          } else if (action.searchBy) {
            contact = await prisma.contact.findFirst({
              where: {
                OR: [
                  { name: { contains: action.searchBy, mode: 'insensitive' } },
                  { email: { contains: action.searchBy, mode: 'insensitive' } }
                ]
              }
            });
          }
          if (!contact) {
            results.push({ action, error: `Contact "${action.searchBy || action.entityId}" not found`, skipped: true });
            continue;
          }

          const before = { ...contact };
          result = await prisma.contact.update({
            where: { id: contact.id },
            data: action.fields
          });

          await prisma.aiAuditLog.create({
            data: { userId, actionType: 'update', entityType: 'contact', entityId: contact.id,
              fieldsBefore: before, fieldsAfter: result,
              description: `AI updated contact ${contact.name}: ${Object.keys(action.fields).join(', ')}` }
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
              status: action.fields.status || 'pending',
              priority: action.fields.priority || 'medium',
              dueDate
            }
          });

          if (action.subtasks && Array.isArray(action.subtasks)) {
            for (let i = 0; i < action.subtasks.length; i++) {
              const sub = action.subtasks[i];
              const subDue = sub.dueOffset ? new Date(Date.now() + sub.dueOffset * 86400000) : null;
              await prisma.subtask.create({
                data: {
                  title: sub.title, taskId: result.id, createdById: userId,
                  assignedToId: sub.assignedToId || null, orderIndex: i,
                  dueDate: subDue, status: 'pending'
                }
              });
            }
          }

          await prisma.aiAuditLog.create({
            data: { userId, actionType: 'create', entityType: 'task', entityId: result.id, fieldsAfter: result,
              description: `AI created task: ${action.fields.title}${action.subtasks ? ` with ${action.subtasks.length} subtasks` : ''}` }
          });
        }

        // ── UPDATE TASK (by search or ID) ──
        if (action.entity === 'task' && action.type === 'update') {
          let task = null;
          if (action.entityId) {
            task = await prisma.task.findUnique({ where: { id: action.entityId } });
          } else if (action.searchBy) {
            task = await prisma.task.findFirst({
              where: { title: { contains: action.searchBy, mode: 'insensitive' } },
              orderBy: { createdAt: 'desc' }
            });
          }
          if (!task) {
            results.push({ action, error: `Task "${action.searchBy || action.entityId}" not found`, skipped: true });
            continue;
          }

          const before = { ...task };
          const updateData = { ...action.fields };
          if (updateData.dueDate) {
            try { updateData.dueDate = new Date(updateData.dueDate); } catch { delete updateData.dueDate; }
          }

          result = await prisma.task.update({ where: { id: task.id }, data: updateData });

          await prisma.aiAuditLog.create({
            data: { userId, actionType: 'update', entityType: 'task', entityId: task.id,
              fieldsBefore: before, fieldsAfter: result,
              description: `AI updated task "${task.title}": ${Object.keys(action.fields).join(', ')}` }
          });
        }

        // ── CREATE CASE COMMENT ──
        if (action.entity === 'case_comment' && action.type === 'create') {
          if (!action.fields.caseId) {
            results.push({ action, error: 'No case linked for comment', skipped: true });
            continue;
          }

          result = await prisma.caseComment.create({
            data: {
              caseId: action.fields.caseId,
              userId,
              comment: action.fields.comment
            }
          });

          await prisma.aiAuditLog.create({
            data: { userId, actionType: 'create', entityType: 'case_comment', entityId: result.id, fieldsAfter: result,
              description: `AI added case comment: ${action.fields.comment.substring(0, 80)}` }
          });
        }

        // ── CREATE RUNSHEET ENTRY ──
        if (action.entity === 'runsheet' && action.type === 'create') {
          result = await prisma.runsheetEntry.create({
            data: {
              caseId: action.fields.caseId,
              type: action.fields.type || 'manual',
              title: action.fields.title,
              description: action.fields.description || null,
              userId,
              userName: req.user.name || req.user.email
            }
          });

          await prisma.aiAuditLog.create({
            data: { userId, actionType: 'create', entityType: 'runsheet', entityId: result.id, fieldsAfter: result,
              description: `AI created runsheet entry: ${action.fields.title}` }
          });
        }

        // ── CREATE EVENT ──
        if (action.entity === 'event' && action.type === 'create') {
          const startTime = action.fields.startTime ? new Date(action.fields.startTime) : new Date(Date.now() + 86400000);
          const endTime = action.fields.endTime ? new Date(action.fields.endTime) : new Date(startTime.getTime() + 3600000);

          result = await prisma.event.create({
            data: {
              title: action.fields.title || 'AI-created event',
              description: action.fields.description || null,
              type: action.fields.type || 'event',
              startTime, endTime,
              location: action.fields.location || null,
              caseId: action.fields.caseId || null,
              createdById: userId,
              allDay: false
            }
          });

          await prisma.aiAuditLog.create({
            data: { userId, actionType: 'create', entityType: 'event', entityId: result.id, fieldsAfter: result,
              description: `AI created ${action.fields.type || 'event'}: ${action.fields.title}` }
          });
        }

        // ── CREATE INVOICE DRAFT ──
        if (action.entity === 'invoice' && action.type === 'create') {
          const invoiceNumber = `INV-AI-${Date.now()}`;
          result = await prisma.invoice.create({
            data: {
              invoiceNumber,
              caseId: action.fields.caseId || null,
              amount: action.fields.amount || 0,
              status: 'draft',
              description: action.fields.description || 'AI-generated invoice draft',
              dueDate: action.fields.dueDate ? new Date(action.fields.dueDate) : null
            }
          });

          await prisma.aiAuditLog.create({
            data: { userId, actionType: 'create', entityType: 'invoice', entityId: result.id, fieldsAfter: result,
              description: `AI created invoice draft: ${invoiceNumber}${action.fields.amount ? ` ($${action.fields.amount})` : ''}` }
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

export { parseUserMessage, generateAssistantResponse };
export default router;
