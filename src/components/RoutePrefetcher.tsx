import { useEffect } from 'react';
import { preloadAllLazyRoutes, preloadLazyRoute } from '@/lib/lazyRoutes';

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

const RoutePrefetcher = () => {
  useEffect(() => {
    const prefetchedPaths = new Set<string>();
    const idleWindow = window as IdleWindow;

    const prefetchAnchorRoute = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement)) return;

      const url = new URL(anchor.href, window.location.origin);
      if (url.origin !== window.location.origin || prefetchedPaths.has(url.pathname)) return;

      prefetchedPaths.add(url.pathname);
      void preloadLazyRoute(url.pathname).catch((error) => {
        prefetchedPaths.delete(url.pathname);
        console.warn(`Could not prefetch route ${url.pathname}`, error);
      });
    };

    document.addEventListener('pointerover', prefetchAnchorRoute, true);
    document.addEventListener('focusin', prefetchAnchorRoute, true);
    document.addEventListener('touchstart', prefetchAnchorRoute, { capture: true, passive: true });

    const prefetchDuringIdle = () => {
      void preloadAllLazyRoutes();
    };

    const idleHandle = idleWindow.requestIdleCallback?.(prefetchDuringIdle, { timeout: 2000 });
    const timeoutHandle = idleHandle === undefined
      ? window.setTimeout(prefetchDuringIdle, 1200)
      : undefined;

    return () => {
      document.removeEventListener('pointerover', prefetchAnchorRoute, true);
      document.removeEventListener('focusin', prefetchAnchorRoute, true);
      document.removeEventListener('touchstart', prefetchAnchorRoute, true);
      if (idleHandle !== undefined) idleWindow.cancelIdleCallback?.(idleHandle);
      if (timeoutHandle !== undefined) window.clearTimeout(timeoutHandle);
    };
  }, []);

  return null;
};

export default RoutePrefetcher;