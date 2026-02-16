#!/usr/bin/env node

/**
 * Email Provider Smoke Test Script
 * 
 * Tests the configured email provider by sending a test email.
 * Usage: node scripts/testEmailProvider.js <recipient-email>
 * 
 * Exit codes:
 * 0 - Success
 * 1 - Configuration error
 * 2 - Send error
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from backend/.env
dotenv.config({ path: join(__dirname, '..', '.env') });

// Import mail provider after env is loaded
const { sendEmail, getMailProviderInfo } = await import('../src/services/mailProvider.js');

// Get recipient from command line
const recipientEmail = process.argv[2];

if (!recipientEmail) {
  console.error('❌ Error: Recipient email is required');
  console.error('Usage: node scripts/testEmailProvider.js <recipient-email>');
  console.error('Example: node scripts/testEmailProvider.js test@example.com');
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(recipientEmail)) {
  console.error(`❌ Error: Invalid email format: ${recipientEmail}`);
  process.exit(1);
}

async function runTest() {
  try {
    console.log('🧪 LegalTrack Email Provider Test\n');
    console.log('='.repeat(50));
    
    // Get provider info
    const providerInfo = getMailProviderInfo();
    console.log(`📧 Provider: ${providerInfo.provider}`);
    console.log(`📋 Configuration:`);
    console.log(`   - Resend: ${providerInfo.configured.resend ? '✓' : '✗'}`);
    console.log(`   - Unosend: ${providerInfo.configured.unosend ? '✓' : '✗'}`);
    console.log(`   - Default From: ${providerInfo.defaultFrom}`);
    console.log('='.repeat(50));
    console.log('');

    // Check if current provider is configured
    const currentProvider = providerInfo.provider.toLowerCase();
    const isConfigured = providerInfo.configured[currentProvider];
    
    if (!isConfigured) {
      console.error(`❌ Error: ${currentProvider} is not configured`);
      console.error(`\nPlease set the required environment variables:`);
      if (currentProvider === 'resend') {
        console.error('  RESEND_API_KEY=re_your-api-key-here');
      } else if (currentProvider === 'unosend') {
        console.error('  UNOSEND_API_KEY=un_your-api-key-here');
      }
      process.exit(1);
    }

    console.log(`📤 Sending test email to: ${recipientEmail}`);
    console.log(`⏳ Please wait...\n`);

    // Send test email
    const result = await sendEmail({
      to: recipientEmail,
      subject: 'LegalTrack Email Provider Test',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Test</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <tr>
                    <td style="padding: 40px; text-align: center; border-bottom: 1px solid #e5e5e5;">
                      <h1 style="margin: 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">✅ Email Test Successful!</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin: 0 0 20px 0; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
                        This is a test email from <strong>LegalTrack</strong>.
                      </p>
                      <p style="margin: 0 0 20px 0; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
                        If you're seeing this, your email provider is configured correctly!
                      </p>
                      <table role="presentation" style="width: 100%; margin: 30px 0; border: 1px solid #e5e5e5; border-radius: 6px;">
                        <tr>
                          <td style="padding: 20px; background-color: #f9f9f9;">
                            <table role="presentation" style="width: 100%;">
                              <tr>
                                <td style="padding: 8px 0; color: #6b6b6b; font-size: 14px;">Provider:</td>
                                <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600; text-align: right;">${providerInfo.provider}</td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #6b6b6b; font-size: 14px;">Sent At:</td>
                                <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600; text-align: right;">${new Date().toLocaleString()}</td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #6b6b6b; font-size: 14px;">Test Type:</td>
                                <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600; text-align: right;">Smoke Test</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      <p style="margin: 20px 0 0 0; color: #6b6b6b; font-size: 14px; line-height: 1.5;">
                        You can safely delete this email.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 30px 40px; background-color: #f9f9f9; border-top: 1px solid #e5e5e5; border-radius: 0 0 8px 8px;">
                      <p style="margin: 0; color: #8a8a8a; font-size: 12px; line-height: 1.5; text-align: center;">
                        LegalTrack Email Provider Test - ${new Date().getFullYear()}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    console.log('✅ Email sent successfully!\n');
    console.log('📊 Result:');
    console.log(`   - Provider: ${result.provider}`);
    console.log(`   - Message ID: ${result.id}`);
    console.log('');
    console.log('='.repeat(50));
    console.log(`✓ Test completed successfully`);
    console.log(`✓ Check ${recipientEmail} for the test email`);
    console.log('='.repeat(50));
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Email send failed!\n');
    console.error('Error details:');
    console.error(`   Message: ${error.message}`);
    console.error('');
    console.error('='.repeat(50));
    console.error('Troubleshooting:');
    console.error('1. Verify your API key is correct in .env');
    console.error('2. Check that MAIL_PROVIDER matches your configured provider');
    console.error('3. Ensure your API key has sending permissions');
    console.error('4. Check network connectivity');
    console.error('');
    console.error('For more help, see: backend/MAIL_PROVIDER_SETUP.md');
    console.error('='.repeat(50));
    
    process.exit(2);
  }
}

// Run the test
runTest();
