import { useState, useEffect } from 'react';
import { Star, ExternalLink, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { getMovieReviews, getTVReviews, TMDBReview } from '@/lib/tmdb';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface TMDBReviewsProps {
  mediaId: number;
  mediaType: 'movie' | 'tv';
}

const ReviewCard = ({ review }: { review: TMDBReview }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLong = review.content.length > 400;
  const displayContent = isExpanded ? review.content : review.content.slice(0, 400);

  const getAvatarUrl = () => {
    const path = review.author_details.avatar_path;
    if (!path) return null;
    // TMDB returns either a full URL (starting with /) or a gravatar hash
    if (path.startsWith('/https://')) {
      return path.slice(1); // Remove leading slash
    }
    return `https://image.tmdb.org/t/p/w200${path}`;
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="bg-card/50 backdrop-blur-sm rounded-lg p-4 border border-border/50">
      <div className="flex items-start gap-3 mb-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={getAvatarUrl() || undefined} alt={review.author} />
          <AvatarFallback className="bg-primary/20 text-primary">
            {review.author.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{review.author}</span>
            {review.author_details.rating && (
              <div className="flex items-center gap-1 bg-primary/20 px-2 py-0.5 rounded-full">
                <Star className="w-3 h-3 text-primary fill-primary" />
                <span className="text-xs font-medium">{review.author_details.rating}/10</span>
              </div>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{formatDate(review.created_at)}</span>
        </div>
      </div>

      <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
        {displayContent}
        {isLong && !isExpanded && '...'}
      </div>

      <div className="flex items-center gap-2 mt-3">
        {isLong && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs h-7 px-2"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3 h-3 mr-1" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3 mr-1" />
                Read More
              </>
            )}
          </Button>
        )}
        <a
          href={review.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline flex items-center gap-1 ml-auto"
        >
          View on TMDB
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};

const TMDBReviews = ({ mediaId, mediaType }: TMDBReviewsProps) => {
  const [reviews, setReviews] = useState<TMDBReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const data = mediaType === 'movie'
          ? await getMovieReviews(mediaId)
          : await getTVReviews(mediaId);
        setReviews(data.results);
      } catch (error) {
        console.error('Failed to fetch TMDB reviews:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [mediaId, mediaType]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h2 className="font-display text-xl">Community Reviews</h2>
        </div>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-card/50 rounded-lg p-4 border border-border/50 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-muted" />
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-3 w-16 bg-muted rounded" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full bg-muted rounded" />
                <div className="h-3 w-3/4 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return null;
  }

  const displayedReviews = showAll ? reviews : reviews.slice(0, 3);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h2 className="font-display text-xl">Community Reviews</h2>
          <span className="text-sm text-muted-foreground">({reviews.length})</span>
        </div>
      </div>

      <div className="space-y-4">
        {displayedReviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {reviews.length > 3 && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? 'Show Less' : `Show All ${reviews.length} Reviews`}
        </Button>
      )}
    </div>
  );
};

export default TMDBReviews;