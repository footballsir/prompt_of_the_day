import { Prompt } from '@/types';
import Image from 'next/image';
import { useState } from 'react';

interface PromptCardProps {
  prompt: Prompt;
  className?: string;
  title?: string;
}

export function PromptCard({ prompt, className = '', title }: PromptCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get display name for source
  const getSourceDisplayName = (source: string | undefined) => {
    if (!source) return 'Unknown';
    
    if (source.includes('Microsoft') || source.includes('Copilot')) {
      return 'Copilot';
    } else if (source.includes('PromptHero')) {
      return 'PromptHero';
    } else if (source.includes('Anthropic')) {
      return 'Anthropic';
    }
    return 'Unknown';
  };

  const hasMedia = prompt.mediaUrl && prompt.mediaUrl.trim() !== '';
  
  // Get static image for sources without media
  const getStaticImage = () => {
    if (hasMedia || !prompt.source) return null;
    
    if (prompt.source.includes('Microsoft') || prompt.source.includes('Copilot')) {
      return '/images/copilot-card.png';
    } else if (prompt.source.includes('Anthropic')) {
      return '/images/anthropic-card.png';
    }
    return null;
  };

  const staticImageSrc = getStaticImage();
  const shouldShowImageLayout = hasMedia || staticImageSrc;

  // Image Card Layout (when media is present or static image available)
  if (shouldShowImageLayout) {
    return (
      <div className={`bg-white/80 rounded-[60px] border-[0.5px] border-black/12 shadow-[0px_1px_1px_0px_rgba(0,0,0,0.08)] hover:shadow-md transition-shadow ${className}`}
           style={{ 
             fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
             borderRadius: '60px',
             WebkitBorderRadius: '60px',
             MozBorderRadius: '60px',
             borderTopLeftRadius: '60px',
             borderTopRightRadius: '60px',
             borderBottomLeftRadius: '60px',
             borderBottomRightRadius: '60px'
           }}>
        <div className="flex items-stretch gap-4 p-3">
          {/* Media Section */}
          <div className="flex-shrink-0">
            <div className="w-80 h-64 rounded-[48px_32px_32px_48px] overflow-hidden bg-gray-100">
              {hasMedia ? (
                (prompt.mediaUrl && (prompt.mediaUrl.toLowerCase().includes('.mp4') || prompt.mediaUrl.toLowerCase().includes('video'))) ? (
                  <video
                    src={prompt.mediaUrl}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                    onError={(e) => {
                      // Fallback to a placeholder image on error
                      const videoElement = e.target as HTMLVideoElement;
                      const fallbackImg = document.createElement('img');
                      fallbackImg.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjI1NiIgdmlld0JveD0iMCAwIDMyMCAyNTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMjU2IiBmaWxsPSIjRjNGNEY2Ii8+PHRleHQgeD0iMTYwIiB5PSIxMzAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5OTk5OTkiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCI+VmlkZW8gVW5hdmFpbGFibGU8L3RleHQ+PC9zdmc+';
                      fallbackImg.className = 'w-full h-full object-cover';
                      fallbackImg.alt = prompt.title || 'Video unavailable';
                      videoElement.parentNode?.replaceChild(fallbackImg, videoElement);
                    }}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <img
                    src={prompt.mediaUrl}
                    alt={prompt.title || 'Prompt media'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjI1NiIgdmlld0JveD0iMCAwIDMyMCAyNTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMjU2IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNjAgMTI4QzE2MCAyMDEuNzMgMTAxLjQ5NiAyNjEgMjggMjYxUzExIDIwMS43MyAxMSAxMjhTNjkuNTA0IDExNSAxNDMgMTE1UzE2MCA1NC4yNyAxNjAgMTI4WiIgZmlsbD0iI0U1RTdFQiIvPgo8L3N2Zz4K';
                    }}
                  />
                )
              ) : staticImageSrc ? (
                <Image
                  src={staticImageSrc}
                  alt={`${prompt.source || 'Unknown'} prompt card`}
                  width={320}
                  height={256}
                  className="w-full h-full object-cover"
                  priority={false}
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <div className="text-2xl mb-2">📄</div>
                    <div className="text-sm">No media available</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Text & Actions */}
          <div className="flex-1 flex flex-col justify-center gap-6 py-4 pr-4 pl-2">
            {/* Text Content */}
            <div className="flex flex-col gap-2">
              {/* Badges */}
              <div className="flex gap-2 flex-wrap">
                <span className="px-1 py-0.5 rounded bg-[#E09E66]/30 text-[#6B3900] text-[10px] leading-[1.4] text-center"
                      style={{ height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500 }}>
                  Model: {prompt.model || 'ChatGPT'}
                </span>
                <span className="px-1 py-0.5 rounded bg-[#E09E66]/30 text-[#6B3900] text-[10px] leading-[1.4] text-center"
                      style={{ height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500 }}>
                  From: {getSourceDisplayName(prompt.source)}
                </span>
                <span className="px-1 py-0.5 rounded bg-[#E09E66]/30 text-[#6B3900] text-[10px] leading-[1.4] text-center"
                      style={{ height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500 }}>
                  Type: {prompt.type === 'text' ? 'Text' : prompt.type === 'image' ? 'Image' : prompt.type === 'video' ? 'Video' : 'Text'}
                </span>
              </div>

              {/* Title */}
              {(prompt.title && prompt.title.trim() !== '' && prompt.title !== 'Untitled' || title && title.trim() !== '' && title !== 'Untitled') && (
                <div className="flex items-center gap-1">
                  <h3 className="text-2xl font-medium leading-[1.29] tracking-[-0.01em] text-[#272320] line-clamp-2"
                      style={{ fontSize: '24px', fontWeight: 500, lineHeight: '1.29', letterSpacing: '-1%' }}>
                    {prompt.title || title}
                  </h3>
                </div>
              )}

              {/* Content */}
              <div className="text-[15px] font-normal leading-[1.33] text-[#272320]" style={{ fontWeight: 410 }}>
                {isExpanded ? (
                  <div>
                    {prompt.content && prompt.content.length > 200 ? (
                      <p>
                        {prompt.content || 'No content available'}{' '}
                        <button
                          onClick={() => setIsExpanded(false)}
                          className="text-blue-600 hover:text-blue-800 text-sm transition-colors inline whitespace-nowrap"
                        >
                          Show less
                        </button>
                      </p>
                    ) : (
                      <p>{prompt.content || 'No content available'}</p>
                    )}
                  </div>
                ) : (
                  <div>
                    {prompt.content && prompt.content.length > 200 ? (
                      <p>
                        {(() => {
                          // Find a good break point that leaves space for "... Show more"
                          const maxLength = 180; // Reduced to leave space for button
                          let truncated = prompt.content.substring(0, maxLength);
                          
                          // Try to break at word boundary
                          const lastSpace = truncated.lastIndexOf(' ');
                          if (lastSpace > maxLength * 0.8) { // If space is reasonably close to end
                            truncated = truncated.substring(0, lastSpace);
                          }
                          
                          return truncated;
                        })()}...{' '}
                        <button
                          onClick={() => setIsExpanded(true)}
                          className="text-blue-600 hover:text-blue-800 text-sm transition-colors inline whitespace-nowrap"
                        >
                          Show more
                        </button>
                      </p>
                    ) : (
                      <p>{prompt.content || 'No content available'}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Source Button */}
            <div className="flex items-center">
              {prompt.url ? (
                <a
                  href={prompt.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-0 bg-transparent border border-black/8 rounded-[12px] text-[15px] font-normal leading-[1.33] text-[#272320] hover:bg-black/5 transition-colors flex items-center justify-center"
                  style={{ fontWeight: 410, padding: '0 12px', height: '40px' }}
                >
                  Source
                </a>
              ) : (
                <span
                  className="px-2 py-0 bg-gray-100 border border-gray-200 rounded-[12px] text-[15px] font-normal leading-[1.33] text-gray-400 flex items-center justify-center cursor-not-allowed"
                  style={{ fontWeight: 410, padding: '0 12px', height: '40px' }}
                >
                  No Source
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Text Card Layout (when no media) - Fixed height 320px as per Figma
  return (
    <div className={`bg-white/80 card-100-smooth border-[0.5px] border-black/12 shadow-[0px_1px_1px_0px_rgba(0,0,0,0.08)] hover:shadow-md transition-shadow ${className}`}
         style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', height: '320px' }}>
      <div className="flex items-stretch h-full">
        {/* Text & Actions - Full Width */}
        <div className="flex-1 flex flex-col justify-center gap-6 p-7">
          {/* Text Content */}
          <div className="flex flex-col gap-2">
            {/* Badges */}
            <div className="flex gap-2 flex-wrap">
              <span className="px-1 py-0.5 rounded bg-[#E09E66]/30 text-[#6B3900] text-[10px] leading-[1.4] text-center"
                    style={{ height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500 }}>
                Model: {prompt.model || 'ChatGPT'}
              </span>
              <span className="px-1 py-0.5 rounded bg-[#E09E66]/30 text-[#6B3900] text-[10px] leading-[1.4] text-center"
                    style={{ height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500 }}>
                From: {getSourceDisplayName(prompt.source)}
              </span>
              <span className="px-1 py-0.5 rounded bg-[#E09E66]/30 text-[#6B3900] text-[10px] leading-[1.4] text-center"
                    style={{ height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500 }}>
                Type: {prompt.type === 'text' ? 'Text' : prompt.type === 'image' ? 'Image' : prompt.type === 'video' ? 'Video' : 'Text'}
              </span>
            </div>

            {/* Title */}
            {(prompt.title || title) && (
              <div className="flex items-center gap-1">
                <h3 className="text-2xl font-medium leading-[1.29] tracking-[-0.01em] text-[#272320] line-clamp-2"
                    style={{ fontSize: '24px', fontWeight: 500, lineHeight: '1.29', letterSpacing: '-1%' }}>
                  {prompt.title || title}
                </h3>
              </div>
            )}

            {/* Content */}
            <div className="text-[15px] font-normal leading-[1.33] text-[#272320]" style={{ fontWeight: 410 }}>
              {isExpanded ? (
                <div>
                  <p>{prompt.content}</p>
                  {prompt.content && prompt.content.length > 300 && (
                    <button
                      onClick={() => setIsExpanded(false)}
                      className="text-blue-600 hover:text-blue-800 text-sm ml-1 transition-colors"
                    >
                      Show less
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  <p className="line-clamp-6">
                    {prompt.content}
                    {prompt.content && prompt.content.length > 300 && (
                      <button
                        onClick={() => setIsExpanded(true)}
                        className="text-blue-600 hover:text-blue-800 text-sm ml-1 transition-colors inline"
                      >
                        Show more
                      </button>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Source Button */}
          <div className="flex items-center">
            <a
              href={prompt.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-0 bg-transparent border border-black/8 rounded-[12px] text-[15px] font-normal leading-[1.33] text-[#272320] hover:bg-black/5 transition-colors flex items-center justify-center"
              style={{ fontWeight: 410, padding: '0 12px', height: '40px' }}
            >
              Source
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
