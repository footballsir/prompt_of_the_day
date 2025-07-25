import { Prompt, DailySelection } from '@/types';
import { DataManager } from './dataManager';
import { filterPrompts } from './contentFilter';
import { LLMSelector, ShortlistedPrompt } from './llmSelector';

export class PromptSelector {
  static async selectDailyPrompt(): Promise<Prompt | null> {
    const today = DataManager.getTodayDate();
    console.log(`Starting LLM-based prompt selection for ${today}...`);

    try {
      // Step 1: Get shortlist of 32 prompts
      const shortlistedPrompts = await this.getShortlistedPrompts();
      
      if (shortlistedPrompts.length === 0) {
        console.error('No prompts available for shortlisting');
        return null;
      }

      console.log(`Shortlisted ${shortlistedPrompts.length} prompts for LLM evaluation`);

      // Step 2: Send to LLM for scoring and selection
      const llmResult = await LLMSelector.selectPromptOfTheDay(shortlistedPrompts);
      
      if (!llmResult) {
        console.error('LLM selection failed, falling back to random selection');
        return this.fallbackRandomSelection(shortlistedPrompts);
      }

      // Step 3: Find the selected prompt and save to history
      const selectedIndex = llmResult.selectedPromptNumber - 1; // Convert to 0-based index
      
      if (selectedIndex < 0 || selectedIndex >= shortlistedPrompts.length) {
        console.error(`Invalid prompt selection index: ${llmResult.selectedPromptNumber}`);
        return this.fallbackRandomSelection(shortlistedPrompts);
      }

      const selectedShortlisted = shortlistedPrompts[selectedIndex];
      const selectedPrompt = await this.findPromptById(selectedShortlisted.id);
      
      if (!selectedPrompt) {
        console.error('Could not find selected prompt in database');
        return this.fallbackRandomSelection(shortlistedPrompts);
      }

      // Save to history with LLM reasoning
      const selection: DailySelection = {
        date: today,
        promptId: selectedPrompt.id,
        selectedAt: new Date().toISOString(),
      };

      // Generate creative description
      const description = LLMSelector.generateDescription(llmResult.reason);

      await DataManager.addToHistory(selection, selectedPrompt, description, llmResult);
      console.log(`LLM selected prompt: ${selectedPrompt.content.substring(0, 100)}...`);
      console.log(`Reason: ${llmResult.reason}`);

      return selectedPrompt;
    } catch (error) {
      console.error('Error in LLM prompt selection:', error);
      
      // Fallback to simple random selection
      const availablePrompts = await this.getAvailablePrompts();
      if (availablePrompts.length === 0) return null;
      
      const randomPrompt = availablePrompts[Math.floor(Math.random() * availablePrompts.length)];
      
      const selection: DailySelection = {
        date: today,
        promptId: randomPrompt.id,
        selectedAt: new Date().toISOString(),
      };
      
      await DataManager.addToHistory(selection, randomPrompt);
      return randomPrompt;
    }
  }

  // New method to update today's prompt selection
  static async updateTodayPrompt(newPromptId: string): Promise<Prompt | null> {
    const today = DataManager.getTodayDate();
    const latestPrompts = await DataManager.getLatestPrompts();
    const newPrompt = latestPrompts.find(p => p.id === newPromptId);
    
    if (!newPrompt) {
      console.error(`Prompt with ID ${newPromptId} not found in latest prompts`);
      return null;
    }

    // Create updated selection record
    const selection: DailySelection = {
      date: today,
      promptId: newPrompt.id,
      selectedAt: new Date().toISOString(),
    };

    // Update history with full prompt data (this will replace today's entry and ensure it's the latest record)
    await DataManager.updateTodayInHistory(selection, newPrompt);
    console.log(`Updated today's prompt (${today}) to: ${newPrompt.content.substring(0, 100)}...`);
    
    return newPrompt;
  }

