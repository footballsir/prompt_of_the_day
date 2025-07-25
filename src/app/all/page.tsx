'use client';

import { useEffect, useState } from 'react';
import { Prompt, ApiResponse, PromptListResponse } from '@/types';
import { PromptCard } from '@/components/PromptCard';
import { LoadingCard, LoadingSpinner } from '@/components/Loading';
import { Navigation } from '@/components/Navigation';

export default function AllPromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Filters
  const [typeFilter, setTypeFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');

  useEffect(() => {
    fetchPrompts(1, true);
  }, [typeFilter, sourceFilter]);

  const fetchPrompts = async (pageNum: number, reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }
      
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '30',
      });
      
      if (typeFilter) params.append('type', typeFilter);
      if (sourceFilter) params.append('source', sourceFilter);
      
      const response = await fetch(`/api/prompts/all?${params}`);
      const data: ApiResponse<PromptListResponse> = await response.json();
      
      if (data.success) {
        const newPrompts = data.data?.prompts || [];
        
        if (reset) {
          setPrompts(newPrompts);
        } else {
          setPrompts(prev => [...prev, ...newPrompts]);
        }
        
        setTotal(data.data?.total || 0);
        setPage(pageNum);
      } else {
        setError(data.error || 'Failed to fetch prompts');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error fetching prompts:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    const hasMore = prompts.length < total;
    if (hasMore && !loadingMore) {
      fetchPrompts(page + 1);
    }
  };

  const handleFilterChange = (filterType: 'type' | 'source', value: string) => {
    if (filterType === 'type') {
      setTypeFilter(value);
    } else {
      setSourceFilter(value);
    }
    setPage(1);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8F4F1', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <div className="mx-auto px-4 py-8" style={{ maxWidth: '816px' }}>
        {/* Title */}
        <div className="text-center mb-16">
          <h1 className="text-[#272320] mb-4" 
              style={{ 
                fontSize: '38px', 
                fontWeight: 650, 
                letterSpacing: '-2%', 
                lineHeight: '1.05',
                textAlign: 'center'
              }}>
            Browse All Prompts
          </h1>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-8" style={{ justifyContent: 'center' }}>
          {/* Source Filter */}
          <div className="border border-white rounded-2xl" 
               style={{ 
                 padding: '8px',
                 width: '360px',
                 background: '#FFFFFF',
                 borderRadius: '16px',
                 height: '56px'
               }}>
            <div className="relative h-full" 
                 style={{ padding: '0 4px', borderRadius: '12px' }}>
              <div className="flex items-center justify-between h-full" 
                   style={{ padding: '0 8px' }}>
                <div className="flex items-center" style={{ flex: 1 }}>
                  <span className="text-[#14110E]" 
                        style={{ 
                          fontFamily: 'Ginto Copilot Variable, Inter, system-ui, -apple-system, sans-serif',
                          fontSize: '15px', 
                          fontWeight: 410, 
                          lineHeight: '1.33',
                          textAlign: 'left'
                        }}>
                    Source
                  </span>
                </div>
                <div>
                  <span className="text-[#635C57]" 
                        style={{ 
                          fontFamily: 'Ginto Copilot Variable, Inter, system-ui, -apple-system, sans-serif',
                          fontSize: '10px', 
                          fontWeight: 600, 
                          lineHeight: '1.4',
                          textTransform: 'uppercase',
                          textAlign: 'right'
                        }}>
                    {sourceFilter === 'Microsoft' ? 'MICROSOFT' : 
                     sourceFilter === 'PromptHero' ? 'PROMPTHERO' :
                     sourceFilter === 'Anthropic' ? 'ANTHROPIC' : 'ALL'}
                  </span>
                </div>
              </div>
              <select
                value={sourceFilter}
                onChange={(e) => handleFilterChange('source', e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              >
                <option value="">All Sources</option>
                <option value="Microsoft">Microsoft Copilot</option>
                <option value="PromptHero">PromptHero</option>
                <option value="Anthropic">Anthropic</option>
              </select>
            </div>
          </div>

          {/* Type Filter */}
          <div className="border border-white rounded-2xl" 
               style={{ 
                 padding: '8px',
                 width: '360px',
                 background: '#FFFFFF',
                 borderRadius: '16px',
                 height: '56px'
               }}>
            <div className="relative h-full" 
                 style={{ padding: '0 4px', borderRadius: '12px' }}>
              <div className="flex items-center justify-between h-full" 
                   style={{ padding: '0 8px' }}>
                <div className="flex items-center" style={{ flex: 1 }}>
                  <span className="text-[#14110E]" 
                        style={{ 
                          fontFamily: 'Ginto Copilot Variable, Inter, system-ui, -apple-system, sans-serif',
                          fontSize: '15px', 
                          fontWeight: 410, 
                          lineHeight: '1.33',
                          textAlign: 'left'
                        }}>
                    Type
                  </span>
                </div>
                <div>
                  <span className="text-[#635C57]" 
                        style={{ 
                          fontFamily: 'Ginto Copilot Variable, Inter, system-ui, -apple-system, sans-serif',
                          fontSize: '10px', 
                          fontWeight: 600, 
                          lineHeight: '1.4',
                          textTransform: 'uppercase',
                          textAlign: 'right'
                        }}>
                    {typeFilter === 'text' ? 'TEXT' : 
                     typeFilter === 'image' ? 'IMAGE' :
                     typeFilter === 'video' ? 'VIDEO' : 'ALL'}
                  </span>
                </div>
              </div>
              <select
                value={typeFilter}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              >
                <option value="">All Types</option>
                <option value="text">Text</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filter Status */}
        {(typeFilter || sourceFilter) && (
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-4">
              <p className="text-sm text-[#635C57]" style={{ fontSize: '15px', fontWeight: 410 }}>
                Showing {prompts.length} of {total} prompts
              </p>
              <button
                onClick={() => {
                  setTypeFilter('');
                  setSourceFilter('');
                }}
                className="px-3 py-1 bg-transparent border border-black/8 rounded-lg text-[#272320] hover:bg-black/5 transition-colors"
                style={{ fontSize: '13px', fontWeight: 410 }}
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex flex-col gap-8">
            <LoadingCard count={9} />
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
                  Error loading prompts
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => fetchPrompts(1, true)}
                    className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm font-medium transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && prompts.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-yellow-400">🔍</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  No prompts found
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>No prompts match your current filters. Try adjusting your search criteria.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && prompts.length > 0 && (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-8">
              {prompts.map((prompt) => (
                <PromptCard key={prompt.id} prompt={prompt} />
              ))}
            </div>

            {prompts.length < total && (
              <div className="text-center pt-8">
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
