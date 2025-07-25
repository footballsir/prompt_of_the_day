'use client';

import { useEffect, useState } from 'react';
import { Prompt, ApiResponse } from '@/types';
import { PromptCard } from '@/components/PromptCard';
import { LoadingSpinner } from '@/components/Loading';

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

  const getTodayDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Prompt of the Day
          </h1>
          <p className="text-lg text-gray-600">
            {getTodayDate()}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Your daily dose of creative inspiration
          </p>
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
          <div className="space-y-6">
            <PromptCard prompt={prompt} className="max-w-2xl mx-auto" />
            
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-4">
                Enjoyed today&apos;s prompt? Check out more!
              </p>
              <div className="space-x-4">
                <a
                  href="/history"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  📚 View History
                </a>
                <a
                  href="/all"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  🔍 Browse All Prompts
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
