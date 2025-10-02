import cron from 'node-cron';
import { cleanupInactiveMemberData } from '../utils/memberCleanup';

export const initializeMemberCleanupScheduler = () => {
  // Run at 2:00 AM on the last day of every month
  cron.schedule('0 2 28-31 * *', async () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    // Only run if tomorrow is a new month (today is month-end)
    if (tomorrow.getMonth() !== today.getMonth()) {
      try {
        console.log('Running monthly cleanup: Inactive member data cleanup');
        const result = await cleanupInactiveMemberData();
        
        if (result.deletedMembers > 0) {
          console.log(`Cleanup completed: ${result.deletedMembers} inactive members and ${result.deletedFiles} files removed`);
        } else {
          console.log('No inactive members found for cleanup');
        }
      } catch (error) {
        console.error('Error in scheduled member cleanup:', error);
      }
    }
  });

  console.log('Member cleanup scheduler initialized');
};