import { PrismaClient } from '@prisma/client';
import { sendInvoiceReminderEmail, sendDeadlineAlertEmail, sendTaskAssignmentEmail } from './emailService.js';

const prisma = new PrismaClient();

// Send invoice reminders for overdue invoices
export const sendOverdueInvoiceReminders = async () => {
  try {
    const today = new Date();
    
    // Find invoices that are overdue and unpaid
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        status: 'Sent',
        dueDate: {
          lt: today
        }
      },
      include: {
        client: true
      }
    });

    console.log(`Found ${overdueInvoices.length} overdue invoices`);

    for (const invoice of overdueInvoices) {
      if (invoice.client?.email) {
        try {
          await sendInvoiceReminderEmail(
            invoice.client.email,
            invoice.client.name,
            invoice.invoiceNumber,
            invoice.total,
            invoice.dueDate
          );
          console.log(`Sent overdue reminder for invoice ${invoice.invoiceNumber} to ${invoice.client.email}`);
        } catch (error) {
          console.error(`Failed to send reminder for invoice ${invoice.invoiceNumber}:`, error);
        }
      }
    }

    return { sent: overdueInvoices.length };
  } catch (error) {
    console.error('Error sending overdue invoice reminders:', error);
    throw error;
  }
};

// Send invoice reminders for invoices due soon (within 3 days)
export const sendUpcomingInvoiceReminders = async () => {
  try {
    const today = new Date();
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const upcomingInvoices = await prisma.invoice.findMany({
      where: {
        status: 'Sent',
        dueDate: {
          gte: today,
          lte: threeDaysFromNow
        }
      },
      include: {
        client: true
      }
    });

    console.log(`Found ${upcomingInvoices.length} invoices due soon`);

    for (const invoice of upcomingInvoices) {
      if (invoice.client?.email) {
        try {
          await sendInvoiceReminderEmail(
            invoice.client.email,
            invoice.client.name,
            invoice.invoiceNumber,
            invoice.total,
            invoice.dueDate,
            false // not overdue
          );
          console.log(`Sent upcoming reminder for invoice ${invoice.invoiceNumber} to ${invoice.client.email}`);
        } catch (error) {
          console.error(`Failed to send reminder for invoice ${invoice.invoiceNumber}:`, error);
        }
      }
    }

    return { sent: upcomingInvoices.length };
  } catch (error) {
    console.error('Error sending upcoming invoice reminders:', error);
    throw error;
  }
};

// Send deadline alerts for upcoming deadlines (within 7 days)
export const sendDeadlineAlerts = async () => {
  try {
    const today = new Date();
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    // Get tasks with upcoming deadlines
    const upcomingTasks = await prisma.task.findMany({
      where: {
        status: {
          not: 'Completed'
        },
        dueDate: {
          gte: today,
          lte: sevenDaysFromNow
        }
      },
      include: {
        assignedTo: true,
        case: true
      }
    });

    console.log(`Found ${upcomingTasks.length} tasks with upcoming deadlines`);

    for (const task of upcomingTasks) {
      if (task.assignedTo?.email) {
        try {
          await sendDeadlineAlertEmail(
            task.assignedTo.email,
            task.assignedTo.name,
            task.title,
            task.dueDate,
            task.case?.caseNumber || 'N/A',
            task.priority
          );
          console.log(`Sent deadline alert for task "${task.title}" to ${task.assignedTo.email}`);
        } catch (error) {
          console.error(`Failed to send deadline alert for task ${task.id}:`, error);
        }
      }
    }

    // Get cases with upcoming deadlines
    const upcomingCases = await prisma.case.findMany({
      where: {
        status: {
          notIn: ['Closed', 'Archived']
        },
        nextHearingDate: {
          gte: today,
          lte: sevenDaysFromNow
        }
      },
      include: {
        client: true
      }
    });

    console.log(`Found ${upcomingCases.length} cases with upcoming hearings`);

    for (const caseItem of upcomingCases) {
      if (caseItem.client?.email) {
        try {
          await sendDeadlineAlertEmail(
            caseItem.client.email,
            caseItem.client.name,
            `Hearing for ${caseItem.title}`,
            caseItem.nextHearingDate,
            caseItem.caseNumber,
            'High'
          );
          console.log(`Sent hearing alert for case ${caseItem.caseNumber} to ${caseItem.client.email}`);
        } catch (error) {
          console.error(`Failed to send hearing alert for case ${caseItem.id}:`, error);
        }
      }
    }

    return { taskAlerts: upcomingTasks.length, hearingAlerts: upcomingCases.length };
  } catch (error) {
    console.error('Error sending deadline alerts:', error);
    throw error;
  }
};

// Notify user when a task is assigned to them
export const notifyTaskAssignment = async (taskId) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignedTo: true,
        createdBy: true,
        case: true
      }
    });

    if (!task || !task.assignedTo?.email) {
      return;
    }

    await sendTaskAssignmentEmail(
      task.assignedTo.email,
      task.assignedTo.name,
      task.title,
      task.description,
      task.dueDate,
      task.priority,
      task.case?.caseNumber,
      task.createdBy?.name
    );

    console.log(`Sent task assignment notification for "${task.title}" to ${task.assignedTo.email}`);
  } catch (error) {
    console.error('Error sending task assignment notification:', error);
    throw error;
  }
};

// Run all scheduled notifications
export const runScheduledNotifications = async () => {
  console.log('Running scheduled notifications...');
  
  try {
    const results = await Promise.allSettled([
      sendOverdueInvoiceReminders(),
      sendUpcomingInvoiceReminders(),
      sendDeadlineAlerts()
    ]);

    const summary = {
      overdueInvoices: results[0].status === 'fulfilled' ? results[0].value : { error: results[0].reason },
      upcomingInvoices: results[1].status === 'fulfilled' ? results[1].value : { error: results[1].reason },
      deadlines: results[2].status === 'fulfilled' ? results[2].value : { error: results[2].reason }
    };

    console.log('Scheduled notifications complete:', summary);
    return summary;
  } catch (error) {
    console.error('Error running scheduled notifications:', error);
    throw error;
  }
};
