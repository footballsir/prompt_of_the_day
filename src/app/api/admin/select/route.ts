import { NextResponse } from 'next/server';
import { SchedulerService } from '@/lib/scheduler';
import { ApiResponse } from '@/types';

export async function POST() {
  try {
    const scheduler = SchedulerService.getInstance();
    const result = await scheduler.triggerDailySelection();
    
    const response: ApiResponse = {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error triggering selection:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, { status: 500 });
  }
}
