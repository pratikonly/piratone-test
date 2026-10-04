import { useNavigate } from 'react-router-dom';
import { Play, Clock } from 'lucide-react';
import { getImageUrl } from '@/lib/tmdb';
import { getProgressPercentage, WatchProgressEntry } from '@/lib/watchProgress';

interface ContinueWatchingProps {
  progress: WatchProgressEntry[];
}

const ContinueWatching = ({ progress }: ContinueWatchingProps) => {
  const navigate = useNavigate();

  const handleClick = (item: WatchProgressEntry) => {
    const type = item.media_type === 'anime' ? 'anime' : item.media_type === 'movie' ? 'movie' : 'tv';
    const params: Record<string, string | number> = {};
    if (item.season) params.s = item.season;
    if (item.episode) params.e = item.episode;
    const searchParams = new URLSearchParams(params as Record<string, string>).toString();
    navigate(`/watch/${type}/${item.tmdb_id}${searchParams ? `?${searchParams}` : ''}`);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Play className="w-6 h-6 text-primary" />
          Continue Watching
        </h2>
      </div>

      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {progress.map((item) => {
          const percentage = getProgressPercentage(item);
          return (
            <button
              key={`${item.tmdb_id}-${item.media_type}-${item.season || 'movie'}-${item.episode || 0}`}
              onClick={() => handleClick(item)}
              className="group relative aspect-video bg-zinc-900 rounded-lg overflow-hidden hover:scale-105 transition-transform duration-200 shrink-0 w-[280px] sm:w-[300px] lg:w-[320px] snap-start"
            >
              {/* Poster/Thumbnail */}
              {item.poster_path ? (
                <img
                  src={getImageUrl(item.poster_path, 'w500') || ''}
                  alt={item.title || 'Watch'}
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity"
                />
              ) : (
                <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                  <Play className="w-12 h-12 text-zinc-600" />
                </div>
              )}

              {/* Dark overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg">
                  <Play className="w-6 h-6 text-primary-foreground fill-current ml-1" />
                </div>
              </div>

              {/* Progress bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-700">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${Math.min(100, percentage)}%` }}
                />
              </div>

              {/* Info overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-3 pt-10">
                <p className="text-sm font-semibold text-white text-left truncate mb-1">
                  {item.title}
                </p>
                <div className="flex items-center justify-between text-xs text-zinc-300">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{Math.round(percentage)}%</span>
                  </div>
                  {item.season > 0 && item.episode > 0 && (
                    <span className="text-xs">
                      S{item.season} E{item.episode}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ContinueWatching;