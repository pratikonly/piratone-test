import React, { forwardRef, useEffect, useRef, useCallback, useMemo } from 'react';
import { getPlayerUrl, ServerType } from '@/lib/tmdb';

interface VideoPlayerProps {
  id: number;
  type: 'movie' | 'tv' | 'anime';
  season?: number;
  episode?: number;
  isDub?: boolean;
  title?: string;
  poster?: string | null;
  server?: ServerType;
  progressSeconds?: number;
  imdbId?: string;
  onAdBlocked?: (count: number) => void;
}

const VideoPlayer = forwardRef<HTMLIFrameElement, VideoPlayerProps>(
  ({ id, type, season, episode, isDub = false, title, server = 'videasy', progressSeconds, imdbId, onAdBlocked }, ref) => {
    const wrapperRef       = useRef<HTMLDivElement>(null);
    const iframeRef        = useRef<HTMLIFrameElement>(null);
    const adCountRef       = useRef(0);
    const onAdBlockedRef   = useRef(onAdBlocked);
    const lastClickTimeRef = useRef(0);
    const blockUntilRef    = useRef(0);

    const videoKey = useMemo(
      () => `${id}-${type}-${season}-${episode}-${server}-${isDub}-${imdbId ?? ''}`,
      [id, type, season, episode, server, isDub, imdbId]
    );
    const initialProgressRef = useRef<number | null>(null);
    const lastVideoKeyRef    = useRef<string>('');

    if (videoKey !== lastVideoKeyRef.current) {
      initialProgressRef.current = progressSeconds ?? null;
      lastVideoKeyRef.current    = videoKey;
    }

    const playerUrl = useMemo(
      () => getPlayerUrl(id, type, server, season, episode, isDub, initialProgressRef.current ?? undefined, imdbId),
      [id, type, server, season, episode, isDub, imdbId]
    );

    useEffect(() => { onAdBlockedRef.current = onAdBlocked; }, [onAdBlocked]);

    const reportBlock = useCallback(() => {
      adCountRef.current += 1;
      onAdBlockedRef.current?.(adCountRef.current);
    }, []);

    // Override window.open every 50ms — outlasts scripts that try to restore it
    useEffect(() => {
      const kill = () => {
        try { window.open = () => { reportBlock(); return null; }; } catch { /* cross-origin */ }
      };
      kill();
      const interval = setInterval(kill, 50);
      return () => clearInterval(interval);
    }, [reportBlock]);

    // When the iframe first loads, open a 12-second protection window.
    // This covers both the auto-load moment and the player's own "click to play" button.
    const handleIframeLoad = useCallback(() => {
      lastClickTimeRef.current = Date.now();
      blockUntilRef.current    = Date.now() + 12000;
    }, []);

    // Focus-snap: immediately reclaim focus when the iframe steals it.
    // Fires synchronously (no delay) to beat the new tab before it renders.
    useEffect(() => {
      const onBlur = () => {
        if (document.hidden) return;
        const sinceClick = Date.now() - lastClickTimeRef.current;
        const inBlock    = Date.now() < blockUntilRef.current;
        if (sinceClick < 2000 || inBlock) {
          window.focus();
          reportBlock();
          blockUntilRef.current = Date.now() + 2000;
        }
      };

      const onFocusIn = () => {
        if (Date.now() < blockUntilRef.current) window.focus();
      };

      const onVis = () => {
        const sinceClick = Date.now() - lastClickTimeRef.current;
        const inBlock    = Date.now() < blockUntilRef.current;
        if (document.hidden && (sinceClick < 2000 || inBlock)) {
          window.focus();
          reportBlock();
        }
      };

      window.addEventListener('blur', onBlur);
      window.addEventListener('focusin', onFocusIn);
      document.addEventListener('visibilitychange', onVis);
      return () => {
        window.removeEventListener('blur', onBlur);
        window.removeEventListener('focusin', onFocusIn);
        document.removeEventListener('visibilitychange', onVis);
      };
    }, [reportBlock]);

    // Remove ad iframes injected into the page DOM
    useEffect(() => {
      const AD = [
        /doubleclick\.net/i, /googlesyndication/i, /adnxs\.com/i,
        /exoclick/i, /trafficjunky/i, /popads/i, /popcash/i,
        /propellerads/i, /adsterra/i, /juicyads/i, /adsystem/i,
      ];
      const isAd = (src: string) => AD.some(p => p.test(src));
      const observer = new MutationObserver(mutations => {
        for (const m of mutations)
          for (const node of m.addedNodes)
            if (node instanceof HTMLElement && isAd((node as HTMLIFrameElement).src || ''))
              { node.remove(); reportBlock(); }
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
      return () => observer.disconnect();
    }, [reportBlock]);

    // Keep lastClickTimeRef current while mouse moves over the player area
    const handleMouseMove = useCallback(() => {
      lastClickTimeRef.current = Date.now();
    }, []);

    const handleMouseDown = useCallback(() => {
      lastClickTimeRef.current = Date.now();
    }, []);

    const setIframeRef = (el: HTMLIFrameElement | null) => {
      (iframeRef as React.MutableRefObject<HTMLIFrameElement | null>).current = el;
      if (typeof ref === 'function') ref(el);
      else if (ref) (ref as React.MutableRefObject<HTMLIFrameElement | null>).current = el;
    };

    return (
      <div
        ref={wrapperRef}
        className="relative w-full bg-black"
        style={{ paddingBottom: '56.25%', height: 0, borderRadius: '0.5rem' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
      >
        <iframe
          ref={setIframeRef}
          src={playerUrl}
          title={title || 'Video player'}
          className="absolute top-0 left-0 w-full h-full"
          allow="autoplay; encrypted-media; fullscreen *; picture-in-picture"
          allowFullScreen
          onLoad={handleIframeLoad}
          style={{ border: 'none', borderRadius: '0.5rem' }}
        />
      </div>
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';
export default VideoPlayer;
