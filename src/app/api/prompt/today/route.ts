import { NextRequest, NextResponse } from 'next/server';
import { PromptSelector } from '@/lib/promptSelector';
import { ApiResponse } from '@/types';

// GET /api/prompt/today - Get today's prompt
export async function GET() {
  try {
    const prompt = await PromptSelector.getTodayPrompt();
    
    const response: ApiResponse = {
      success: true,
      data: prompt,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching today\'s prompt:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// PUT /api/prompt/today - Update today's prompt
export async function PUT(request: NextRequest) {
  try {
    const { promptId } = await request.json();
    
    if (!promptId) {
      const response: ApiResponse = {
        success: false,
        error: 'promptId is required',
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(response, { status: 400 });
    }

    const updatedPrompt = await PromptSelector.updateTodayPrompt(promptId);
    
    if (!updatedPrompt) {
      const response: ApiResponse = {
        success: false,
        error: 'Failed to update today\'s prompt or prompt not found',
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse = {
      success: true,
      data: updatedPrompt,
      message: 'Today\'s prompt updated successfully',
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating today\'s prompt:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, { status: 500 });
  }
}
