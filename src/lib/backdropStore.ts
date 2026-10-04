let backdropUrl: string | null = null;
const listeners = new Set<() => void>();

export const getBackdropUrlValue = () => backdropUrl;

export const setBackdropUrlValue = (url: string | null) => {
  if (url === backdropUrl) return;
  backdropUrl = url;
  listeners.forEach((l) => l());
};

export const subscribeBackdropUrl = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
