import { NextResponse } from 'next/server';
import { SchedulerService } from '@/lib/scheduler';
import { ApiResponse } from '@/types';

export async function GET() {
  try {
    const scheduler = SchedulerService.getInstance();
    const status = scheduler.getStatus();
    
    const response: ApiResponse = {
      success: true,
      data: status,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting status:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, { status: 500 });
  }
}