  private static applySelectionCriteria(prompts: Prompt[], history: DailySelection[]): Prompt | null {
    if (prompts.length === 0) return null;

    // Group prompts by type
    const promptsByType = {
      text: prompts.filter(p => p.type === 'text'),
      image: prompts.filter(p => p.type === 'image'),
      video: prompts.filter(p => p.type === 'video'),
    };

    // Analyze recent selections to ensure variety
    const recentSelections = history.slice(-7); // Last 7 days
    const recentTypes = recentSelections.map(s => {
      const prompt = prompts.find(p => p.id === s.promptId);
      return prompt?.type || 'text';
    });

    // Prefer types that haven't been used recently
    const typePreference = this.getTypePreference(recentTypes);
    
    // Select from preferred type, or fallback to any available
    let candidatePrompts = promptsByType[typePreference];
    if (candidatePrompts.length === 0) {
      candidatePrompts = prompts;
    }

    // Add some randomness but prefer higher quality prompts
    const qualityWeightedPrompts = this.applyQualityWeighting(candidatePrompts);
    
    // Final selection with randomness
    const randomIndex = Math.floor(Math.random() * qualityWeightedPrompts.length);
    return qualityWeightedPrompts[randomIndex];
  }

  private static getTypePreference(recentTypes: string[]): 'text' | 'image' | 'video' {
    const typeCounts = {
      text: recentTypes.filter(t => t === 'text').length,
      image: recentTypes.filter(t => t === 'image').length,
      video: recentTypes.filter(t => t === 'video').length,
    };

    // Prefer the least used type
    const sortedTypes = Object.entries(typeCounts).sort(([,a], [,b]) => a - b);
    return sortedTypes[0][0] as 'text' | 'image' | 'video';
  }

  private static applyQualityWeighting(prompts: Prompt[]): Prompt[] {
    // Simple quality heuristics
    const weightedPrompts: Prompt[] = [];
    
    prompts.forEach(prompt => {
      let weight = 1;
      
      // Prefer prompts with good length (not too short, not too long)
      const length = prompt.content.length;
      if (length > 50 && length < 500) weight += 2;
      else if (length > 20 && length < 1000) weight += 1;
      
      // Prefer prompts from certain sources (can be customized)
      if (prompt.source.includes('Anthropic')) weight += 1;
      if (prompt.source.includes('Microsoft')) weight += 1;
      
      // Add the prompt multiple times based on weight
      for (let i = 0; i < weight; i++) {
        weightedPrompts.push(prompt);
      }
    });
    
    return weightedPrompts;
  }

  static async getTodayPrompt(): Promise<Prompt | null> {
    const today = DataManager.getTodayDate();
    const history = await DataManager.loadHistory();
    const todaySelection = history.find(selection => selection.date === today);
    
    if (!todaySelection) {
      return await this.selectDailyPrompt();
    }
    
    // Check if today's history entry has complete prompt data (single source of truth)
    if ('content' in todaySelection && todaySelection.content) {
      // Convert history entry to Prompt format
      const historyEntry = todaySelection as any;
      return {
        id: historyEntry.id || historyEntry.promptId,
        content: historyEntry.content,
        title: historyEntry.title || 'Untitled',
        description: historyEntry.description,
        source: historyEntry.source,
        url: historyEntry.url || '',
        type: historyEntry.category as 'text' | 'image' | 'video',
        model: historyEntry.model || '',
        mediaUrl: historyEntry.mediaUrl || '',
        createdAt: historyEntry.selectedAt
      };
    }
    
    // Fallback: Legacy entries without complete data - look up in prompt files
    console.log(`Legacy entry found for ${today}, looking up prompt data...`);
    const latestPrompts = await DataManager.getLatestPrompts();
    let prompt = latestPrompts.find(p => p.id === todaySelection.promptId);
    
    if (!prompt) {
      console.log(`Prompt ${todaySelection.promptId} not found in latest data, searching all prompts...`);
      const allPrompts = await DataManager.getAllPrompts();
      prompt = allPrompts.find(p => p.id === todaySelection.promptId);
    }
    
    return prompt || null;
  }

