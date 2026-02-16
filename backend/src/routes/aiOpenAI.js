import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/auth.js';
import { generateAIResponse, extractActionsFromMessage } from '../services/openaiService.js';

const router = express.Router();
const prisma = new PrismaClient();

// Import the rule-based parser as fallback
import { parseUserMessage as ruleBased, generateAssistantResponse as ruleBasedResponse } from './ai.js';

// POST /ai/actions-openai - Parse user message using OpenAI and return proposed actions
router.post('/actions-openai', verifyToken, async (req, res) => {
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
        where: { id: conversationId, userId: req.user.id },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 10 // Last 10 messages for context
          }
        }
      });
    }
    if (!conversation) {
      conversation = await prisma.aiConversation.create({
        data: {
          userId: req.user.id,
          caseId: caseId || null,
          title: message.substring(0, 80)
        },
        include: { messages: true }
      });
    }

    // Build conversation history for OpenAI
    const conversationHistory = conversation.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    let assistantResponse;
    let proposedActions = [];
    let useOpenAI = !!process.env.OPENAI_API_KEY;

    if (useOpenAI) {
      try {
        // Use OpenAI for natural language understanding
        assistantResponse = await generateAIResponse(message, conversationHistory, context);
        
        // Extract structured actions from the AI response
        proposedActions = await extractActionsFromMessage(message, assistantResponse, context);
        
        // If OpenAI didn't extract actions, try rule-based parser as fallback
        if (proposedActions.length === 0) {
          const ruleResult = ruleBased(message, context);
          if (ruleResult.actions && ruleResult.actions.length > 0) {
            proposedActions = ruleResult.actions;
            // Enhance the OpenAI response with action details
            assistantResponse += '\n\n' + ruleBasedResponse(message, ruleResult, context);
          }
        }
      } catch (openaiError) {
        console.error('OpenAI error, falling back to rule-based:', openaiError);
        // Fallback to rule-based parser
        const ruleResult = ruleBased(message, context);
        assistantResponse = ruleBasedResponse(message, ruleResult, context);
        proposedActions = ruleResult.actions || [];
      }
    } else {
      // No OpenAI key, use rule-based parser
      const ruleResult = ruleBased(message, context);
      assistantResponse = ruleBasedResponse(message, ruleResult, context);
      proposedActions = ruleResult.actions || [];
    }

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
      proposedActions,
      aiMode: useOpenAI ? 'openai' : 'rule-based'
    });
  } catch (error) {
    console.error('AI actions error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export the rule-based functions for reuse
export { ruleBased as parseUserMessage, ruleBasedResponse as generateAssistantResponse };

export default router;
