const HISTORY_KEY = 'pirateone_watch_history';

export interface WatchHistoryEntry {
  mediaId: number;
  mediaType: string;
  mediaTitle: string;
  posterPath: string | null;
  season?: number;
  episode?: number;
  watchedAt: string;
}

export const saveWatchHistory = (entry: Omit<WatchHistoryEntry, 'watchedAt'>): void => {
  const history = getWatchHistory();
  
  // Remove existing entry for same media (to move it to top)
  const filtered = history.filter(h => 
    !(h.mediaId === entry.mediaId && h.mediaType === entry.mediaType)
  );
  
  // Add new entry at beginning
  filtered.unshift({ ...entry, watchedAt: new Date().toISOString() });
  
  // Keep only last 50 entries
  const trimmed = filtered.slice(0, 50);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
};

export const getWatchHistory = (): WatchHistoryEntry[] => {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const clearWatchHistory = (): void => {
  localStorage.removeItem(HISTORY_KEY);
};

export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffWeeks === 1) return '1 week ago';
  if (diffWeeks < 4) return `${diffWeeks} weeks ago`;
  return date.toLocaleDateString();
};

export const groupHistoryByTime = (history: WatchHistoryEntry[]): {
  today: WatchHistoryEntry[];
  thisWeek: WatchHistoryEntry[];
  earlier: WatchHistoryEntry[];
} => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);

  return history.reduce(
    (groups, entry) => {
      const watchedAt = new Date(entry.watchedAt);
      if (watchedAt >= todayStart) {
        groups.today.push(entry);
      } else if (watchedAt >= weekStart) {
        groups.thisWeek.push(entry);
      } else {
        groups.earlier.push(entry);
      }
      return groups;
    },
    { today: [] as WatchHistoryEntry[], thisWeek: [] as WatchHistoryEntry[], earlier: [] as WatchHistoryEntry[] }
  );
};
