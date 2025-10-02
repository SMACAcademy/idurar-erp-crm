import cron from 'node-cron';
import { updateLeavingRequestPendingDues } from '../utils/leavingRequestDuesCalculator';

export const initializeLeavingRequestDuesScheduler = () => {
  // Run every day at 3:00 AM to update pending dues for leaving requests
  cron.schedule('0 3 * * *', async () => {
    try {
      console.log('Running scheduled task: Update leaving request pending dues');
      const result = await updateLeavingRequestPendingDues();
      
      if (result.updatedRequests > 0) {
        console.log(`Updated ${result.updatedRequests} leaving requests with new pending dues`);
      } else {
        console.log('No leaving request dues updates required');
      }
    } catch (error) {
      console.error('Error in scheduled leaving request dues update:', error);
    }
  });

  console.log('Leaving request dues scheduler initialized');
};