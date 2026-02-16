/**
 * Pluggable Email Transport Layer
 * Supports Resend and Unosend providers with automatic fallback
 */

import { Resend } from 'resend';

// Provider configuration
const MAIL_PROVIDER = process.env.MAIL_PROVIDER || 'resend';
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const UNOSEND_API_KEY = process.env.UNOSEND_API_KEY;
const UNOSEND_API_BASE_URL = process.env.UNOSEND_API_BASE_URL || 'https://api.unosend.com/v1';
const EMAIL_FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev';

// Initialize Resend client (lazy)
let resendClient = null;

/**
 * Get or initialize Resend client
 */
function getResendClient() {
  if (!resendClient && RESEND_API_KEY) {
    resendClient = new Resend(RESEND_API_KEY);
  }
  return resendClient;
}

/**
 * Send email via Resend
 */
async function sendViaResend({ to, subject, html, from }) {
  const client = getResendClient();
  
  if (!client) {
    throw new Error('Resend provider error: RESEND_API_KEY is not configured');
  }

  try {
    const { data, error } = await client.emails.send({
      from: from || EMAIL_FROM,
      to,
      subject,
      html,
    });

    if (error) {
      throw new Error(`Resend API error: ${error.message || JSON.stringify(error)}`);
    }

    return {
      id: data?.id || 'unknown',
      provider: 'resend',
      raw: data,
    };
  } catch (error) {
    throw new Error(`Resend provider error: ${error.message}`);
  }
}

/**
 * Send email via Unosend
 */
async function sendViaUnosend({ to, subject, html, from }) {
  if (!UNOSEND_API_KEY) {
    throw new Error('Unosend provider error: UNOSEND_API_KEY is not configured');
  }

  try {
    const response = await fetch(`${UNOSEND_API_BASE_URL}/emails`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${UNOSEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: from || EMAIL_FROM,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorText;
      } catch {
        errorMessage = errorText;
      }
      throw new Error(`Unosend API error (${response.status}): ${errorMessage}`);
    }

    const data = await response.json();

    return {
      id: data?.id || data?.messageId || 'unknown',
      provider: 'unosend',
      raw: data,
    };
  } catch (error) {
    if (error.message.startsWith('Unosend')) {
      throw error;
    }
    throw new Error(`Unosend provider error: ${error.message}`);
  }
}

/**
 * Main email sending function with provider routing
 * @param {Object} options - Email options
 * @param {string|string[]} options.to - Recipient email(s)
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} [options.from] - Sender email (optional, uses EMAIL_FROM env var)
 * @returns {Promise<{id: string, provider: string, raw: any}>}
 */
export async function sendEmail({ to, subject, html, from }) {
  // Validate required parameters
  if (!to) {
    throw new Error('Email validation error: "to" field is required');
  }
  if (!subject) {
    throw new Error('Email validation error: "subject" field is required');
  }
  if (!html) {
    throw new Error('Email validation error: "html" field is required');
  }

  // Route to appropriate provider
  const provider = MAIL_PROVIDER.toLowerCase();

  switch (provider) {
    case 'resend':
      return await sendViaResend({ to, subject, html, from });
    
    case 'unosend':
      return await sendViaUnosend({ to, subject, html, from });
    
    default:
      // Default to Resend for backward compatibility
      console.warn(`Unknown MAIL_PROVIDER "${MAIL_PROVIDER}", defaulting to Resend`);
      return await sendViaResend({ to, subject, html, from });
  }
}

/**
 * Get current mail provider configuration
 */
export function getMailProviderInfo() {
  return {
    provider: MAIL_PROVIDER,
    configured: {
      resend: !!RESEND_API_KEY,
      unosend: !!UNOSEND_API_KEY,
    },
    defaultFrom: EMAIL_FROM,
  };
}
