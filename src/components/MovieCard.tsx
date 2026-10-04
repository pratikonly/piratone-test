import { useState, useRef, useEffect } from 'react';
import { Play, Plus, Check, Star, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Movie, getImageUrl, getBackdropUrl } from '@/lib/tmdb';
import { isInWatchlist, addToWatchlist, removeFromWatchlist } from '@/lib/watchlist';
import { addToWatchlistDb, isInWatchlistDb, removeFromWatchlistDb } from '@/lib/watchlistDb';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from './ui/hover-card';

// Cards already shown once skip their entrance animation on later visits (smoother page changes)
const seenCards = new Set<string>();

// Anime is saved to the account watchlist when possible, and falls back to this device's list
const addToList = async (item: Movie, signedIn: boolean) => {
  if (signedIn) {
    try {
      await addToWatchlistDb(item);
      return;
    } catch (error) {
      if (item.media_type !== 'anime') throw error;
    }
  }
  addToWatchlist(item);
};

const removeFromList = async (id: number, type: 'movie' | 'tv' | 'anime', signedIn: boolean) => {
  if (signedIn) {
    try {
      await removeFromWatchlistDb(id, type as 'movie' | 'tv');
    } catch (error) {
      if (type !== 'anime') throw error;
    }
  }
  if (!signedIn || type === 'anime') removeFromWatchlist(id, type as 'movie' | 'tv');
};

interface MovieCardProps {
  movie: Movie;
  index?: number;
  className?: string;
  animateFromBelow?: boolean;
}

