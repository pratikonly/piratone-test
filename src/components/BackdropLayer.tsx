import { useBackdropUrl } from '@/contexts/BackdropContext';

const BackdropLayer = () => {
  const backdropUrl = useBackdropUrl();

  if (!backdropUrl) return null;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <img
        src={backdropUrl}
        alt=""
        className="w-full h-full object-cover blur-sm opacity-45 brightness-75 scale-110 transition-all duration-700"
        loading="lazy"
        decoding="async"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
    </div>
  );
};

export default BackdropLayer;
