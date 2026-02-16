# OpenAI Integration for LegalTrack AI Assistant

## Overview

The LegalTrack AI Assistant now supports **OpenAI GPT-4** integration for enhanced natural language understanding while maintaining the robust rule-based action parser as a fallback.

## Features

### Hybrid AI System
- **Primary**: OpenAI GPT-4o-mini for natural language understanding
- **Fallback**: Rule-based parser for reliability when OpenAI is unavailable
- **Automatic**: Switches seamlessly between modes

### Capabilities
- Natural conversation understanding
- Context-aware responses
- Structured action extraction from natural language
- All existing rule-based actions supported
- Conversation history for better context

## Setup

### 1. Get OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy the key (starts with `sk-`)

### 2. Configure Backend
Add to your `.env` file:
```bash
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
```

### 3. Restart Backend
```bash
cd backend
npm run dev
```

The server will automatically detect the OpenAI API key and enable enhanced AI mode.

## How It Works

### Request Flow
1. User sends message to `/api/ai/actions-openai`
2. System checks if `OPENAI_API_KEY` is configured
3. **If OpenAI is available:**
   - Sends message to GPT-4o-mini with legal context
   - Extracts structured actions from AI response
   - Falls back to rule-based parser if no actions extracted
4. **If OpenAI is unavailable:**
   - Uses rule-based parser directly
   - Returns structured actions as before

### Response Format
```json
{
  "conversationId": "uuid",
  "messageId": "uuid",
  "response": "Natural language response from AI",
  "proposedActions": [
    {
      "type": "create",
      "entity": "time_entry",
      "fields": { "description": "...", "durationMinutesBilled": 120 },
      "summary": "Log 2 hours for client call"
    }
  ],
  "aiMode": "openai" // or "rule-based"
}
```

## Supported Actions

All existing actions are supported:
- ⏱️ **Time Entries**: Log time, track hours
- 📁 **Cases**: Create, update, close cases
- 👤 **Contacts**: Add, edit contacts
- 📋 **Tasks**: Create tasks with subtasks
- 📅 **Events**: Schedule hearings, meetings, reminders
- 💰 **Invoices**: Create invoice drafts
- 📝 **Notes**: Add case comments, runsheet entries

## Example Usage

### Natural Language (OpenAI)
```
User: "I just spent 2 hours on a client call for the Smith case, can you log that?"
AI: "I'll log 2 hours for a client call. This will create a time entry with 120 minutes billed."
```

### Structured Commands (Rule-based fallback)
```
User: "Log 2 hrs for client call"
AI: "I've prepared the following action for your review:
     1. Log 2 hours for 'client call'"
```

## Cost Management

### Model Used
- **GPT-4o-mini**: Cost-effective model (~$0.15 per 1M input tokens)
- Average request: ~500 tokens = $0.000075 per request
- 10,000 requests ≈ $0.75

### Token Limits
- Max response: 500 tokens (keeps responses concise)
- Conversation history: Last 10 messages (prevents token bloat)

## Monitoring

Check server logs for AI mode:
```
✅ OpenAI API key configured - Enhanced AI mode enabled
```

Or:
```
⚠️  No OpenAI API key - Using rule-based parser
```

## Troubleshooting

### OpenAI Not Working
1. Check API key is valid: `echo $OPENAI_API_KEY`
2. Verify key has credits: https://platform.openai.com/usage
3. Check server logs for errors
4. System automatically falls back to rule-based parser

### Rate Limits
- OpenAI free tier: 3 RPM (requests per minute)
- OpenAI paid tier: 3,500 RPM
- LegalTrack has general rate limiting: 100 requests per 15 min

## Security

- ✅ API key stored in `.env` (not committed to git)
- ✅ Server-side only (never exposed to frontend)
- ✅ User authentication required for all AI requests
- ✅ Audit log tracks all applied actions

## Future Enhancements

Planned features:
- [ ] Document summarization
- [ ] Legal research assistance
- [ ] Draft generation (motions, emails)
- [ ] Streaming responses for real-time feedback
- [ ] Custom legal prompts per firm
- [ ] GPT-4 upgrade for complex queries

## Files Modified

### Backend
- `src/services/openaiService.js` - OpenAI wrapper service
- `src/routes/aiOpenAI.js` - Hybrid AI route handler
- `src/server.js` - Route registration
- `.env.example` - Environment variable template

### Frontend
- `src/components/ai/GlobalAiWidget.tsx` - Updated endpoint
- `src/components/cases/CaseAiPanel.tsx` - Updated endpoint

## Support

For issues or questions:
1. Check server logs for error messages
2. Verify OpenAI API key is valid
3. Test with rule-based mode (remove API key temporarily)
4. Review audit log: `/api/ai/audit-log`
