import cron from "node-cron"
import { updateOverduePayments } from '../utils/paymentRecordManager';

export const initializePaymentScheduler = () => {
  // Run every day at 1:00 AM to update overdue payments
  cron.schedule('0 1 * * *', async () => {
    try {
      console.log('Running scheduled task: Update overdue payments');
      const result = await updateOverduePayments();
      console.log(`Updated ${result.updatedCount} overdue payments`);
    } catch (error) {
      console.error('Error in scheduled overdue update:', error);
    }
  });

  console.log('Payment scheduler initialized');
};
