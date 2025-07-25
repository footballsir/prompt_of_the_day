import { ContentFilter } from '@/types';

// No content filtering - display all prompts
export const contentFilter: ContentFilter = {
  keywords: [],
  patterns: []
};

export function isContentSafe(content: string): boolean {
  // Always return true - no filtering
  return true;
}

export function filterPrompts(prompts: any[]): any[] {
  // Return all prompts without filtering
  return prompts;
}
