import { NextResponse } from 'next/server';
import { DataManager } from '@/lib/dataManager';
import { filterPrompts } from '@/lib/contentFilter';
import { ApiResponse, PromptListResponse } from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const source = searchParams.get('source') || '';
    
    // Get only the latest crawled prompts
    let allPrompts = await DataManager.getLatestPrompts();
    
    // Apply content filtering
    allPrompts = filterPrompts(allPrompts);
    
    // Apply search filters
    if (search) {
      const searchLower = search.toLowerCase();
      allPrompts = allPrompts.filter(prompt => 
        prompt.content.toLowerCase().includes(searchLower) ||
        prompt.source.toLowerCase().includes(searchLower)
      );
    }
    
    if (type) {
      allPrompts = allPrompts.filter(prompt => prompt.type === type);
    }
    
    if (source) {
      allPrompts = allPrompts.filter(prompt => 
        prompt.source.toLowerCase().includes(source.toLowerCase())
      );
    }
    
    // Sort by creation date (newest first)
    allPrompts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Pagination
    const total = allPrompts.length;
    const startIndex = (page - 1) * limit;
    const paginatedPrompts = allPrompts.slice(startIndex, startIndex + limit);
    
    const data: PromptListResponse = {
      prompts: paginatedPrompts,
      total,
      page,
      limit,
    };
    
    const response: ApiResponse<PromptListResponse> = {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching all prompts:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, { status: 500 });
  }
}
