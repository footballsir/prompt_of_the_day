import fs from 'fs/promises';
import path from 'path';
import { Prompt, DailySelection } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');

export class DataManager {
  static async ensureDataDir(): Promise<void> {
    try {
      await fs.access(DATA_DIR);
    } catch {
      await fs.mkdir(DATA_DIR, { recursive: true });
    }
  }

  static async savePrompts(prompts: Prompt[], date: string): Promise<void> {
    await this.ensureDataDir();
    const filePath = path.join(DATA_DIR, `prompts-${date}.json`);
    await fs.writeFile(filePath, JSON.stringify(prompts, null, 2));
  }

  static async loadPrompts(date: string): Promise<Prompt[]> {
    try {
      const filePath = path.join(DATA_DIR, `prompts-${date}.json`);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static async getAllPrompts(): Promise<Prompt[]> {
    await this.ensureDataDir();
    const files = await fs.readdir(DATA_DIR);
    const promptFiles = files.filter(file => file.startsWith('prompts-') && file.endsWith('.json'));
    
    const allPrompts: Prompt[] = [];
    for (const file of promptFiles) {
      try {
        const filePath = path.join(DATA_DIR, file);
        const data = await fs.readFile(filePath, 'utf-8');
        const prompts = JSON.parse(data);
        allPrompts.push(...prompts);
      } catch (error) {
        console.error(`Error reading ${file}:`, error);
      }
    }
    
    return allPrompts;
  }

  // Get prompts from the latest crawled data only (used for daily selection and gallery)
  static async getLatestPrompts(): Promise<Prompt[]> {
    await this.ensureDataDir();
    const files = await fs.readdir(DATA_DIR);
    const promptFiles = files.filter(file => file.startsWith('prompts-') && file.endsWith('.json'));
    
    if (promptFiles.length === 0) {
      return [];
    }
    
    // Sort files by date to get the latest
    promptFiles.sort((a, b) => {
      const dateA = a.replace('prompts-', '').replace('.json', '');
      const dateB = b.replace('prompts-', '').replace('.json', '');
      return dateB.localeCompare(dateA); // Descending order
    });
    
    // Get the latest file
    const latestFile = promptFiles[0];
    
    try {
      const filePath = path.join(DATA_DIR, latestFile);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading latest file ${latestFile}:`, error);
      return [];
    }
  }

  static async saveHistory(history: DailySelection[]): Promise<void> {
    await this.ensureDataDir();
    const filePath = path.join(DATA_DIR, 'history.json');
    await fs.writeFile(filePath, JSON.stringify(history, null, 2));
  }

  static async loadHistory(): Promise<DailySelection[]> {
    try {
      const filePath = path.join(DATA_DIR, 'history.json');
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static async addToHistory(selection: DailySelection, fullPrompt?: Prompt, description?: string, llmResult?: any): Promise<void> {
    const history = await this.loadHistory();
    
    // If we have the full prompt data, store it in the extended format
    let historyEntry: any = selection;
    if (fullPrompt) {
      historyEntry = {
        date: selection.date,
        promptId: selection.promptId,
        selectedAt: selection.selectedAt,
        id: fullPrompt.id,
        title: fullPrompt.title || 'Untitled',
        description: description || 'Daily prompt selection',
        content: fullPrompt.content,
        source: fullPrompt.source,
        url: fullPrompt.url,
        category: fullPrompt.type,
        model: fullPrompt.model || '',
        mediaUrl: fullPrompt.mediaUrl || ''
      };
      
      // Add LLM selection data if available
      if (llmResult) {
        historyEntry.llmReason = llmResult.reason;
        historyEntry.llmScores = llmResult.ranked;
      }
    }
    
    // Remove any existing entry for the same date
    const filteredHistory = history.filter(item => item.date !== selection.date);
    filteredHistory.push(historyEntry);
    
    // Sort by date to maintain chronological order
    filteredHistory.sort((a, b) => a.date.localeCompare(b.date));
    
    await this.saveHistory(filteredHistory);
  }

  // New method to update today's entry and ensure it's the latest record
  static async updateTodayInHistory(selection: DailySelection, fullPrompt?: Prompt, description?: string, llmResult?: any): Promise<void> {
    const history = await this.loadHistory();
    
    // Remove any existing entry for today's date
    const filteredHistory = history.filter(item => item.date !== selection.date);
    
    // If we have the full prompt data, store it in the extended format
    let historyEntry: any = selection;
    if (fullPrompt) {
      historyEntry = {
        date: selection.date,
        promptId: selection.promptId,
        selectedAt: selection.selectedAt,
        id: fullPrompt.id,
        title: fullPrompt.title || 'Untitled',
        description: description || 'Daily prompt selection',
        content: fullPrompt.content,
        source: fullPrompt.source,
        url: fullPrompt.url,
        category: fullPrompt.type,
        model: fullPrompt.model || '',
        mediaUrl: fullPrompt.mediaUrl || ''
      };
      
      // Add LLM selection data if available
      if (llmResult) {
        historyEntry.llmReason = llmResult.reason;
        historyEntry.llmScores = llmResult.ranked;
      }
    }
    
    // Add the new selection as the latest record (at the end)
    filteredHistory.push(historyEntry);
    
    // Sort by date to maintain chronological order, ensuring today's updated entry is last
    filteredHistory.sort((a, b) => a.date.localeCompare(b.date));
    
    await this.saveHistory(filteredHistory);
    console.log(`Updated today's entry (${selection.date}) in history as the latest record`);
  }

  static getTodayDate(): string {
    // Use China timezone
    const now = new Date();
    const chinaTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Shanghai" }));
    return chinaTime.toISOString().split('T')[0];
  }

  static getWeeklyFileName(): string {
    const today = this.getTodayDate();
    return `prompts-${today}`;
  }
}
