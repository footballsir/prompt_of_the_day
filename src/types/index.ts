export interface Prompt {
  id: string; // UUID
  content: string;
  title?: string; // Title of the prompt (if available)
  description?: string; // Description of the prompt (if available)
  source: string;
  url: string;
  type: "text" | "image" | "video";
  model?: string; // AI model used (e.g., Copilot, Claude, Veo, ChatGPT)
  mediaUrl?: string; // URL to associated image/video media
  createdAt: string; // ISO timestamp
}

export interface DailySelection {
  date: string; // YYYY-MM-DD
  promptId: string;
  selectedAt: string; // ISO timestamp
}

export interface ExtendedDailySelection extends DailySelection {
  id: string;
  title: string;
  description: string;
  content: string;
  source: string;
  url: string;
  category: string;
  model?: string;
  mediaUrl?: string;
}

export interface CrawlResult {
  success: boolean;
  promptsFound: number;
  errors: string[];
  timestamp: string;
}

export interface ContentFilter {
  keywords: string[];
  patterns: RegExp[];
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string; // Optional success message
  timestamp: string;
}

export interface PromptListResponse {
  prompts: Prompt[];
  total: number;
  page: number;
  limit: number;
}

// Crawler configuration
export interface CrawlerConfig {
  name: string;
  url: string;
  selector: string;
  type: "puppeteer" | "cheerio";
  contentType: "text" | "image" | "video";
}
