import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Movie, getMovieRecommendations, getTVRecommendations, getSimilarMovies, getSimilarTV, getImageUrl } from '@/lib/tmdb';
import { Star, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecommendedContentProps {
  mediaId: number;
  mediaType: 'movie' | 'tv';
  openInNewTab?: boolean;
}

const RecommendedContent = ({ mediaId, mediaType, openInNewTab }: RecommendedContentProps) => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [similar, setSimilar] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'recommended' | 'similar'>('recommended');

  useEffect(() => {
    const fetchContent = async () => {
      setIsLoading(true);
      try {
        const [recData, simData] = await Promise.all([
          mediaType === 'movie' 
            ? getMovieRecommendations(mediaId)
            : getTVRecommendations(mediaId),
          mediaType === 'movie'
            ? getSimilarMovies(mediaId)
            : getSimilarTV(mediaId),
        ]);
        setRecommendations(recData);
        setSimilar(simData);
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [mediaId, mediaType]);

  const getUrl = (item: Movie) => `/watch/${item.media_type || mediaType}/${item.id}`;

  const handleClick = (e: React.MouseEvent, item: Movie) => {
    if (openInNewTab) return; // let the anchor handle it natively
    e.preventDefault();
    navigate(getUrl(item));
  };


  const currentList = activeTab === 'recommended' ? recommendations : similar;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0 && similar.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <h2 className="font-display text-2xl">More Like This</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('recommended')}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              activeTab === 'recommended'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            Recommended
          </button>
          <button
            onClick={() => setActiveTab('similar')}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              activeTab === 'similar'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            Similar
          </button>
        </div>
      </div>

      {currentList.length === 0 ? (
        <p className="text-muted-foreground">No {activeTab} content found.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {currentList.slice(0, 12).map((item) => {
            const posterUrl = getImageUrl(item.poster_path, 'w300');
            const title = item.title || item.name || 'Untitled';
            const rating = item.vote_average?.toFixed(1);

            return (
              <a
                key={item.id}
                href={getUrl(item)}
                target={openInNewTab ? '_blank' : undefined}
                rel={openInNewTab ? 'noopener noreferrer' : undefined}
                onClick={(e) => handleClick(e, item)}
                className="group relative cursor-pointer block"
              >

                <div className="aspect-[2/3] rounded-lg overflow-hidden bg-muted">
                  {posterUrl ? (
                    <img
                      src={posterUrl}
                      alt={title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      No Image
                    </div>
                  )}
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center">
                        <Play className="w-5 h-5 text-primary-foreground fill-primary-foreground" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-2">
                  <h3 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
                    {title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-primary fill-primary" />
                        <span className="text-xs text-muted-foreground">{rating}</span>
                      </div>
                    )}
                    <span className="text-xs text-muted-foreground uppercase">
                      {item.media_type || mediaType}
                    </span>
                  </div>
                </div>
              </a>

            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecommendedContent;
