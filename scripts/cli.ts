#!/usr/bin/env node

import { config } from 'dotenv';
import { SchedulerService } from '../src/lib/scheduler';
import { CrawlerManager } from '../src/lib/crawlers/index';
import { PromptSelector } from '../src/lib/promptSelector';
import { DataManager } from '../src/lib/dataManager';

// Load environment variables from .env.local
config({ path: '.env.local' });

const command = process.argv[2];

async function main() {
  console.log('🤖 Prompt of the Day CLI');
  
  switch (command) {
    case 'crawl':
      await performCrawl();
      break;
    case 'select':
      await performSelection();
      break;
    case 'status':
      await showStatus();
      break;
    case 'start-scheduler':
      startScheduler();
      break;
    case 'help':
    default:
      showHelp();
      break;
  }
}

async function performCrawl() {
  console.log('🕷️ Starting manual crawl...');
  try {
    const { allPrompts, results } = await CrawlerManager.crawlAll();
    
    if (allPrompts.length > 0) {
      const today = DataManager.getTodayDate();
      await DataManager.savePrompts(allPrompts, today);
      console.log(`✅ Saved ${allPrompts.length} prompts to ${today}`);
    } else {
      console.log('ℹ️ No new prompts found');
    }

    console.log('\n📊 Crawl Results:');
    results.forEach(result => {
      if (result.success) {
        console.log(`✅ ${result.source}: ${result.count} prompts`);
      } else {
        console.log(`❌ ${result.source}: ${result.error}`);
      }
    });
  } catch (error) {
    console.error('❌ Crawl failed:', error);
  }
}

async function performSelection() {
  console.log('🎯 Starting manual prompt selection...');
  try {
    const selectedPrompt = await PromptSelector.selectDailyPrompt();
    
    if (selectedPrompt) {
      console.log(`✅ Selected prompt: ${selectedPrompt.content.substring(0, 100)}...`);
      console.log(`📍 Source: ${selectedPrompt.source}`);
      console.log(`🏷️ Type: ${selectedPrompt.type}`);
    } else {
      console.log('ℹ️ No prompt was selected (may already exist for today or no prompts available)');
    }
  } catch (error) {
    console.error('❌ Selection failed:', error);
  }
}

async function showStatus() {
  console.log('📊 System Status');
  try {
    const allPrompts = await DataManager.getAllPrompts();
    const history = await DataManager.loadHistory();
    const today = DataManager.getTodayDate();
    const todaySelection = history.find(h => h.date === today);
    
    console.log(`📚 Total prompts: ${allPrompts.length}`);
    console.log(`📜 History entries: ${history.length}`);
    console.log(`📅 Today's date: ${today}`);
    console.log(`🎯 Today's prompt: ${todaySelection ? 'Selected' : 'Not selected'}`);
    
    if (todaySelection) {
      const prompt = allPrompts.find(p => p.id === todaySelection.promptId);
      if (prompt) {
        console.log(`   Content: ${prompt.content.substring(0, 100)}...`);
      }
    }
  } catch (error) {
    console.error('❌ Status check failed:', error);
  }
}

function startScheduler() {
  console.log('⏰ Starting scheduler...');
  const scheduler = SchedulerService.getInstance();
  scheduler.start();
  
  console.log('✅ Scheduler started. Press Ctrl+C to stop.');
  
  // Keep the process running
  process.stdin.resume();
  
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping scheduler...');
    scheduler.stop();
    process.exit(0);
  });
}

function showHelp() {
  console.log(`
📋 Available Commands:

  crawl           - Manually trigger web crawling
  select          - Manually trigger daily prompt selection
  status          - Show system status and statistics
  start-scheduler - Start the automated scheduler
  help            - Show this help message

🚀 Examples:
  npm run cli crawl
  npm run cli select
  npm run cli status
  npm run cli start-scheduler
`);
}

main().catch(console.error);
