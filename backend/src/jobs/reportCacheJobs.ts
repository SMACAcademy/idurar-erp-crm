import cron from 'node-cron';
import { cacheCompletedPeriods } from '../utils/pgReportCalculators';

/**
 * Scheduled job to cache completed periods
 * Runs every Monday at 2:00 AM to cache the previous week
 * Runs on the 1st of every month at 3:00 AM to cache the previous month
 */

// Weekly caching job - runs every Monday at 2:00 AM
const weeklyReportCacheJob = cron.schedule('0 2 * * 1', async () => {
  console.log('Starting weekly report caching job...');
  try {
    await cacheCompletedPeriods();
    console.log('Weekly report caching completed successfully');
  } catch (error) {
    console.error('Error in weekly report caching job:', error);
  }
}, {
  timezone: "Asia/Kolkata" // Adjust timezone as needed
});

// Monthly caching job - runs on the 1st of every month at 3:00 AM
const monthlyReportCacheJob = cron.schedule('0 3 1 * *', async () => {
  console.log('Starting monthly report caching job...');
  try {
    await cacheCompletedPeriods();
    console.log('Monthly report caching completed successfully');
  } catch (error) {
    console.error('Error in monthly report caching job:', error);
  }
}, {
  timezone: "Asia/Kolkata" // Adjust timezone as needed
});

/**
 * Start all scheduled jobs
 */
export const startScheduledJobs = () => {
  console.log('Starting scheduled report caching jobs...');
  console.log('Weekly report caching job scheduled (Every Monday at 2:00 AM)');
  console.log('Monthly report caching job scheduled (1st of every month at 3:00 AM)');
  console.log('Jobs are now active and will run automatically');
};

/**
 * Stop all scheduled jobs
 */
export const stopScheduledJobs = () => {
  console.log('Stopping scheduled report caching jobs...');
  
  weeklyReportCacheJob.stop();
  monthlyReportCacheJob.stop();
  
  console.log('All scheduled jobs stopped');
};

/**
 * Get status of all scheduled jobs
 */
export const getJobsStatus = () => {
  return {
    weeklyReportCacheJob: {
      running: weeklyReportCacheJob.getStatus() !== null,
      schedule: 'Every Monday at 2:00 AM (Asia/Kolkata)',
      nextExecution: 'Next Monday at 2:00 AM'
    },
    monthlyReportCacheJob: {
      running: monthlyReportCacheJob.getStatus() !== null,
      schedule: '1st of every month at 3:00 AM (Asia/Kolkata)',
      nextExecution: '1st of next month at 3:00 AM'
    }
  };
};

/**
 * Manual execution of caching job (for testing or manual runs)
 */
export const manualCacheExecution = async () => {
  console.log('Manual execution of report caching...');
  try {
    await cacheCompletedPeriods();
    console.log('Manual report caching completed successfully');
    return { success: true, message: 'Report caching completed successfully' };
  } catch (error) {
    console.error('Error in manual report caching:', error);
    return { success: false, message: `Error: ${error}` };
  }
};

export {
  weeklyReportCacheJob,
  monthlyReportCacheJob
};