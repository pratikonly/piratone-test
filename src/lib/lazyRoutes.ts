export const lazyRouteLoaders = {
  watch: () => import('@/pages/Watch'),
  watchlist: () => import('@/pages/Watchlist'),
  settings: () => import('@/pages/Settings'),
  help: () => import('@/pages/Help'),
  live: () => import('@/pages/Live'),
  sports: () => import('@/pages/Sports'),
  serverStatus: () => import('@/pages/ServerStatus'),
  notFound: () => import('@/pages/NotFound'),
};

type LazyRouteName = keyof typeof lazyRouteLoaders;

const getLazyRouteName = (pathname: string): LazyRouteName | null => {
  if (pathname.startsWith('/watch/')) return 'watch';
  if (pathname === '/watchlist' || pathname.startsWith('/watchlist/')) return 'watchlist';
  if (pathname === '/settings' || pathname.startsWith('/settings/')) return 'settings';
  if (pathname === '/help' || pathname.startsWith('/help/')) return 'help';
  if (pathname === '/live' || pathname.startsWith('/live/')) return 'live';
  if (pathname === '/sports' || pathname.startsWith('/sports/')) return 'sports';
  if (pathname === '/server' || pathname.startsWith('/server/')) return 'serverStatus';

  const isStaticRoute = [
    '/',
    '/movies',
    '/series',
    '/anime',
    '/search',
    '/auth',
    '/reset-password',
  ].includes(pathname);

  return isStaticRoute ? null : 'notFound';
};

export const preloadLazyRoute = (pathname: string): Promise<void> => {
  const routeName = getLazyRouteName(pathname);
  if (!routeName) return Promise.resolve();
  return lazyRouteLoaders[routeName]().then(() => undefined);
};

export const preloadAllLazyRoutes = async () => {
  await Promise.all(
    Object.entries(lazyRouteLoaders).map(async ([routeName, load]) => {
      try {
        await load();
      } catch (error) {
        console.warn(`Could not prefetch the ${routeName} route`, error);
      }
    }),
  );
};