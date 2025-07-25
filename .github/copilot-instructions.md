<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Prompt of the Day - Copilot Instructions

This is a Next.js 14 fullstack application for delivering a "Prompt of the Day" service with the following key features:

## Project Architecture
- **Frontend**: Next.js 14 with App Router, TypeScript, and Tailwind CSS
- **Backend**: Next.js API Routes for data access and prompt management
- **Data Storage**: Local JSON files in `/data` directory
- **Crawling**: Weekly web scraping using Puppeteer and Axios/Cheerio
- **Scheduling**: node-cron for automated tasks (China timezone)

## Key Components
1. **Web Crawling Services**: Scrape prompts from multiple sources
2. **Prompt Filtering**: Basic keyword-based content filtering
3. **Daily Selection**: Automated prompt selection with deduplication
4. **API Routes**: RESTful endpoints for prompt data
5. **Frontend Pages**: Main prompt display, history, and browse all prompts

## Data Structure
- Prompts stored as JSON with: id, content, source, url, type, createdAt
- Daily selections tracked in history.json
- Content filtering applied at display time, not storage

## Coding Guidelines
- Use TypeScript for all components and API routes
- Follow Next.js 14 App Router patterns
- Implement responsive design with Tailwind CSS
- Handle errors gracefully with proper fallbacks
- Use China timezone (Asia/Shanghai) for all scheduling
- Keep crawled data intact, filter only at display level
