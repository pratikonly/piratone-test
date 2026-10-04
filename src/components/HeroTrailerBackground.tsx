import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface HeroTrailerBackgroundProps {
  /** YouTube video key */
  videoKey: string;
  /** Only plays while true (slide settled, no modal open, tab visible) */
  active: boolean;
  muted: boolean;
  onPlayingChange: (playing: boolean) => void;
}

const START_DELAY_MS = 1800; // let the backdrop image settle first
const GIVE_UP_AFTER_MS = 9000; // blocked / unavailable video: keep showing the image

/**
 * Muted, looping trailer that fades in over the hero backdrop once it is actually playing.
 * Falls back silently to the image if the video is blocked, unavailable or slow.
 */
const HeroTrailerBackground = ({ videoKey, active, muted, onPlayingChange }: HeroTrailerBackgroundProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mounted, setMounted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  const send = (payload: Record<string, unknown>) => {
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify(payload), '*');
  };

  // Start after a short delay, stop when the slide changes or the tab is hidden
  useEffect(() => {
    if (!active || failed) {
      setMounted(false);
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => setMounted(true), START_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [active, failed]);

  // Give up if it never starts playing
  useEffect(() => {
    if (!mounted || playing) return;
    const timer = window.setTimeout(() => {
      setFailed(true);
      setMounted(false);
    }, GIVE_UP_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [mounted, playing]);

  // Listen to the player so the video only appears once it is really playing
  useEffect(() => {
    if (!mounted) return;

    const onMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;

      let data: { event?: string; info?: unknown } | null = null;
      try {
        data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      } catch {
        return;
      }
      if (!data || typeof data !== 'object') return;

      if (data.event === 'onError') {
        setFailed(true);
        setMounted(false);
        setPlaying(false);
        return;
      }

      const info = data.info as { playerState?: number } | number | undefined;
      const state =
        data.event === 'onStateChange'
          ? (info as number)
          : data.event === 'infoDelivery'
            ? (info as { playerState?: number } | undefined)?.playerState
            : undefined;

      if (state !== undefined) setPlaying(state === 1);
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [mounted]);

  // Tell the parent whether a video is on screen
  useEffect(() => {
    onPlayingChange(playing);
    return () => onPlayingChange(false);
  }, [playing, onPlayingChange]);

  // Sound toggle
  useEffect(() => {
    if (!playing) return;
    send({ event: 'command', func: muted ? 'mute' : 'unMute', args: [] });
  }, [muted, playing]);

  if (!mounted) return null;

  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    controls: '0',
    loop: '1',
    playlist: videoKey,
    playsinline: '1',
    rel: '0',
    modestbranding: '1',
    iv_load_policy: '3',
    disablekb: '1',
    fs: '0',
    enablejsapi: '1',
    origin: window.location.origin,
  });

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden transition-opacity duration-1000',
        playing ? 'opacity-100' : 'opacity-0',
      )}
      style={{ containerType: 'size' }}
      aria-hidden="true"
    >
      <iframe
        ref={iframeRef}
        src={`https://www.youtube-nocookie.com/embed/${videoKey}?${params.toString()}`}
        title="Background trailer"
        allow="autoplay; encrypted-media"
        tabIndex={-1}
        onLoad={() => send({ event: 'listening', id: 1, channel: 'widget' })}
        className="absolute left-1/2 top-1/2 border-0"
        style={{
          // Cover the area like object-fit: cover, slightly enlarged to crop player edges
          width: 'max(100cqw, 177.78cqh)',
          height: 'max(100cqh, 56.25cqw)',
          transform: 'translate(-50%, -50%) scale(1.12)',
        }}
      />
    </div>
  );
};

export default HeroTrailerBackground;