const MovieCard = ({ movie, index = 0, className, animateFromBelow = false }: MovieCardProps) => {
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [inWatchlist, setInWatchlist] = useState(false);
  const cardKey = `${movie.media_type || 'movie'}-${movie.id}`;
  const alreadySeen = useRef(seenCards.has(cardKey)).current;
  const [imageLoaded, setImageLoaded] = useState(alreadySeen);
  const [popupSide, setPopupSide] = useState<'left' | 'right'>('right');
  
  const title = movie.title || movie.name || 'Untitled';
  const posterUrl = getImageUrl(movie.poster_path, 'w300');
  const backdropUrl = getBackdropUrl(movie.backdrop_path, 'w780');
  const rating = movie.vote_average?.toFixed(1) || 'N/A';
  const year = (movie.release_date || movie.first_air_date)?.split('-')[0] || '';
  const releaseDate = movie.release_date || movie.first_air_date || '';
  const mediaType = movie.media_type || 'movie';
  const wlType = mediaType as 'movie' | 'tv';
  const mediaLabel = mediaType === 'tv' ? 'TV' : mediaType === 'anime' ? 'Anime' : 'Movie';
  const mediaLabelLong = mediaType === 'tv' ? 'TV Series' : mediaType === 'anime' ? 'Anime' : 'Movie';
  const overview = movie.overview || 'No description available.';

  useEffect(() => {
    seenCards.add(cardKey);
  }, [cardKey]);

  useEffect(() => {
    const loadWatchlistState = async () => {
      if (user) {
        let inList = false;
        try {
          inList = await isInWatchlistDb(movie.id, wlType);
        } catch {
          inList = false;
        }
        setInWatchlist(inList || (mediaType === 'anime' && isInWatchlist(movie.id, wlType)));
        return;
      }
      setInWatchlist(isInWatchlist(movie.id, wlType));
    };

    loadWatchlistState();
  }, [movie.id, mediaType, user]);

  // Determine popup side based on card position
  const updatePopupSide = () => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const cardCenter = rect.left + rect.width / 2;
      const screenCenter = window.innerWidth / 2;
      setPopupSide(cardCenter < screenCenter ? 'right' : 'left');
    }
  };

  const handleWatchlistToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (inWatchlist) {
      await removeFromList(movie.id, mediaType, Boolean(user));
      setInWatchlist(false);
      return;
    }

    await addToList({ ...movie, media_type: mediaType }, Boolean(user));
    setInWatchlist(true);
  };

  const handlePlay = () => {
    navigate(`/watch/${mediaType}/${movie.id}`, { state: { cardTitle: title } });
  };

  return (
    <HoverCard openDelay={500} closeDelay={150} onOpenChange={(open) => open && updatePopupSide()}>
      <HoverCardTrigger asChild>
        <div
          ref={cardRef}
          className={cn(
            'group relative cursor-pointer card-hover shrink-0',
            'w-[100px] md:w-[120px] lg:w-[130px]',
            !alreadySeen && (animateFromBelow ? 'animate-home-show-enter' : 'animate-fade-in'),
            className
          )}
          style={alreadySeen ? undefined : { animationDelay: `${Math.min(index, 12) * (animateFromBelow ? 36 : 40)}ms` }}
          onClick={handlePlay}
        >
          {/* Poster Image */}
          <div className="aspect-[2/3] bg-muted relative overflow-hidden rounded-lg">
            {posterUrl ? (
              <img
                src={posterUrl}
                alt={title}
                className={cn(
                  'w-full h-full object-cover transition-all duration-500',
                  'group-hover:scale-110',
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                )}
                onLoad={() => setImageLoaded(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                No Image
              </div>
            )}
            
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Rating Badge - Top Right */}
            <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-background/80 backdrop-blur-sm px-1.5 py-0.5 rounded">
              <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
              <span className="text-[10px] font-medium">{rating}</span>
            </div>
            
            {/* Play icon on hover */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/90 flex items-center justify-center">
                <Play className="w-4 h-4 md:w-5 md:h-5 fill-current text-primary-foreground" />
              </div>
            </div>
          </div>
          
          {/* Info below poster */}
          <div className="pt-1.5 px-0.5">
            {/* Media Type (left) and Year (right) */}
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span className="uppercase font-medium text-primary">
                {mediaLabel}
              </span>
              <span>{year || 'TBA'}</span>
            </div>
            {/* Title */}
            <h3 className="font-medium text-xs mt-0.5 truncate">{title}</h3>
          </div>
        </div>
      </HoverCardTrigger>
      
      <HoverCardContent 
        side={popupSide} 
        align="start"
        sideOffset={10}
        className="w-[320px] p-0 overflow-hidden bg-card border-border/50 shadow-2xl"
      >
        {/* Backdrop with rating */}
        <div className="relative">
          {backdropUrl ? (
            <img
              src={backdropUrl}
              alt={title}
              className="w-full h-[140px] object-cover"
            />
          ) : posterUrl ? (
            <img
              src={posterUrl}
              alt={title}
              className="w-full h-[140px] object-cover"
            />
          ) : (
            <div className="w-full h-[140px] bg-muted flex items-center justify-center">
              <span className="text-muted-foreground text-sm">No Image</span>
            </div>
          )}
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
          
          {/* Rating badge */}
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            <span className="text-sm font-semibold">{rating}</span>
          </div>
          
          {/* Media Type */}
          <div className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-xs font-medium px-2 py-0.5 rounded uppercase">
            {mediaLabelLong}
          </div>
        </div>
        
        {/* Content */}
        <div className="p-3 space-y-2">
          <h3 className="font-semibold text-base leading-tight line-clamp-1">{title}</h3>
          
          <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
            {overview}
          </p>
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{releaseDate || 'TBA'}</span>
            </div>
            {year && (
              <span className="text-primary font-medium">{year}</span>
            )}
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button 
              size="sm" 
              className="flex-1 bg-primary hover:bg-primary/90 h-8 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                handlePlay();
              }}
            >
              <Play className="w-3.5 h-3.5 mr-1 fill-current" />
              Play Now
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className={cn(
                'shrink-0 h-8 w-8',
                inWatchlist && 'bg-primary text-primary-foreground hover:bg-primary/90'
              )}
              onClick={handleWatchlistToggle}
            >
              {inWatchlist ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default MovieCard;