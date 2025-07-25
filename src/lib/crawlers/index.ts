import { CrawlerConfig } from '@/types';
import { CheerioCrawler } from './CheerioCrawler';
import { PuppeteerCrawler } from './PuppeteerCrawler';
import { BaseCrawler } from './BaseCrawler';

export const crawlerConfigs: CrawlerConfig[] = [
  {
    name: 'Microsoft Copilot',
    url: 'https://copilot.cloud.microsoft/en-us/prompts',
    selector: '[data-testid="prompt-description"], [data-testid="prompt-title"]',
    type: 'puppeteer',
    contentType: 'text',
  },
  {
    name: 'PromptHero Veo',
    url: 'https://prompthero.com/veo-prompts',
    selector: '.the-prompt-text',
    type: 'puppeteer',
    contentType: 'video',
  },
  {
    name: 'PromptHero ChatGPT Images',
    url: 'https://prompthero.com/chatgpt-image-prompts',
    selector: '.the-prompt-text',
    type: 'puppeteer',
    contentType: 'image',
  },
  {
    name: 'Anthropic Prompt Library',
    url: 'https://docs.anthropic.com/en/resources/prompt-library/library',
    selector: 'a[href*="/prompt-library/"], .prompt-title, .prompt-description',
    type: 'puppeteer',
    contentType: 'text',
  },
];

export class CrawlerManager {
  static async crawlAll(): Promise<{ allPrompts: any[], results: any[] }> {
    const allPrompts: any[] = [];
    const results: any[] = [];

    for (const config of crawlerConfigs) {
      try {
        const crawler: BaseCrawler = config.type === 'puppeteer' 
          ? new PuppeteerCrawler(config)
          : new CheerioCrawler(config);

        const prompts = await crawler.crawl();
        allPrompts.push(...prompts);
        
        results.push({
          source: config.name,
          success: true,
          count: prompts.length,
          error: null,
        });
      } catch (error) {
        console.error(`Failed to crawl ${config.name}:`, error);
        results.push({
          source: config.name,
          success: false,
          count: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return { allPrompts, results };
  }

  static async crawlSingle(sourceName: string): Promise<any[]> {
    const config = crawlerConfigs.find(c => c.name === sourceName);
    if (!config) {
      throw new Error(`Unknown crawler source: ${sourceName}`);
    }

    const crawler: BaseCrawler = config.type === 'puppeteer' 
      ? new PuppeteerCrawler(config)
      : new CheerioCrawler(config);

    return await crawler.crawl();
  }
}
