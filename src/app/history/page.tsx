'use client';

import { useEffect, useState } from 'react';
import { DailySelection, ExtendedDailySelection, Prompt, ApiResponse } from '@/types';
import { PromptCard } from '@/components/PromptCard';
import { LoadingCard, LoadingSpinner } from '@/components/Loading';
import { Navigation } from '@/components/Navigation';

interface HistoryEntry extends DailySelection {
  prompt: Prompt;
}

interface ExtendedHistoryEntry extends ExtendedDailySelection {
  prompt: Prompt;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<(HistoryEntry | ExtendedHistoryEntry)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    fetchHistory(1);
  }, []);

  const fetchHistory = async (pageNum: number) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }
      
      const response = await fetch(`/api/prompts/history?page=${pageNum}&limit=20`);
      const data: ApiResponse<{ history: HistoryEntry[], totalPages: number }> = await response.json();
      
      if (data.success && data.data) {
        const newHistory = data.data.history;
        
        if (pageNum === 1) {
          setHistory(newHistory);
        } else {
          setHistory(prev => [...prev, ...newHistory]);
        }
        
        setTotalPages(data.data.totalPages);
        setPage(pageNum);
      } else {
        setError(data.error || 'Failed to fetch history');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (page < totalPages && !loadingMore) {
      fetchHistory(page + 1);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8F4F1', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      {/* Navigation */}
      <Navigation />

      {/* Page Title */}
      <div className="text-center" style={{ paddingTop: '32px', paddingBottom: '24px' }}>
        <h1 className="text-[#272320]" 
            style={{ 
              fontSize: '38px', 
              fontWeight: 650, 
              letterSpacing: '-2%', 
              lineHeight: '1.05',
              textAlign: 'center'
            }}>
          History
        </h1>
      </div>

      {/* Main Content */}
      <div className="mx-auto px-4 py-8" style={{ maxWidth: '816px' }}>

        {loading && (
          <div className="flex flex-col" style={{ gap: '40px', paddingTop: '32px' }}>
            <LoadingCard count={6} />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-400">❌</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error loading history
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => fetchHistory(1)}
                    className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm font-medium transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && history.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-yellow-400">📭</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  No history available
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>No prompts have been selected yet. Check back later or trigger a manual selection.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && history.length > 0 && (
          <div className="flex flex-col" style={{ gap: '40px', paddingTop: '32px' }}>
            {history.map((entry) => {
              // Check if this is an extended history entry with title and description
              const isExtended = 'title' in entry && 'description' in entry;
              
              return (
                <div key={`${entry.date}-${entry.promptId}`} className="flex flex-col" style={{ gap: '12px' }}>
                  {/* Date Label */}
                  <div className="text-center" style={{ 
                    fontSize: '15px', 
                    fontWeight: 410, 
                    lineHeight: '1.33', 
                    color: '#635C57', 
                    opacity: 0.85 
                  }}>
                    {formatDate(entry.date)}
                  </div>
                  {/* Card Container */}
                  <PromptCard 
                    key={`card-${entry.date}-${entry.promptId}`}
                    prompt={entry.prompt} 
                    title={isExtended ? (entry as ExtendedHistoryEntry).title : undefined}
                  />
                </div>
              );
            })}

            {page < totalPages && (
              <div className="text-center" style={{ paddingTop: '32px' }}>
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  {loadingMore ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
