import cron from 'node-cron';
import { runScheduledNotifications } from './notificationService.js';

let scheduledJobs = [];

// Run daily at 9:00 AM - invoice reminders and deadline alerts
const dailyNotifications = cron.schedule('0 9 * * *', async () => {
  console.log('Running daily notifications at 9:00 AM...');
  try {
    const results = await runScheduledNotifications();
    console.log('Daily notifications completed:', results);
  } catch (error) {
    console.error('Error running daily notifications:', error);
  }
}, {
  scheduled: false,
  timezone: "America/New_York"
});

// Run every Monday at 8:00 AM - weekly summary (future feature)
const weeklyReminders = cron.schedule('0 8 * * 1', async () => {
  console.log('Running weekly reminders at 8:00 AM Monday...');
  // Future: Send weekly summary emails
}, {
  scheduled: false,
  timezone: "America/New_York"
});

// Start all cron jobs
export const startCronJobs = () => {
  console.log('Starting cron jobs...');
  
  dailyNotifications.start();
  console.log('✓ Daily notifications scheduled (9:00 AM daily)');
  
  weeklyReminders.start();
  console.log('✓ Weekly reminders scheduled (8:00 AM Mondays)');
  
  scheduledJobs = [dailyNotifications, weeklyReminders];
  
  console.log('All cron jobs started successfully');
};

// Stop all cron jobs (for graceful shutdown)
export const stopCronJobs = () => {
  console.log('Stopping cron jobs...');
  scheduledJobs.forEach(job => job.stop());
  console.log('All cron jobs stopped');
};

// Manually trigger daily notifications (for testing)
export const triggerDailyNotifications = async () => {
  console.log('Manually triggering daily notifications...');
  try {
    const results = await runScheduledNotifications();
    console.log('Manual trigger completed:', results);
    return results;
  } catch (error) {
    console.error('Error in manual trigger:', error);
    throw error;
  }
};

// Get status of all cron jobs
export const getCronJobStatus = () => {
  return {
    dailyNotifications: {
      running: dailyNotifications.getStatus() === 'scheduled',
      schedule: '9:00 AM daily',
      timezone: 'America/New_York'
    },
    weeklyReminders: {
      running: weeklyReminders.getStatus() === 'scheduled',
      schedule: '8:00 AM Mondays',
      timezone: 'America/New_York'
    }
  };
};
