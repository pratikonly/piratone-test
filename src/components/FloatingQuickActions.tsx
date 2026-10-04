import { useEffect, useRef, useState } from 'react';
import { Bookmark, Boxes, CircleHelp, type LucideIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import sportsMark from '@/assets/sports-icon.svg';

const quickActions: { label: string; to: string; Icon: LucideIcon | null; sportsMark?: boolean }[] = [
  { label: 'Sports', to: '/sports', Icon: null, sportsMark: true },
  { label: 'Watchlist', to: '/watchlist', Icon: Bookmark },
  { label: 'Help', to: '/help', Icon: CircleHelp },
];

const FloatingQuickActions = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (location.pathname === '/auth') return null;

  return (
    <div
      ref={menuRef}
      className="quick-actions-fab fixed bottom-[5.25rem] right-2 z-[70] flex flex-col items-center gap-3 md:bottom-3 md:right-3"
    >
      {isOpen && (
        <nav
          id="floating-quick-actions"
          className="flex flex-col items-center gap-3"
          aria-label="Quick links"
        >
          {quickActions.map(({ label, to, Icon, sportsMark: isSportsMark }, index) => (
            <Link
              key={to}
              to={to}
              aria-label={label}
              title={label}
              onClick={() => setIsOpen(false)}
              style={{ animationDelay: `${(quickActions.length - index - 1) * 45}ms` }}
              className="group relative flex h-12 w-12 animate-in fade-in-0 slide-in-from-bottom-2 items-center justify-center rounded-full border border-white/15 bg-zinc-950/90 text-zinc-100 shadow-[0_8px_28px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-200 hover:scale-110 hover:border-white/35 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 motion-reduce:animate-none"
            >
              {isSportsMark ? (
                <img src={sportsMark} alt="" className="h-5 w-5 brightness-0 invert" aria-hidden="true" />
              ) : (
                Icon && <Icon className="h-5 w-5" aria-hidden="true" />
              )}
              <span className="pointer-events-none absolute right-[calc(100%+0.75rem)] whitespace-nowrap rounded-lg border border-white/10 bg-zinc-950/95 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                {label}
              </span>
            </Link>
          ))}
        </nav>
      )}

      <button
        type="button"
        aria-label={isOpen ? 'Close quick links' : 'Open quick links'}
        aria-expanded={isOpen}
        aria-controls={isOpen ? 'floating-quick-actions' : undefined}
        onClick={() => setIsOpen((open) => !open)}
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-zinc-950/95 text-zinc-300 shadow-[0_8px_28px_rgba(0,0,0,0.58)] transition-all duration-300 hover:scale-105 hover:border-white/35 hover:bg-white hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80',
          isOpen && 'rotate-90 bg-white text-zinc-950'
        )}
      >
        <Boxes className="h-6 w-6" strokeWidth={2.2} aria-hidden="true" />
      </button>
    </div>
  );
};

export default FloatingQuickActions;