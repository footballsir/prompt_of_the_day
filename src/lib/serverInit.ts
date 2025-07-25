import { SchedulerService } from '@/lib/scheduler';

// Initialize scheduler when the server starts
const scheduler = SchedulerService.getInstance();

if (process.env.NODE_ENV === 'production' || process.env.ENABLE_SCHEDULER === 'true') {
  console.log('Starting scheduler...');
  scheduler.start();
} else {
  console.log('Scheduler disabled in development mode. Set ENABLE_SCHEDULER=true to enable.');
}

export { scheduler };
