'use client';

import { useEffect, useState } from 'react';
import { Prompt, ApiResponse } from '@/types';
import { PromptCard } from '@/components/PromptCard';
import { LoadingSpinner } from '@/components/Loading';
import { Navigation } from '@/components/Navigation';

export default function Home() {
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTodayPrompt();
  }, []);

  const fetchTodayPrompt = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/prompt/today');
      const data: ApiResponse<Prompt> = await response.json();
      
      if (data.success) {
        setPrompt(data.data || null);
      } else {
        setError(data.error || 'Failed to fetch today\'s prompt');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error fetching today\'s prompt:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8F4F1', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <div className="mx-auto px-4 py-8" style={{ maxWidth: '816px' }}>
        {/* Title */}
        <div className="text-center" style={{ marginBottom: '40px' }}>
          <h1 className="text-[#272320] mb-4" 
              style={{ 
                fontSize: '38px', 
                fontWeight: 650, 
                letterSpacing: '-2%', 
                lineHeight: '1.05',
                textAlign: 'center'
              }}>
            Studio 8 Prompt of the day
          </h1>
          
          {/* Description */}
          {prompt?.description && (
            <div className="mx-auto" style={{ maxWidth: '640px' }}>
              <p className="text-[#322D29]" 
                 style={{ 
                   fontSize: '17px', 
                   fontWeight: 400, 
                   lineHeight: '1.53',
                   textAlign: 'left',
                   marginTop: '40px'
                 }}>
                {prompt.description}
              </p>
            </div>
          )}
        </div>

        {loading && (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-gray-600">Loading today&apos;s prompt...</span>
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
                  Error loading prompt
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={fetchTodayPrompt}
                    className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm font-medium transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && !prompt && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-yellow-400">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  No prompt available
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>No prompt has been selected for today yet. The system may need to crawl for new content or select a prompt.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {prompt && !loading && (
          <div className="flex flex-col gap-8">
            {/* Main Prompt Card */}
            <PromptCard prompt={prompt} className="w-full" />
          </div>
        )}
      </div>
    </div>
  );
}
