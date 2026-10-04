/**
 * New-release rules for movies on the Watch page.
 *
 * - A movie released 0 to 30 days ago is a "new release": "Server 6" is selected by default.
 * - On the release day itself, the player is replaced by a countdown that hits 00:00:00
 *   at 8:00 PM (the viewer's local time), then the player unlocks.
 */

export const NEW_RELEASE_DAYS = 30;
export const NEW_RELEASE_SERVER_NUMBER = 6;
export const UNLOCK_HOUR_LOCAL = 20; // 8 PM

export interface ReleaseWindow {
  daysSinceRelease: number;
  isReleaseDay: boolean;
  /** When the release-day countdown ends (8 PM local time on the release date) */
  unlockAt: Date;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Returns null when the movie is not a new release (older than 30 days, in the future, or no date). */
export const getReleaseWindow = (releaseDate?: string | null, now: Date = new Date()): ReleaseWindow | null => {
  if (!releaseDate) return null;

  const [year, month, day] = releaseDate.split('-').map(Number);
  if (!year || !month || !day) return null;

  const releaseMidnight = new Date(year, month - 1, day);
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysSinceRelease = Math.round((todayMidnight.getTime() - releaseMidnight.getTime()) / MS_PER_DAY);

  if (daysSinceRelease < 0 || daysSinceRelease > NEW_RELEASE_DAYS) return null;

  return {
    daysSinceRelease,
    isReleaseDay: daysSinceRelease === 0,
    unlockAt: new Date(year, month - 1, day, UNLOCK_HOUR_LOCAL, 0, 0),
  };
};