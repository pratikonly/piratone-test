import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { getYouTubeEmbedUrl } from '@/lib/tmdb';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface TrailerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoKey: string | null;
  title: string;
}

const TrailerModal = ({ isOpen, onClose, videoKey, title }: TrailerModalProps) => {
  if (!videoKey) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0 bg-black border-none overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>{title} - Trailer</DialogTitle>
        </VisuallyHidden>
        <div className="relative w-full aspect-video">
          <iframe
            src={getYouTubeEmbedUrl(videoKey)}
            title={`${title} - Trailer`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TrailerModal;