import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film } from 'lucide-react';
import { getCollectionDetails, getImageUrl, CollectionDetails, Movie } from '@/lib/tmdb';

interface CollectionInfoProps {
  collectionId: number;
  currentMovieId: number;
}

const CollectionInfo = ({ collectionId, currentMovieId }: CollectionInfoProps) => {
  const navigate = useNavigate();
  const [collection, setCollection] = useState<CollectionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        const data = await getCollectionDetails(collectionId);
        data.parts.sort((a, b) => {
          const dateA = a.release_date || '';
          const dateB = b.release_date || '';
          return dateA.localeCompare(dateB);
        });
        setCollection(data);
      } catch (error) {
        console.error('Failed to fetch collection:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCollection();
  }, [collectionId]);

  if (isLoading) {
    return (
      <div className="h-full bg-card/50 rounded-lg p-3 border border-border/50 animate-pulse">
        <div className="h-4 w-36 bg-muted rounded mb-3" />
          <div
            className="grid justify-start gap-1.5"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(42px, 56px))' }}
          >
          {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="w-full aspect-[2/3] bg-muted rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!collection || collection.parts.length <= 1) return null;

  return (
    <div className="bg-white/5 rounded-lg p-3 border border-border/50">
      <div className="flex items-center gap-1.5 mb-2">
        <Film className="w-3.5 h-3.5 text-primary flex-shrink-0" />
        <h3 className="text-xs font-semibold truncate">
          Part of <span className="text-primary">{collection.name}</span>
        </h3>
      </div>

      <div
        className="grid justify-start gap-1.5"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(42px, 56px))' }}
      >
        {collection.parts.map((movie: Movie) => {
          const isCurrentMovie = movie.id === currentMovieId;
          const posterUrl = getImageUrl(movie.poster_path, 'w200');

          return (
            <button
              key={movie.id}
              onClick={() => !isCurrentMovie && navigate(`/watch/movie/${movie.id}`)}
              disabled={isCurrentMovie}
              className={`group min-w-0 transition-all ${isCurrentMovie ? 'cursor-default' : 'hover:scale-105'}`}
            >
              <div className={`relative w-full rounded overflow-hidden border ${
                isCurrentMovie ? 'border-primary ring-1 ring-primary/30' : 'border-transparent hover:border-primary/40'
              }`}>
                {posterUrl ? (
                  <img
                    src={posterUrl}
                    alt={movie.title || 'Movie poster'}
                    className="w-full aspect-[2/3] object-cover"
                  />
                ) : (
                  <div className="w-full aspect-[2/3] bg-muted flex items-center justify-center">
                    <Film className="w-3 h-3 text-muted-foreground" />
                  </div>
                )}
                {isCurrentMovie && (
                  <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                    <span className="bg-primary text-primary-foreground text-[8px] px-1 py-0.5 rounded font-medium">
                      Playing
                    </span>
                  </div>
                )}
              </div>
              <p className={`mt-0.5 text-[9px] font-medium truncate text-center ${
                isCurrentMovie ? 'text-primary' : 'text-muted-foreground'
              }`}>
                {movie.title}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CollectionInfo;
