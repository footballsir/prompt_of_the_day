import axios from 'axios';
import * as cheerio from 'cheerio';
import { BaseCrawler } from './BaseCrawler';
import { Prompt } from '@/types';

export class CheerioCrawler extends BaseCrawler {
  async crawl(): Promise<Prompt[]> {
    try {
      console.log(`Crawling ${this.config.name} with Cheerio...`);
      
      const response = await axios.get(this.config.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
        timeout: 30000,
      });

      const $ = cheerio.load(response.data);
      const prompts: Prompt[] = [];

      $(this.config.selector).each((index, element) => {
        const content = $(element).text();
        const link = $(element).find('a').attr('href') || $(element).closest('a').attr('href');
        const url = link ? new URL(link, this.config.url).href : this.config.url;
        
        // Extract title - for Anthropic, use the link text as title
        let title = '';
        if (this.config.name.includes('Anthropic')) {
          // For Anthropic, the element itself or its link should contain the title
          const linkElement = $(element).is('a') ? $(element) : $(element).find('a');
          if (linkElement.length) {
            const fullTitle = linkElement.text().trim();
            // Extract only the first part before newline for clean title
            title = fullTitle.split('\n')[0].trim();
          }
        }
        
        // Enhanced content validation for better prompt detection
        if (content && content.length > 20 && content.length < 300) {
          // Look for prompt-like characteristics
          const isPromptLike = 
            content.includes('help') || content.includes('create') || content.includes('write') || 
            content.includes('generate') || content.includes('how') || content.includes('what') ||
            content.includes('make') || content.includes('build') || content.includes('design') ||
            content.includes('explain') || content.includes('describe') || content.includes('analyze') ||
            content.startsWith('How') || content.startsWith('What') || content.startsWith('Create') ||
            content.startsWith('Write') || content.startsWith('Generate') || content.startsWith('Make');
          
          // Exclude navigation, footer, and other non-content elements
          const isNavigationOrMeta = 
            content.includes('Privacy') || content.includes('Terms') || content.includes('Cookie') ||
            content.includes('©') || content.includes('Microsoft Corporation') ||
            content.length < 25 || content.split(' ').length < 4;
          
          if (isPromptLike && !isNavigationOrMeta) {
            prompts.push(this.createPrompt(this.cleanContent(content), url, undefined, title, ''));
          }
        }
      });

      console.log(`Found ${prompts.length} prompts from ${this.config.name}`);
      return prompts;
    } catch (error) {
      console.error(`Error crawling ${this.config.name}:`, error);
      return [];
    }
  }
}
