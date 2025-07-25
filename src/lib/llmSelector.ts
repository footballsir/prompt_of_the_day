export interface PromptScore {
  promptNumber: number;
  inspiring: number;
  appropriate: number;
  fun: number;
  total: number;
}

export interface LLMSelectionResult {
  selectedPromptNumber: number;
  reason: string;
  ranked: PromptScore[];
}

export interface ShortlistedPrompt {
  id: string;
  content: string;
  source: string;
  type: string;
}

export class LLMSelector {
  private static readonly OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
  private static readonly OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  static async selectPromptOfTheDay(shortlistedPrompts: ShortlistedPrompt[]): Promise<LLMSelectionResult | null> {
    if (!this.OPENAI_API_KEY) {
      console.error('OpenAI API key not found');
      return null;
    }

    const systemPrompt = `You are an expert prompt curator for a creative studio called "Microsoft Studio 8" that serves inspiring daily prompts.

Your job is to evaluate and score prompts on 3 criteria (1-5 scale):
1. Inspiring: Does this prompt spark creativity, new ideas, or meaningful thinking?
2. Appropriate: Is this suitable for a professional creative environment? (no offensive content)  
3. Fun: Is this engaging, interesting, or enjoyable to work with?

Give each prompt a score for each criteria, then calculate total score.

Return JSON like this:
{
  "selectedPromptNumber": 3,
  "reason": "short reason here",
  "ranked": [
    {
      "promptNumber": 3,
      "inspiring": 4,
      "appropriate": 5,
      "fun": 3,
      "total": 12
    }
  ]
}`;

    const promptsText = shortlistedPrompts.map((p, index) => 
      `${index + 1}. ${p.content.substring(0, 200)}... (Source: ${p.source}, Type: ${p.type})`
    ).join('\n\n');

    const userPrompt = `Please score and select the best prompt from these ${shortlistedPrompts.length} options:\n\n${promptsText}\n\nReturn the number (1-${shortlistedPrompts.length}) of your selected prompt.`;

    try {
      const response = await fetch(this.OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          response_format: { type: 'json_object' }
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content in OpenAI response');
      }

      const result = JSON.parse(content) as LLMSelectionResult;
      console.log('LLM Selection Result:', result);
      
      return result;
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      return null;
    }
  }

  static generateDescription(reason: string): string {
    return reason || 'LLM-selected prompt of the day';
  }
}
