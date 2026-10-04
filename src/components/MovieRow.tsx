import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState } from 'react';
import { Movie } from '@/lib/tmdb';
import MovieCard from './MovieCard';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface MovieRowProps {
  title: string;
  movies: Movie[];
  isLoading?: boolean;
  animateCards?: boolean;
}

const MovieRow = ({ title, movies, isLoading, animateCards = false }: MovieRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollability = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 800;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
      setTimeout(checkScrollability, 300);
    }
  };

  if (isLoading) {
    return (
      <section className="mb-6 md:mb-8">
        <h2 className="font-display text-xl md:text-2xl mb-3 md:mb-4 px-1">{title}</h2>
        <div className="flex gap-3 lg:gap-4 overflow-x-auto scrollbar-hide">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="w-[100px] md:w-[120px] lg:w-[130px] shrink-0">
              <div className="relative aspect-[2/3] overflow-hidden rounded-lg border border-border bg-muted animate-shimmer">
                <div className="absolute right-1.5 top-1.5 h-5 w-9 rounded bg-background/70" />
              </div>
              <div className="pt-2 space-y-1.5">
                <div className="h-3 bg-muted rounded animate-shimmer" />
                <div className={cn('h-2.5 bg-muted rounded animate-shimmer', i % 3 === 0 ? 'w-1/2' : i % 2 === 0 ? 'w-3/4' : 'w-2/3')} />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!movies.length) return null;

  return (
    <section className="mb-6 md:mb-8 group/row">
      <div className="flex items-center justify-between mb-3 md:mb-4 px-1">
        <h2 className="font-display text-xl md:text-2xl">{title}</h2>
        <div className="flex gap-1 md:gap-2">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="rounded-full h-8 w-8 md:h-9 md:w-9"
          >
            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="rounded-full h-8 w-8 md:h-9 md:w-9"
          >
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
        </div>
      </div>
      
      <div
        ref={scrollRef}
        onScroll={checkScrollability}
        className={cn(
          'flex gap-3 lg:gap-4 overflow-x-auto scrollbar-hide pb-4',
          'scroll-smooth snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0'
        )}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {movies.map((movie, index) => (
          <MovieCard
            key={`${movie.id}-${movie.media_type}`}
            movie={movie}
            index={index}
            animateFromBelow={animateCards}
          />
        ))}
      </div>
    </section>
  );
};

export default MovieRow;
