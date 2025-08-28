import cron from 'node-cron';
import Task from '../models/Task';
import { CronStatus } from '../types';

class CronService {
  private isInitialized: boolean = false;

  public initialize(): void {
    if (this.isInitialized) {
      return;
    }

    // Set up cron job to run every 20 minutes
    cron.schedule('*/20 * * * *', () => {
      Task.resetTasks();
    }, {
      timezone: "UTC"
    });

    console.info('Cron job scheduled: Tasks will reset every 20 minutes');
    this.isInitialized = true;
  }

  public getStatus(): CronStatus {
    const now = new Date();
    const nextRun = new Date(now.getTime() + (20 * 60 * 1000)); // 20 minutes from now

    return {
      status: 'active',
      schedule: 'every 20 minutes',
      nextRun: nextRun.toISOString(),
      lastReset: now.toISOString(),
      timezone: 'UTC'
    };
  }
}

export default new CronService();
