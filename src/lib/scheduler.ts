import cron from 'node-cron';
import { CrawlerManager } from './crawlers';
import { DataManager } from './dataManager';
import { PromptSelector } from './promptSelector';

export class SchedulerService {
  private static instance: SchedulerService;
  private isRunning = false;
  private tasks: any[] = [];

  static getInstance(): SchedulerService {
    if (!SchedulerService.instance) {
      SchedulerService.instance = new SchedulerService();
    }
    return SchedulerService.instance;
  }

  start(): void {
    if (this.isRunning) {
      console.log('Scheduler is already running');
      return;
    }

    console.log('Starting scheduler with China timezone...');

    // Weekly crawling - Sunday at 2 AM China time
    const weeklyCrawlTask = cron.schedule('0 2 * * 0', async () => {
      console.log('Starting weekly crawl...');
      try {
        await this.performWeeklyCrawl();
      } catch (error) {
        console.error('Weekly crawl failed:', error);
      }
    }, {
      timezone: 'Asia/Shanghai'
    });

    // Daily prompt selection - Every day at 6 AM China time
    const dailySelectionTask = cron.schedule('0 6 * * *', async () => {
      console.log('Starting daily prompt selection...');
      try {
        await this.performDailySelection();
      } catch (error) {
        console.error('Daily selection failed:', error);
      }
    }, {
      timezone: 'Asia/Shanghai'
    });

    this.tasks = [weeklyCrawlTask, dailySelectionTask];

    this.isRunning = true;
    console.log('Scheduler started successfully');
  }

  stop(): void {
    this.tasks.forEach(task => task.stop());
    this.tasks = [];
    this.isRunning = false;
    console.log('Scheduler stopped');
  }

  async performWeeklyCrawl(): Promise<void> {
    console.log('Performing weekly crawl...');
    const startTime = Date.now();
    
    try {
      const { allPrompts, results } = await CrawlerManager.crawlAll();
      
      if (allPrompts.length > 0) {
        const today = DataManager.getTodayDate();
        await DataManager.savePrompts(allPrompts, today);
        console.log(`Saved ${allPrompts.length} prompts to ${today}`);
      } else {
        console.log('No new prompts found during crawl');
      }

      // Log results
      results.forEach(result => {
        if (result.success) {
          console.log(`✅ ${result.source}: ${result.count} prompts`);
        } else {
          console.log(`❌ ${result.source}: ${result.error}`);
        }
      });

      const duration = (Date.now() - startTime) / 1000;
      console.log(`Weekly crawl completed in ${duration}s`);
    } catch (error) {
      console.error('Weekly crawl error:', error);
    }
  }

  async performDailySelection(): Promise<void> {
    console.log('Performing daily prompt selection...');
    
    try {
      const selectedPrompt = await PromptSelector.selectDailyPrompt();
      
      if (selectedPrompt) {
        console.log(`Selected prompt: ${selectedPrompt.content.substring(0, 100)}...`);
      } else {
        console.log('No prompt was selected (may already exist for today)');
      }
    } catch (error) {
      console.error('Daily selection error:', error);
    }
  }

  // Manual trigger methods for testing/admin use
  async triggerWeeklyCrawl(): Promise<any> {
    console.log('Manually triggering weekly crawl...');
    const { allPrompts, results } = await CrawlerManager.crawlAll();
    
    if (allPrompts.length > 0) {
      const today = DataManager.getTodayDate();
      await DataManager.savePrompts(allPrompts, today);
    }

    return {
      success: true,
      promptsFound: allPrompts.length,
      results,
      timestamp: new Date().toISOString(),
    };
  }

  async triggerDailySelection(): Promise<any> {
    console.log('Manually triggering daily selection...');
    const selectedPrompt = await PromptSelector.selectDailyPrompt();
    
    return {
      success: !!selectedPrompt,
      prompt: selectedPrompt,
      timestamp: new Date().toISOString(),
    };
  }

  getStatus(): any {
    return {
      isRunning: this.isRunning,
      timezone: 'Asia/Shanghai',
      schedules: [
        { name: 'Weekly Crawl', cron: '0 2 * * 0', description: 'Sunday 2 AM' },
        { name: 'Daily Selection', cron: '0 6 * * *', description: 'Every day 6 AM' },
      ],
    };
  }
}
