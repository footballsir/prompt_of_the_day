import { Prompt, CrawlerConfig } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export abstract class BaseCrawler {
  protected config: CrawlerConfig;

  constructor(config: CrawlerConfig) {
    this.config = config;
  }

  abstract crawl(): Promise<Prompt[]>;

  protected createPrompt(content: string, url?: string, model?: string, title?: string, mediaUrl?: string): Prompt {
    return {
      id: uuidv4(),
      content: content.trim(),
      title: title || '',
      source: this.config.name,
      url: url || this.config.url,
      type: this.config.contentType,
      model: model || this.getModelFromSource(this.config.name),
      mediaUrl: mediaUrl || '',
      createdAt: new Date().toISOString(),
    };
  }

  protected getModelFromSource(source: string): string {
    if (source.includes('Microsoft Copilot')) {
      return 'Copilot';
    } else if (source.includes('Anthropic')) {
      return 'Claude';
    } else if (source.includes('PromptHero Veo')) {
      return 'Veo';
    } else if (source.includes('PromptHero ChatGPT')) {
      return 'ChatGPT';
    } else {
      return 'Unknown';
    }
  }

  protected cleanContent(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[\r\n]+/g, ' ')
      .trim();
  }
}
