import { Resend } from 'resend';
import { logNotification, logFailedNotification } from './notificationLogger.js';

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
      await logFailedNotification('password_reset', email, userName, 'Reset Your LegalTrack Password', error);
      throw new Error('Failed to send email');
    }

    console.log('Password reset email sent:', data);
    await logNotification('password_reset', email, userName, 'Reset Your LegalTrack Password', { resetToken });
    return data;
  } catch (error) {
    console.error('Email service error:', error);
    await logFailedNotification('password_reset', email, userName, 'Reset Your LegalTrack Password', error);
    throw error;
  }
};

export const sendInvoiceReminderEmail = async (email, clientName, invoiceNumber, amount, dueDate, isOverdue = true) => {
  try {
    const formattedAmount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    const formattedDueDate = new Date(dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const daysOverdue = isOverdue ? Math.floor((new Date() - new Date(dueDate)) / (1000 * 60 * 60 * 24)) : null;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: isOverdue ? `Overdue Invoice Reminder - ${invoiceNumber}` : `Invoice Due Soon - ${invoiceNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invoice Reminder</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 40px 0;">
                  <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <tr>
                      <td style="padding: 40px 40px 20px 40px; text-align: center; border-bottom: 1px solid #e5e5e5;">
                        <h1 style="margin: 0; color: ${isOverdue ? '#dc2626' : '#1a1a1a'}; font-size: 24px; font-weight: 600;">
                          ${isOverdue ? 'Invoice Overdue' : 'Invoice Due Soon'}
                        </h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px;">
                        <p style="margin: 0 0 20px 0; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
                          Dear ${clientName},
                        </p>
                        <p style="margin: 0 0 20px 0; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
                          ${isOverdue 
                            ? `This is a reminder that invoice <strong>${invoiceNumber}</strong> is now ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue.`
                            : `This is a friendly reminder that invoice <strong>${invoiceNumber}</strong> is due soon.`
                          }
                        </p>
                        <table role="presentation" style="width: 100%; margin: 30px 0; border: 1px solid #e5e5e5; border-radius: 6px;">
                          <tr>
                            <td style="padding: 20px; background-color: #f9f9f9;">
                              <table role="presentation" style="width: 100%;">
                                <tr>
                                  <td style="padding: 8px 0; color: #6b6b6b; font-size: 14px;">Invoice Number:</td>
                                  <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600; text-align: right;">${invoiceNumber}</td>
                                </tr>
                                <tr>
                                  <td style="padding: 8px 0; color: #6b6b6b; font-size: 14px;">Amount Due:</td>
                                  <td style="padding: 8px 0; color: #1a1a1a; font-size: 18px; font-weight: 700; text-align: right;">${formattedAmount}</td>
                                </tr>
                                <tr>
                                  <td style="padding: 8px 0; color: #6b6b6b; font-size: 14px;">Due Date:</td>
                                  <td style="padding: 8px 0; color: ${isOverdue ? '#dc2626' : '#1a1a1a'}; font-size: 14px; font-weight: 600; text-align: right;">${formattedDueDate}</td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                        <p style="margin: 20px 0; color: #4a4a4a; font-size: 14px; line-height: 1.5;">
                          Please arrange payment at your earliest convenience. If you have already paid this invoice, please disregard this message.
                        </p>
                        <table role="presentation" style="margin: 30px 0;">
                          <tr>
                            <td style="border-radius: 6px; background-color: #2563eb;">
                              <a href="${FRONTEND_URL}/invoices" target="_blank" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px;">
                                View Invoice
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
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
      await logFailedNotification(isOverdue ? 'invoice_overdue' : 'invoice_upcoming', email, clientName, `Invoice ${isOverdue ? 'Overdue' : 'Due Soon'} - ${invoiceNumber}`, error);
      throw new Error('Failed to send email');
    }

    await logNotification(isOverdue ? 'invoice_overdue' : 'invoice_upcoming', email, clientName, `Invoice ${isOverdue ? 'Overdue' : 'Due Soon'} - ${invoiceNumber}`, { invoiceNumber, amount, dueDate });
    return data;
  } catch (error) {
    console.error('Email service error:', error);
    await logFailedNotification(isOverdue ? 'invoice_overdue' : 'invoice_upcoming', email, clientName, `Invoice ${isOverdue ? 'Overdue' : 'Due Soon'} - ${invoiceNumber}`, error);
    throw error;
  }
};

export const sendDeadlineAlertEmail = async (email, userName, taskTitle, dueDate, caseNumber, priority) => {
  try {
    const formattedDueDate = new Date(dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const daysUntil = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    const priorityColor = priority === 'High' ? '#dc2626' : priority === 'Medium' ? '#f59e0b' : '#10b981';

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Deadline Alert: ${taskTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Deadline Alert</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 40px 0;">
                  <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <tr>
                      <td style="padding: 40px 40px 20px 40px; text-align: center; border-bottom: 1px solid #e5e5e5;">
                        <h1 style="margin: 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">Upcoming Deadline</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px;">
                        <p style="margin: 0 0 20px 0; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
                          Hi ${userName},
                        </p>
                        <p style="margin: 0 0 20px 0; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
                          This is a reminder that you have an upcoming deadline in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}.
                        </p>
                        <table role="presentation" style="width: 100%; margin: 30px 0; border: 1px solid #e5e5e5; border-radius: 6px;">
                          <tr>
                            <td style="padding: 20px; background-color: #f9f9f9;">
                              <h2 style="margin: 0 0 15px 0; color: #1a1a1a; font-size: 18px; font-weight: 600;">${taskTitle}</h2>
                              <table role="presentation" style="width: 100%;">
                                <tr>
                                  <td style="padding: 8px 0; color: #6b6b6b; font-size: 14px;">Case Number:</td>
                                  <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600; text-align: right;">${caseNumber}</td>
                                </tr>
                                <tr>
                                  <td style="padding: 8px 0; color: #6b6b6b; font-size: 14px;">Due Date:</td>
                                  <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600; text-align: right;">${formattedDueDate}</td>
                                </tr>
                                <tr>
                                  <td style="padding: 8px 0; color: #6b6b6b; font-size: 14px;">Priority:</td>
                                  <td style="padding: 8px 0; text-align: right;">
                                    <span style="display: inline-block; padding: 4px 12px; background-color: ${priorityColor}; color: #ffffff; font-size: 12px; font-weight: 600; border-radius: 12px;">${priority}</span>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                        <table role="presentation" style="margin: 30px 0;">
                          <tr>
                            <td style="border-radius: 6px; background-color: #2563eb;">
                              <a href="${FRONTEND_URL}/cases" target="_blank" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px;">
                                View Details
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
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
      await logFailedNotification('deadline_alert', email, userName, `Deadline Alert: ${taskTitle}`, error);
      throw new Error('Failed to send email');
    }

    await logNotification('deadline_alert', email, userName, `Deadline Alert: ${taskTitle}`, { taskTitle, dueDate, caseNumber, priority });
    return data;
  } catch (error) {
    console.error('Email service error:', error);
    await logFailedNotification('deadline_alert', email, userName, `Deadline Alert: ${taskTitle}`, error);
    throw error;
  }
};

export const sendTaskAssignmentEmail = async (email, userName, taskTitle, taskDescription, dueDate, priority, caseNumber, assignedBy) => {
  try {
    const formattedDueDate = dueDate ? new Date(dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'No due date';
    const priorityColor = priority === 'High' ? '#dc2626' : priority === 'Medium' ? '#f59e0b' : '#10b981';

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `New Task Assigned: ${taskTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Task Assignment</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 40px 0;">
                  <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <tr>
                      <td style="padding: 40px 40px 20px 40px; text-align: center; border-bottom: 1px solid #e5e5e5;">
                        <h1 style="margin: 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">New Task Assigned</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px;">
                        <p style="margin: 0 0 20px 0; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
                          Hi ${userName},
                        </p>
                        <p style="margin: 0 0 20px 0; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
                          ${assignedBy || 'A team member'} has assigned you a new task.
                        </p>
                        <table role="presentation" style="width: 100%; margin: 30px 0; border: 1px solid #e5e5e5; border-radius: 6px;">
                          <tr>
                            <td style="padding: 20px; background-color: #f9f9f9;">
                              <h2 style="margin: 0 0 15px 0; color: #1a1a1a; font-size: 18px; font-weight: 600;">${taskTitle}</h2>
                              ${taskDescription ? `<p style="margin: 0 0 15px 0; color: #4a4a4a; font-size: 14px; line-height: 1.5;">${taskDescription}</p>` : ''}
                              <table role="presentation" style="width: 100%;">
                                ${caseNumber ? `
                                <tr>
                                  <td style="padding: 8px 0; color: #6b6b6b; font-size: 14px;">Case Number:</td>
                                  <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600; text-align: right;">${caseNumber}</td>
                                </tr>
                                ` : ''}
                                <tr>
                                  <td style="padding: 8px 0; color: #6b6b6b; font-size: 14px;">Due Date:</td>
                                  <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600; text-align: right;">${formattedDueDate}</td>
                                </tr>
                                <tr>
                                  <td style="padding: 8px 0; color: #6b6b6b; font-size: 14px;">Priority:</td>
                                  <td style="padding: 8px 0; text-align: right;">
                                    <span style="display: inline-block; padding: 4px 12px; background-color: ${priorityColor}; color: #ffffff; font-size: 12px; font-weight: 600; border-radius: 12px;">${priority}</span>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                        <table role="presentation" style="margin: 30px 0;">
                          <tr>
                            <td style="border-radius: 6px; background-color: #2563eb;">
                              <a href="${FRONTEND_URL}" target="_blank" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px;">
                                View Task
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
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
      await logFailedNotification('task_assignment', email, userName, `New Task Assigned: ${taskTitle}`, error);
      throw new Error('Failed to send email');
    }

    await logNotification('task_assignment', email, userName, `New Task Assigned: ${taskTitle}`, { taskTitle, dueDate, priority, caseNumber, assignedBy });
    return data;
  } catch (error) {
    console.error('Email service error:', error);
    await logFailedNotification('task_assignment', email, userName, `New Task Assigned: ${taskTitle}`, error);
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
      await logFailedNotification('welcome', email, userName, 'Welcome to LegalTrack', error);
      throw new Error('Failed to send email');
    }

    console.log('Welcome email sent:', data);
    await logNotification('welcome', email, userName, 'Welcome to LegalTrack');
    return data;
  } catch (error) {
    console.error('Email service error:', error);
    await logFailedNotification('welcome', email, userName, 'Welcome to LegalTrack', error);
    throw error;
  }
};