  /**
   * Step 1: Shortlist 32 prompts with source diversity
   */
  private static async getShortlistedPrompts(): Promise<ShortlistedPrompt[]> {
    const allPrompts = await DataManager.getLatestPrompts();
    const history = await DataManager.loadHistory();
    
    // Get prompts used in last 60 days
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const recentlyUsedIds = history
      .filter(h => new Date(h.date) >= sixtyDaysAgo)
      .map(h => h.promptId);

    // Filter out recently used prompts
    const availablePrompts = allPrompts.filter(p => !recentlyUsedIds.includes(p.id));

    // Group by source
    const copilotPrompts = availablePrompts.filter(p => p.source.includes('Copilot'));
    const anthropicPrompts = availablePrompts.filter(p => p.source.includes('Anthropic'));
    const promptHeroChatGPTPrompts = availablePrompts.filter(p => 
      p.source.includes('PromptHero') && p.type === 'image'
    );
    const promptHeroVeoPrompts = availablePrompts.filter(p => 
      p.source.includes('PromptHero') && p.type === 'video'
    );

    // Select ~8 from each source
    const shortlisted: ShortlistedPrompt[] = [];
    
    shortlisted.push(...this.randomSample(copilotPrompts, 8).map(this.toShortlistedPrompt));
    shortlisted.push(...this.randomSample(anthropicPrompts, 8).map(this.toShortlistedPrompt));
    shortlisted.push(...this.randomSample(promptHeroChatGPTPrompts, 8).map(this.toShortlistedPrompt));
    shortlisted.push(...this.randomSample(promptHeroVeoPrompts, 8).map(this.toShortlistedPrompt));

    // If we don't have enough from specific sources, fill with any available
    const remaining = 32 - shortlisted.length;
    if (remaining > 0) {
      const usedIds = new Set(shortlisted.map(p => p.id));
      const remainingPrompts = availablePrompts.filter(p => !usedIds.has(p.id));
      shortlisted.push(...this.randomSample(remainingPrompts, remaining).map(this.toShortlistedPrompt));
    }

    return shortlisted.slice(0, 32); // Ensure exactly 32 or fewer
  }

  private static toShortlistedPrompt(prompt: Prompt): ShortlistedPrompt {
    return {
      id: prompt.id,
      content: prompt.content,
      source: prompt.source,
      type: prompt.type
    };
  }

  private static randomSample<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  private static async findPromptByContent(content: string): Promise<Prompt | null> {
    const allPrompts = await DataManager.getLatestPrompts();
    return allPrompts.find(p => p.content === content) || null;
  }

  private static async findPromptById(id: string): Promise<Prompt | null> {
    const allPrompts = await DataManager.getLatestPrompts();
    return allPrompts.find(p => p.id === id) || null;
  }

  private static async getAvailablePrompts(): Promise<Prompt[]> {
    const allPrompts = await DataManager.getLatestPrompts();
    const history = await DataManager.loadHistory();
    
    // Get recently used prompt IDs (last 7 days for fallback)
    const recentlyUsedIds = history.slice(-7).map(h => h.promptId);
    
    // Filter out recently used prompts
    return allPrompts.filter(p => !recentlyUsedIds.includes(p.id));
  }

  private static fallbackRandomSelection(shortlistedPrompts: ShortlistedPrompt[]): Prompt | null {
    if (shortlistedPrompts.length === 0) return null;
    
    const randomPrompt = shortlistedPrompts[Math.floor(Math.random() * shortlistedPrompts.length)];
    
    // Convert back to full Prompt format (this is a simplified version)
    return {
      id: randomPrompt.id,
      content: randomPrompt.content,
      source: randomPrompt.source,
      url: '',
      type: randomPrompt.type as 'text' | 'image' | 'video',
      createdAt: new Date().toISOString()
    };
  }

  private static getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }
}
