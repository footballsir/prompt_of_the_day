'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navigation() {
  const pathname = usePathname();

  const getButtonClass = (href: string, isHome: boolean = false) => {
    const baseClass = "px-2 py-0 border border-black/8 rounded-[12px] text-[15px] font-normal leading-[1.33] text-[#272320] transition-colors flex items-center justify-center";
    
    // Home button never shows selected state
    if (isHome) {
      return `${baseClass} bg-transparent hover:bg-black/5`;
    }
    
    // If selected, don't show hover state
    return pathname === href 
      ? `${baseClass} bg-black/[0.03]`
      : `${baseClass} bg-transparent hover:bg-black/5`;
  };

  return (
    <div className="w-full" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      <div className="mx-auto px-4 py-5" style={{ maxWidth: '1080px' }}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className={getButtonClass('/', true)}
              style={{ fontWeight: 410, padding: '0 12px', height: '40px' }}
            >
              Home
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className={getButtonClass('/')}
              style={{ fontWeight: 410, padding: '0 12px', height: '40px' }}
            >
              Today
            </Link>
            <Link
              href="/history"
              className={getButtonClass('/history')}
              style={{ fontWeight: 410, padding: '0 12px', height: '40px' }}
            >
              History
            </Link>
            <Link
              href="/all"
              className={getButtonClass('/all')}
              style={{ fontWeight: 410, padding: '0 12px', height: '40px' }}
            >
              Gallery
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
