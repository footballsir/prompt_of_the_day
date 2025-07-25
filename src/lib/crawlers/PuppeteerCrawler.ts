import puppeteer from 'puppeteer';
import { BaseCrawler } from './BaseCrawler';
import { Prompt } from '@/types';

export class PuppeteerCrawler extends BaseCrawler {
  async crawl(): Promise<Prompt[]> {
    let browser;
    try {
      console.log(`Crawling ${this.config.name} with Puppeteer...`);
      
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Set cookies if available for this domain
      await this.setCookies(page);
      
      // Navigate with improved error handling
      try {
        await page.goto(this.config.url, { 
          waitUntil: 'domcontentloaded',
          timeout: 60000 
        });
      } catch (navError) {
        console.log(`Navigation slow for ${this.config.name}, trying with basic loading...`);
        await page.goto(this.config.url, { 
          waitUntil: 'load',
          timeout: 30000
        });
      }

      // Wait a bit for any authentication checks
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Check if we're redirected to login page or blocked
      const currentUrl = page.url();
      if (currentUrl.includes('login') || currentUrl.includes('signin') || currentUrl.includes('auth')) {
        console.warn(`Possibly redirected to authentication page for ${this.config.name}. Check cookies.`);
      }

      // Load more content if "Show more" buttons exist (for Microsoft Copilot)
      if (this.config.name.includes('Microsoft')) {
        // Wait a bit more for Microsoft's content to load
        await new Promise(resolve => setTimeout(resolve, 5000));
        await this.clickShowMoreButtons(page);
      }
      // For PromptHero, scroll to load more content with infinite scroll detection
      else if (this.config.name.includes('PromptHero')) {
        console.log('Loading more PromptHero content with infinite scroll...');
        
        let previousCount = await page.$$eval('.prompt-card', (elements: any[]) => elements.length);
        console.log(`Initial PromptHero cards: ${previousCount}`);
        
        let scrollAttempts = 0;
        let stableCount = 0; // Count how many times the card count stayed the same
        const maxStableAttempts = 3; // Stop after 3 attempts with no new cards
        const maxScrollAttempts = 100; // Very high limit since we know there can be many pages
        
        while (scrollAttempts < maxScrollAttempts && stableCount < maxStableAttempts) {
          scrollAttempts++;
          
          // Scroll to bottom aggressively
          await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
          });
          
          // Wait for potential new content to load (infinite scroll usually triggers on scroll)
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Check if more cards loaded
          const currentCount = await page.$$eval('.prompt-card', (elements: any[]) => elements.length);
          const newCards = currentCount - previousCount;
          
          console.log(`Scroll ${scrollAttempts}: ${currentCount} cards (${newCards} new)`);
          
          if (newCards === 0) {
            stableCount++;
            console.log(`No new cards loaded (${stableCount}/${maxStableAttempts} stable attempts)`);
            
            // Try a different scroll approach - scroll up a bit then back down
            if (stableCount < maxStableAttempts) {
              await page.evaluate(() => {
                window.scrollBy(0, -200);
              });
              await new Promise(resolve => setTimeout(resolve, 500));
              await page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight);
              });
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              // Check again after the alternative scroll
              const recheckCount = await page.$$eval('.prompt-card', (elements: any[]) => elements.length);
              if (recheckCount > currentCount) {
                console.log(`Alternative scroll loaded ${recheckCount - currentCount} more cards`);
                previousCount = recheckCount;
                stableCount = 0; // Reset stable count since we got new content
                continue;
              }
            }
          } else {
            stableCount = 0; // Reset stable count since we got new content
          }
          
          previousCount = currentCount;
        }
        
        console.log(`Final PromptHero card count: ${previousCount} after ${scrollAttempts} scroll attempts`);
      }

      // Scroll to load more content (for infinite scroll pages)
      await this.autoScroll(page);

    // Extract prompts based on the site type
    const prompts = await page.evaluate((configData) => {
      const results: any[] = [];
      
      // Handle Microsoft Copilot with specific card structure
      if (configData.name === 'Microsoft Copilot') {
        const cards = document.querySelectorAll('[data-testid="prompt-card"]');
        
        cards.forEach((card: any, index: number) => {
          try {
            // Extract title from the card
            const titleElement = card.querySelector('[data-testid="prompt-title"]');
            const title = titleElement?.textContent?.trim() || '';
            
            // Extract description from the card
            const descriptionElement = card.querySelector('[data-testid="prompt-description"]');
            const description = descriptionElement?.textContent?.trim() || '';
            
            // Try to find individual prompt URL within the card
            let promptUrl = configData.url; // Fallback to library URL
            const linkElement = card.querySelector('a[href*="/prompts/"]');
            if (linkElement) {
              const href = linkElement.getAttribute('href');
              if (href) {
                promptUrl = href.startsWith('http') ? href : `https://copilot.cloud.microsoft${href}`;
              }
            }
            
            // Store title and description separately (not combined)
            if (title || description) {
              results.push({
                id: configData.name + '-' + Date.now() + '-' + index,
                title: title,
                content: description, // Content is the description for Microsoft Copilot
                source: configData.name,
                url: promptUrl,
                type: 'text',
                model: 'Copilot',
                mediaUrl: '', // Microsoft Copilot doesn't have media URLs
                createdAt: new Date().toISOString()
              });
            }
          } catch (error) {
            console.error(`Error extracting prompt ${index}:`, error);
          }
        });
      } 
      // Handle PromptHero with card structure
      else if (configData.name.includes('PromptHero')) {
        const cards = document.querySelectorAll('.prompt-card');
        
        cards.forEach((card: any, index: number) => {
          try {
            // Find the prompt text element
            const promptTextElement = card.querySelector('.the-prompt-text');
            const promptText = promptTextElement?.textContent?.trim() || '';
            
            // Extract media URL from image or video elements
            let mediaUrl = '';
            
            // For PromptHero Veo, prioritize video elements and use discovered extraction methods
            if (configData.name.includes('Veo')) {
              // Method 1: Extract from background-image style (most reliable based on test findings)
              const backdropElement = card.querySelector('.prompt-card-image-backdrop');
              if (backdropElement) {
                const style = backdropElement.getAttribute('style');
                if (style && style.includes("background-image: url('")) {
                  const urlMatch = style.match(/background-image:\s*url\(['"]([^'"]+)['"]?\)/);
                  if (urlMatch && urlMatch[1] && urlMatch[1].includes('.mp4')) {
                    mediaUrl = urlMatch[1];
                  }
                }
              }
              
              // Method 2: Extract from video source elements
              if (!mediaUrl) {
                const videoElement = card.querySelector('video');
                if (videoElement) {
                  const sourceElement = videoElement.querySelector('source');
                  if (sourceElement) {
                    const videoSrc = sourceElement.getAttribute('src');
                    if (videoSrc && videoSrc.includes('.mp4')) {
                      mediaUrl = videoSrc.startsWith('http') ? videoSrc : `https://prompthero.com${videoSrc}`;
                    }
                  }
                  
                  // Try video src attribute if no source element
                  if (!mediaUrl) {
                    const videoSrc = videoElement.getAttribute('src');
                    if (videoSrc && videoSrc.includes('.mp4')) {
                      mediaUrl = videoSrc.startsWith('http') ? videoSrc : `https://prompthero.com${videoSrc}`;
                    }
                  }
                }
              }
              
              // Method 3: Fallback to image only if no video found and avoid profile images
              if (!mediaUrl) {
                const imageElements = card.querySelectorAll('img');
                for (const img of imageElements) {
                  const src = img.getAttribute('src') || img.getAttribute('data-src');
                  if (src && 
                      !src.includes('user-placeholder') && 
                      !src.includes('assets/user') &&
                      !src.includes('profile') && 
                      !src.includes('avatar') &&
                      !src.match(/[a-zA-Z]+-[a-f0-9]+\.(png|jpg|jpeg|webp)$/)) { // Exclude username-hash pattern
                    mediaUrl = src.startsWith('http') ? src : `https://prompthero.com${src}`;
                    break;
                  }
                }
              }
            } else {
              // Original logic for other sources
              const imageElement = card.querySelector('img');
              const videoElement = card.querySelector('video');
              
              if (imageElement) {
                const src = imageElement.getAttribute('src') || imageElement.getAttribute('data-src');
                if (src) {
                  mediaUrl = src.startsWith('http') ? src : `https://prompthero.com${src}`;
                }
              } else if (videoElement) {
                const src = videoElement.getAttribute('src') || videoElement.getAttribute('data-src');
                if (src) {
                  mediaUrl = src.startsWith('http') ? src : `https://prompthero.com${src}`;
                }
              }
            }
            
            // Try to find individual prompt URL within the card
            let promptUrl = configData.url; // Fallback to library URL
            const linkElement = card.querySelector('a') || card.closest('a');
            if (linkElement) {
              const href = linkElement.getAttribute('href');
              if (href && href.includes('/prompt/')) {
                promptUrl = href.startsWith('http') ? href : `https://prompthero.com${href}`;
                // Remove "/fav" suffix if present
                if (promptUrl.endsWith('/fav')) {
                  promptUrl = promptUrl.slice(0, -4);
                }
              }
            }
            
            if (promptText && promptText.length > 10) {
              const model = configData.name.includes('Veo') ? 'Veo' : 'ChatGPT';
              results.push({
                id: configData.name + '-' + Date.now() + '-' + index,
                content: promptText,
                source: configData.name,
                url: promptUrl,
                type: 'text',
                model: model,
                mediaUrl: mediaUrl,
                createdAt: new Date().toISOString()
              });
            }
          } catch (error) {
            console.error(`Error extracting prompt ${index}:`, error);
          }
        });
      }
      // Handle Anthropic Prompt Library with two-stage approach
      else if (configData.name.includes('Anthropic')) {
        return []; // Return empty array as we'll handle this separately after page.evaluate
      }
      // Handle other sites with generic selector approach
      else {
        const elements = document.querySelectorAll(configData.selector);
        
        elements.forEach((element: any, index: number) => {
          try {
            const content = element.textContent?.trim();
            
            // Try to find individual prompt URL
            let promptUrl = configData.url; // Fallback to library URL
            const linkElement = element.querySelector('a') || element.closest('a');
            if (linkElement) {
              const href = linkElement.getAttribute('href');
              if (href) {
                // Build full URL if relative
                if (href.startsWith('http')) {
                  promptUrl = href;
                } else if (href.startsWith('/')) {
                  const baseUrl = new URL(configData.url);
                  promptUrl = `${baseUrl.protocol}//${baseUrl.host}${href}`;
                } else {
                  promptUrl = configData.url + '/' + href;
                }
              }
            }
            
            if (content && content.length > 10) {
              results.push({
                id: configData.name + '-' + Date.now() + '-' + index,
                content: content,
                source: configData.name,
                url: promptUrl,
                type: 'text',
                model: 'Unknown',
                mediaUrl: '', // Generic sites don't have media URLs
                createdAt: new Date().toISOString()
              });
            }
          } catch (error) {
            console.error(`Error extracting prompt ${index}:`, error);
          }
        });
      }
      
      return results;
    }, this.config);

    // Handle Anthropic's two-stage crawling approach
    if (this.config.name.includes('Anthropic')) {
      return await this.crawlAnthropicTwoStage(page);
    }

    // Convert to Prompt objects
      const promptObjects = prompts.map(prompt => 
        this.createPrompt(this.cleanContent(prompt.content), prompt.url, undefined, prompt.title || '', prompt.mediaUrl || '')
      );

      console.log(`Found ${promptObjects.length} prompts from ${this.config.name}`);
      return promptObjects;
    } catch (error) {
      console.error(`Error crawling ${this.config.name}:`, error);
      return [];
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  private async autoScroll(page: any): Promise<void> {
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight - window.innerHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });

    // Wait for any lazy-loaded content
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  private async setCookies(page: any): Promise<void> {
    const domain = new URL(this.config.url).hostname;
    
    // Check for domain-specific cookies in environment variables
    let cookiesString = '';
    
    if (domain.includes('prompthero.com')) {
      cookiesString = process.env.PROMPTHERO_COOKIES || '';
    }
    
    if (!cookiesString) {
      console.log(`No cookies configured for ${domain}`);
      return;
    }

    try {
      // Parse cookies from string format "name1=value1; name2=value2; ..."
      const cookies = this.parseCookies(cookiesString, domain);
      
      if (cookies.length > 0) {
        await page.setCookie(...cookies);
        console.log(`Set ${cookies.length} cookies for ${domain}`);
      }
    } catch (error) {
      console.error(`Error setting cookies for ${domain}:`, error);
    }
  }

  private parseCookies(cookiesString: string, domain: string): any[] {
    const cookies: any[] = [];
    
    // Split by semicolon and parse each cookie
    const cookiePairs = cookiesString.split(';').map(c => c.trim());
    
    for (const pair of cookiePairs) {
      if (!pair) continue;
      
      const [name, ...valueParts] = pair.split('=');
      const value = valueParts.join('='); // Handle values that contain '='
      
      if (name && value) {
        cookies.push({
          name: name.trim(),
          value: value.trim(),
          domain: domain,
          path: '/',
          httpOnly: false,
          secure: true,
          sameSite: 'Lax'
        });
      }
    }
    
    return cookies;
  }

  private async clickShowMoreButtons(page: any): Promise<void> {
    console.log('Looking for "Show more" buttons...');
    
    let currentPromptCount = 0;
    const maxIterations = 50; // Increased to capture all 271+ prompts
    let iteration = 0;

    // Get initial count with retries
    for (let retry = 0; retry < 3; retry++) {
      try {
        currentPromptCount = await page.$$eval('[data-testid="prompt-card"]', (elements: any[]) => elements.length);
        if (currentPromptCount > 0) {
          console.log(`Initial prompt count: ${currentPromptCount}`);
          break;
        } else if (retry < 2) {
          console.log(`No prompts found yet, waiting... (attempt ${retry + 1})`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      } catch (error) {
        if (retry < 2) {
          console.log(`Retrying prompt count... (attempt ${retry + 1})`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
    }

    if (currentPromptCount === 0) {
      console.log('Could not find any prompts initially, skipping "Show more" functionality');
      return;
    }

    while (iteration < maxIterations) {
      try {
        // For Microsoft Copilot, use the specific selector
        if (this.config.name === 'Microsoft Copilot') {
          const showMoreButton = await page.$('[data-testid="show-more-button"]');
          
          if (!showMoreButton) {
            console.log('No Microsoft Copilot "Show more" button found');
            break;
          }

          // Check if button is enabled and visible
          const isClickable = await page.evaluate((button: any) => {
            return button && !button.disabled && button.offsetParent !== null;
          }, showMoreButton);

          if (!isClickable) {
            console.log('Microsoft Copilot "Show more" button is disabled or hidden');
            break;
          }

          console.log(`Clicking Microsoft Copilot "Show more" button (iteration ${iteration + 1})`);
          await showMoreButton.click();
        } else {
          // Look for and click "Show more" button using generic approach
          const buttonClicked = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            for (const button of buttons) {
              const text = (button as HTMLElement).textContent?.trim().toLowerCase();
              const ariaLabel = (button as HTMLElement).getAttribute('aria-label')?.toLowerCase();
              
              if ((text && (text.includes('more') || text.includes('load'))) ||
                  (ariaLabel && (ariaLabel.includes('more') || ariaLabel.includes('load')))) {
                
                // Check if button is visible and enabled
                const rect = (button as HTMLElement).getBoundingClientRect();
                const isVisible = rect.width > 0 && rect.height > 0;
                const isEnabled = !(button as HTMLButtonElement).disabled;
                
                if (isVisible && isEnabled) {
                  (button as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
                  (button as HTMLElement).click();
                  return true;
                }
              }
            }
            return false;
          });

          if (!buttonClicked) {
            console.log('No more "Show more" buttons found');
            break;
          }

          console.log(`Clicked "Show more" button (iteration ${iteration + 1})`);
        }
        
        // Wait for content to load
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if more prompts were loaded
        const newPromptCount = await page.$$eval('[data-testid="prompt-card"]', (elements: any[]) => elements.length);
        
        if (newPromptCount > currentPromptCount) {
          console.log(`Loaded ${newPromptCount - currentPromptCount} additional prompts (total: ${newPromptCount})`);
          currentPromptCount = newPromptCount;
        } else {
          console.log('No new prompts loaded, stopping');
          break;
        }
        
        iteration++;
      } catch (error) {
        console.log(`Error in show more iteration ${iteration + 1}: ${error}`);
        break;
      }
    }

    console.log(`Final prompt count after "Show more": ${currentPromptCount}`);
  }

  /**
   * Two-stage Anthropic crawler: First get all links with Cheerio, then extract content with Puppeteer
   */
  private async crawlAnthropicTwoStage(page: any): Promise<Prompt[]> {
    console.log('Starting two-stage Anthropic crawl...');
    
    try {
      // Stage 1: Use Cheerio-like approach to get all prompt links from the main page
      console.log('Stage 1: Extracting all prompt links from main page...');
      
      // Navigate to the main library page
      await page.goto('https://docs.anthropic.com/en/resources/prompt-library/library', { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Extract all prompt links
      const promptLinks = await page.evaluate(() => {
        const links: { url: string; title: string }[] = [];
        const promptElements = document.querySelectorAll('a[href*="/prompt-library/"]');
        const baseUrl = 'https://docs.anthropic.com';
        
        promptElements.forEach((element: any) => {
          const href = element.getAttribute('href');
          const fullTitle = element.textContent?.trim() || '';
          
          // Clean up the title - take only the first line and remove extra whitespace
          const title = fullTitle.split('\n')[0].trim();
          
          // Only include links that go to individual prompts (not the library page itself)
          if (href && !href.includes('/library') && title.length > 0 && title.length < 100) {
            // Fix URL construction - href is missing /resources, so we need to add it
            let fullUrl;
            if (href.startsWith('http')) {
              fullUrl = href;
            } else if (href.startsWith('/en/prompt-library/')) {
              // Fix the missing /resources in the path
              fullUrl = baseUrl + href.replace('/en/prompt-library/', '/en/resources/prompt-library/');
            } else {
              // fallback for other formats
              fullUrl = href.startsWith('/') ? baseUrl + href : baseUrl + '/' + href;
            }
            
            links.push({
              url: fullUrl,
              title: title
            });
          }
        });
        
        // Remove duplicates based on URL
        const uniqueLinks = links.filter((link, index, self) => 
          index === self.findIndex(l => l.url === link.url)
        );
        
        return uniqueLinks;
      });
      
      console.log(`Stage 1: Found ${promptLinks.length} unique prompt links`);
      
      if (promptLinks.length === 0) {
        console.warn('No prompt links found on main page');
        return [];
      }
      
      // Stage 2: Extract actual prompt content from each individual page
      console.log('Stage 2: Extracting prompt content from individual pages...');
      const extractedPrompts: any[] = [];
      
      // Process each prompt link
      for (let i = 0; i < promptLinks.length; i++) {
        const linkData = promptLinks[i];
        try {
          console.log(`Processing ${i + 1}/${promptLinks.length}: ${linkData.title}`);
          
          // Navigate to the individual prompt page
          await page.goto(linkData.url, { 
            waitUntil: 'domcontentloaded',
            timeout: 30000 
          });
          
          // Wait for content to fully load
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Extract the actual prompt content using multiple strategies
          const promptContent = await page.evaluate(() => {
            // Strategy 1: Look for prompt content in table cells (most reliable for Anthropic)
            const tableCells = document.querySelectorAll('td');
            for (const cell of tableCells) {
              const text = cell.textContent?.trim() || '';
              
              // Check if this looks like a prompt
              if (text.length > 50 && text.length < 3000 && (
                text.toLowerCase().includes('write me') ||
                text.toLowerCase().includes('your task') ||
                text.toLowerCase().includes('you are') ||
                text.toLowerCase().includes('act as') ||
                text.toLowerCase().includes('analyze') ||
                text.toLowerCase().includes('create') ||
                text.toLowerCase().includes('generate') ||
                text.toLowerCase().includes('extract') ||
                text.toLowerCase().includes('summarize') ||
                text.toLowerCase().includes('explain') ||
                text.toLowerCase().includes('help me') ||
                text.toLowerCase().includes('write a') ||
                text.toLowerCase().includes('describe') ||
                text.toLowerCase().includes('review') ||
                text.toLowerCase().includes('plan')
              )) {
                // Clean up common artifacts
                return text
                  .replace(/\s+/g, ' ') // Normalize whitespace
                  .replace(/^\s*["'`]\s*/, '') // Remove leading quotes
                  .replace(/\s*["'`]\s*$/, '') // Remove trailing quotes
                  .trim();
              }
            }
            
            // Strategy 2: Look in code spans with string tokens
            const tokenSpans = document.querySelectorAll('span.token.string');
            for (const span of tokenSpans) {
              const text = span.textContent?.trim() || '';
              if (text.length > 100 && text.length < 2000 && (
                text.toLowerCase().includes('write me') ||
                text.toLowerCase().includes('your task') ||
                text.toLowerCase().includes('you are') ||
                text.toLowerCase().includes('analyze') ||
                text.toLowerCase().includes('create')
              )) {
                // Clean up the text by removing quotes and escaping
                return text
                  .replace(/^["'`]|["'`]$/g, '')
                  .replace(/\\n/g, '\n')
                  .replace(/\\"/g, '"')
                  .replace(/\s+/g, ' ')
                  .trim();
              }
            }
            
            // Strategy 3: Look in pre/code blocks for prompt text
            const codeBlocks = document.querySelectorAll('pre, code');
            for (const block of codeBlocks) {
              const text = block.textContent?.trim() || '';
              const lines = text.split('\n');
              
              for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.length > 100 && trimmed.length < 2000 && (
                  trimmed.toLowerCase().includes('write me') ||
                  trimmed.toLowerCase().includes('your task') ||
                  trimmed.toLowerCase().includes('you are') ||
                  trimmed.toLowerCase().includes('analyze') ||
                  trimmed.toLowerCase().includes('create')
                )) {
                  return trimmed
                    .replace(/^["'`]|["'`]$/g, '')
                    .replace(/\\n/g, '\n')
                    .replace(/\\"/g, '"')
                    .replace(/\s+/g, ' ')
                    .trim();
                }
              }
            }
            
            // Strategy 4: Look for paragraph content
            const paragraphs = document.querySelectorAll('p, div');
            for (const para of paragraphs) {
              const text = para.textContent?.trim() || '';
              if (text.length > 100 && text.length < 1500 && (
                text.toLowerCase().includes('your task') ||
                text.toLowerCase().includes('you are') ||
                text.toLowerCase().includes('analyze') ||
                text.toLowerCase().includes('write') ||
                text.toLowerCase().includes('create')
              )) {
                return text.replace(/\s+/g, ' ').trim();
              }
            }
            
            return null;
          });
          
          if (promptContent && promptContent.length > 50) {
            extractedPrompts.push({
              id: `${this.config.name}-${Date.now()}-${extractedPrompts.length}`,
              content: promptContent,
              source: this.config.name,
              url: linkData.url,
              type: 'text',
              mediaUrl: '',
              createdAt: new Date().toISOString(),
              title: linkData.title
            });
            
            console.log(`✓ Extracted prompt: ${linkData.title} (${promptContent.length} chars)`);
          } else {
            console.log(`✗ No content found for: ${linkData.title}`);
          }
          
        } catch (error) {
          console.error(`Error extracting from ${linkData.title}:`, error);
        }
        
        // Small delay between requests to be respectful
        if (i < promptLinks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Stage 3: Convert to Prompt objects
      const promptObjects = extractedPrompts.map(prompt => 
        this.createPrompt(
          this.cleanContent(prompt.content), 
          prompt.url, 
          undefined, 
          prompt.title, 
          prompt.mediaUrl
        )
      );
      
      console.log(`✅ Two-stage Anthropic crawl complete: ${promptObjects.length} prompts extracted`);
      return promptObjects;
      
    } catch (error) {
      console.error('Error in two-stage Anthropic crawl:', error);
      return [];
    }
  }
}
