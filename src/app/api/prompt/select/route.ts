import { NextResponse } from 'next/server';
import { PromptSelector } from '@/lib/promptSelector';
import { ApiResponse } from '@/types';

// POST /api/prompt/select - Manually trigger daily prompt selection
export async function POST() {
  try {
    const prompt = await PromptSelector.selectDailyPrompt();
    
    if (!prompt) {
      const response: ApiResponse = {
        success: false,
        error: 'No suitable prompt found for selection',
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse = {
      success: true,
      data: prompt,
      message: 'Daily prompt selected successfully',
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error selecting daily prompt:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, { status: 500 });
  }
}
