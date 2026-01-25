import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM || 'onboarding@resend.dev';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

export const sendPasswordResetEmail = async (email, resetToken, userName) => {
  try {
    const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Reset Your LegalTrack Password',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 40px 0;">
                  <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="padding: 40px 40px 20px 40px; text-align: center; border-bottom: 1px solid #e5e5e5;">
                        <h1 style="margin: 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">Reset Your Password</h1>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <p style="margin: 0 0 20px 0; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
                          Hi ${userName || 'there'},
                        </p>
                        <p style="margin: 0 0 20px 0; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
                          We received a request to reset your password for your LegalTrack account. Click the button below to create a new password:
                        </p>
                        
                        <!-- Button -->
                        <table role="presentation" style="margin: 30px 0;">
                          <tr>
                            <td style="border-radius: 6px; background-color: #2563eb;">
                              <a href="${resetLink}" target="_blank" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px;">
                                Reset Password
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="margin: 20px 0; color: #4a4a4a; font-size: 14px; line-height: 1.5;">
                          Or copy and paste this link into your browser:
                        </p>
                        <p style="margin: 0 0 20px 0; color: #2563eb; font-size: 14px; word-break: break-all;">
                          ${resetLink}
                        </p>
                        
                        <p style="margin: 20px 0 0 0; color: #6b6b6b; font-size: 14px; line-height: 1.5;">
                          This link will expire in 1 hour for security reasons.
                        </p>
                        
                        <p style="margin: 20px 0 0 0; color: #6b6b6b; font-size: 14px; line-height: 1.5;">
                          If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 30px 40px; background-color: #f9f9f9; border-top: 1px solid #e5e5e5; border-radius: 0 0 8px 8px;">
                        <p style="margin: 0; color: #8a8a8a; font-size: 12px; line-height: 1.5; text-align: center;">
                          This is an automated message from LegalTrack. Please do not reply to this email.
                        </p>
                        <p style="margin: 10px 0 0 0; color: #8a8a8a; font-size: 12px; line-height: 1.5; text-align: center;">
                          © ${new Date().getFullYear()} LegalTrack. All rights reserved.
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

    if (error) {
      console.error('Resend error:', error);
      throw new Error('Failed to send email');
    }

    console.log('Password reset email sent:', data);
    return data;
  } catch (error) {
    console.error('Email service error:', error);
    throw error;
  }
};

export const sendWelcomeEmail = async (email, userName) => {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Welcome to LegalTrack',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to LegalTrack</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 40px 0;">
                  <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="padding: 40px 40px 20px 40px; text-align: center; border-bottom: 1px solid #e5e5e5;">
                        <h1 style="margin: 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">Welcome to LegalTrack!</h1>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <p style="margin: 0 0 20px 0; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
                          Hi ${userName},
                        </p>
                        <p style="margin: 0 0 20px 0; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
                          Your LegalTrack account has been successfully created! You can now access all features of our legal case management system.
                        </p>
                        
                        <h2 style="margin: 30px 0 15px 0; color: #1a1a1a; font-size: 18px; font-weight: 600;">Getting Started</h2>
                        <ul style="margin: 0 0 20px 0; padding-left: 20px; color: #4a4a4a; font-size: 14px; line-height: 1.8;">
                          <li>Manage cases and track deadlines</li>
                          <li>Track billable hours and generate invoices</li>
                          <li>Organize contacts and leads with CRM</li>
                          <li>Store and manage documents securely</li>
                          <li>Collaborate with your team</li>
                        </ul>
                        
                        <!-- Button -->
                        <table role="presentation" style="margin: 30px 0;">
                          <tr>
                            <td style="border-radius: 6px; background-color: #2563eb;">
                              <a href="${FRONTEND_URL}" target="_blank" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px;">
                                Go to Dashboard
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="margin: 20px 0 0 0; color: #6b6b6b; font-size: 14px; line-height: 1.5;">
                          If you have any questions, feel free to reach out to our support team.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 30px 40px; background-color: #f9f9f9; border-top: 1px solid #e5e5e5; border-radius: 0 0 8px 8px;">
                        <p style="margin: 0; color: #8a8a8a; font-size: 12px; line-height: 1.5; text-align: center;">
                          © ${new Date().getFullYear()} LegalTrack. All rights reserved.
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

    if (error) {
      console.error('Resend error:', error);
      throw new Error('Failed to send email');
    }

    console.log('Welcome email sent:', data);
    return data;
  } catch (error) {
    console.error('Email service error:', error);
    throw error;
  }
};
