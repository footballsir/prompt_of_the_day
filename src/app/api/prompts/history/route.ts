import { NextResponse } from 'next/server';
import { DataManager } from '@/lib/dataManager';
import { filterPrompts } from '@/lib/contentFilter';
import { ApiResponse, DailySelection, ExtendedDailySelection } from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Get history
    const history: (DailySelection | ExtendedDailySelection)[] = await DataManager.loadHistory();
    
    // Check if history entries have full prompt data (new format) or just references (old format)
    let resolvedHistory;
    
    if (history.length > 0 && 'content' in history[0]) {
      // New format: history entries contain full prompt data
      const extendedHistory = history as ExtendedDailySelection[];
      resolvedHistory = extendedHistory.map(entry => ({
        date: entry.date,
        promptId: entry.promptId,
        selectedAt: entry.selectedAt,
        prompt: {
          id: entry.promptId,
          content: entry.content,
          title: entry.title,
          source: entry.source,
          url: entry.url || '',
          type: entry.category === 'image' ? 'image' as const : entry.category === 'video' ? 'video' as const : 'text' as const,
          model: entry.model || '',
          mediaUrl: entry.mediaUrl || '',
          createdAt: entry.selectedAt
        }
      }));
    } else {
      // Old format: need to resolve prompt references
      const oldHistory = history as DailySelection[];
      const allPrompts = await DataManager.getAllPrompts();
      const safePrompts = filterPrompts(allPrompts);
      const promptMap = new Map(safePrompts.map(p => [p.id, p]));
      
      resolvedHistory = oldHistory
        .map(entry => ({
          ...entry,
          prompt: promptMap.get(entry.promptId),
        }))
        .filter(entry => entry.prompt); // Filter out entries where prompt is not found or filtered
    }
    
    // Sort by date descending
    resolvedHistory = resolvedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Pagination
    const total = resolvedHistory.length;
    const startIndex = (page - 1) * limit;
    const paginatedHistory = resolvedHistory.slice(startIndex, startIndex + limit);
    
    const response: ApiResponse = {
      success: true,
      data: {
        history: paginatedHistory,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching prompt history:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, { status: 500 });
  }
}
