import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const LEGAL_SYSTEM_PROMPT = `You are an AI assistant for LegalTrack, a legal practice management system. Your role is to help lawyers and legal staff manage their cases, time tracking, contacts, tasks, and more.

You can perform the following actions:
- Create/update cases (title, type, priority, status, client, description)
- Log time entries (hours/minutes, description, billing code)
- Add/edit contacts (name, email, phone, organization, category)
- Create/complete tasks (title, due date, priority, description)
- Schedule events (hearings, meetings, deadlines, reminders)
- Create invoices (amount, due date, description)
- Add case notes/comments/runsheet entries

When a user asks you to do something, extract the intent and parameters, then respond with:
1. A natural, conversational confirmation of what you understood
2. The specific action(s) you'll take

Be concise, professional, and helpful. If the request is unclear, ask clarifying questions.

Current context:
- User is a legal professional
- All actions require user approval before execution (dry-run mode)
- Focus on efficiency and accuracy`;

export async function generateAIResponse(userMessage, conversationHistory = [], context = {}) {
  try {
    const messages = [
      { role: 'system', content: LEGAL_SYSTEM_PROMPT },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: userMessage }
    ];

    // Add context if available
    if (context.caseId) {
      messages[0].content += `\n\nCurrent case context: Case ID ${context.caseId}`;
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to generate AI response: ' + error.message);
  }
}

export async function extractActionsFromMessage(userMessage, aiResponse, context = {}) {
  try {
    const extractionPrompt = `Given this user request and AI response, extract structured actions in JSON format.

User request: "${userMessage}"
AI response: "${aiResponse}"

Extract actions as a JSON array. Each action should have:
- type: "create" or "update"
- entity: "time_entry", "case", "contact", "task", "event", "invoice", "runsheet", or "case_comment"
- fields: object with the data to create/update
- summary: brief human-readable description

Examples:
- "Log 2 hrs for client call" → [{"type":"create","entity":"time_entry","fields":{"description":"client call","durationMinutesBilled":120},"summary":"Log 2 hours for client call"}]
- "Create case Smith v Jones" → [{"type":"create","entity":"case","fields":{"title":"Smith v Jones","status":"Active"},"summary":"Create case Smith v Jones"}]

Return ONLY valid JSON array, no other text. If no actions, return [].`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a JSON extraction assistant. Return only valid JSON.' },
        { role: 'user', content: extractionPrompt }
      ],
      temperature: 0.3,
      max_tokens: 800,
    });

    const jsonText = completion.choices[0].message.content.trim();
    const actions = JSON.parse(jsonText);
    
    return Array.isArray(actions) ? actions : [];
  } catch (error) {
    console.error('Action extraction error:', error);
    return [];
  }
}

export async function generateStreamingResponse(userMessage, conversationHistory = [], context = {}) {
  const messages = [
    { role: 'system', content: LEGAL_SYSTEM_PROMPT },
    ...conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    })),
    { role: 'user', content: userMessage }
  ];

  if (context.caseId) {
    messages[0].content += `\n\nCurrent case context: Case ID ${context.caseId}`;
  }

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    temperature: 0.7,
    max_tokens: 500,
    stream: true,
  });

  return stream;
}
