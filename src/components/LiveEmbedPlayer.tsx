import { useState } from 'react';
import { LoaderCircle, Radio, RefreshCw } from 'lucide-react';

interface LiveEmbedPlayerProps {
  channelId: string | null;
  channelName?: string;
}

const LIVE_EMBED_BASE = 'https://livetgtv.lovable.app/embed';

const LiveEmbedPlayer = ({ channelId, channelName }: LiveEmbedPlayerProps) => {
  const [reloadKey, setReloadKey] = useState(0);
  const [loadedFrameKey, setLoadedFrameKey] = useState('');
  const frameKey = channelId ? `${channelId}-${reloadKey}` : '';
  const displayName = channelName || (channelId ? 'Live channel' : 'Live TV');

  const reloadPlayer = () => {
    setReloadKey((current) => current + 1);
  };

  return (
    <section className="space-y-3" aria-label="Live channel player">
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_18px_55px_rgba(0,0,0,0.45)]">
        {channelId ? (
          <>
            <iframe
              key={frameKey}
              src={`${LIVE_EMBED_BASE}/${encodeURIComponent(channelId)}`}
              title={`Live stream: ${displayName}`}
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              allowFullScreen
              referrerPolicy="no-referrer"
              loading="eager"
              onLoad={() => setLoadedFrameKey(frameKey)}
              className="absolute inset-0 h-full w-full border-0 bg-black"
            />
            {loadedFrameKey !== frameKey && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black px-5 text-center">
                <LoaderCircle className="h-8 w-8 animate-spin text-red-500" aria-hidden="true" />
                <p className="text-sm font-semibold text-white">Loading {displayName}…</p>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black px-5 text-center">
            <Radio className="h-9 w-9 text-red-500" aria-hidden="true" />
            <p className="text-sm font-semibold text-white">Choose a channel to start watching</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{displayName}</p>
          {channelId && <p className="mt-0.5 text-xs text-zinc-500">Live TV player</p>}
        </div>
        {channelId && (
          <button
            type="button"
            onClick={reloadPlayer}
            aria-label="Reload live player"
            title="Reload player"
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Reload player
          </button>
        )}
      </div>
      <p className="text-xs leading-relaxed text-zinc-500">
        Streams may be geo-restricted to India.
      </p>
    </section>
  );
};

export default LiveEmbedPlayer;