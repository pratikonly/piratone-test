import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Clapperboard,
  Music,
  Newspaper,
  Radio,
  RefreshCw,
  Search,
  Sparkles,
  Trophy,
  Tv2,
  Users,
} from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import LiveEmbedPlayer from '@/components/LiveEmbedPlayer';
import { useDebounce } from '@/hooks/useDebounce';
import { fetchLiveChannels, getLiveApiErrorMessage, LiveChannel } from '@/lib/liveApi';

const LIVE_CHANNELS_QUERY_KEY = ['live', 'channels', 'broad-categories-v2'];
const INITIAL_CHANNEL_COUNT = 48;
const LAST_LIVE_CHANNEL_KEY = 'pirateone:last-live-channel';
const EMPTY_CHANNELS: LiveChannel[] = [];
const LIVE_CATEGORY_OPTIONS = [
  { label: 'News', Icon: Newspaper },
  { label: 'Sports', Icon: Trophy },
  { label: 'Entertainment', Icon: Sparkles },
  { label: 'Movies', Icon: Clapperboard },
  { label: 'Music', Icon: Music },
  { label: 'Kids & Family', Icon: Users },
] as const;
type LiveCategory = (typeof LIVE_CATEGORY_OPTIONS)[number]['label'];

const ChannelLogo = ({ channel }: { channel: LiveChannel }) => {
  const [imageFailed, setImageFailed] = useState(!channel.logo);

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-zinc-800 text-sm font-bold uppercase text-zinc-200">
      {!imageFailed && channel.logo ? (
        <img
          src={channel.logo}
          alt=""
          loading="lazy"
          onError={() => setImageFailed(true)}
          className="h-full w-full object-contain p-1"
        />
      ) : (
        <span aria-hidden="true">{channel.name.trim().charAt(0) || '?'}</span>
      )}
    </div>
  );
};

const ChannelSkeleton = () => (
  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1" aria-label="Loading channels">
    {Array.from({ length: 8 }, (_, index) => (
      <div key={index} className="flex animate-pulse items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
        <div className="h-11 w-11 shrink-0 rounded-xl bg-zinc-800" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-3 w-4/5 rounded bg-zinc-800" />
          <div className="h-2.5 w-2/5 rounded bg-zinc-800/80" />
        </div>
      </div>
    ))}
  </div>
);

const Live = () => {
  const { id: channelId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') ?? '';
  const requestedCategory = searchParams.get('category') ?? '';
  const selectedCategory = LIVE_CATEGORY_OPTIONS.find(({ label }) => label === requestedCategory)?.label ?? '';
  const [searchInput, setSearchInput] = useState(urlQuery);
  const debouncedQuery = useDebounce(searchInput, 350);
  const [visibleCount, setVisibleCount] = useState(INITIAL_CHANNEL_COUNT);
  const restoredLastChannel = useRef(false);

  const channelsQuery = useQuery({
    queryKey: LIVE_CHANNELS_QUERY_KEY,
    queryFn: ({ signal }) => fetchLiveChannels(signal),
    staleTime: 5 * 60 * 1000,
  });
  const channels = channelsQuery.data ?? EMPTY_CHANNELS;

  useEffect(() => {
    setSearchInput(urlQuery);
  }, [urlQuery]);

  const searchString = searchParams.toString();
  useEffect(() => {
    if (channelId) {
      try {
        localStorage.setItem(LAST_LIVE_CHANNEL_KEY, channelId);
      } catch {
        // Playback should still work when browser storage is unavailable.
      }
      restoredLastChannel.current = true;
      return;
    }

    if (restoredLastChannel.current) return;
    restoredLastChannel.current = true;

    try {
      const lastChannelId = localStorage.getItem(LAST_LIVE_CHANNEL_KEY);
      if (!lastChannelId) return;
      navigate({
        pathname: `/live/${encodeURIComponent(lastChannelId)}`,
        search: searchString ? `?${searchString}` : '',
      }, { replace: true });
    } catch {
      // A blocked localStorage read should not prevent using the channel list.
    }
  }, [channelId, navigate, searchString]);

  useEffect(() => {
    const normalizedQuery = debouncedQuery.trim();
    if (normalizedQuery === urlQuery) return;

    const nextParams = new URLSearchParams(searchString);
    if (normalizedQuery) nextParams.set('q', normalizedQuery);
    else nextParams.delete('q');
    setSearchParams(nextParams, { replace: true });
  }, [debouncedQuery, searchString, setSearchParams, urlQuery]);

  const categoryCounts = useMemo(() => {
    const counts: Record<LiveCategory, number> = {
      News: 0,
      Sports: 0,
      Entertainment: 0,
      Movies: 0,
      Music: 0,
      'Kids & Family': 0,
    };
    channels.forEach((channel) => {
      if (channel.category in counts) counts[channel.category as LiveCategory] += 1;
    });
    return counts;
  }, [channels]);
  const normalizedQuery = debouncedQuery.trim().toLocaleLowerCase();
  const filteredChannels = useMemo(() => channels.filter((channel) => {
    const matchesCategory = !selectedCategory || channel.category === selectedCategory;
    const matchesQuery = !normalizedQuery
      || channel.name.toLocaleLowerCase().includes(normalizedQuery)
      || channel.category.toLocaleLowerCase().includes(normalizedQuery);
    return matchesCategory && matchesQuery;
  }), [channels, normalizedQuery, selectedCategory]);
  const visibleChannels = filteredChannels.slice(0, visibleCount);
  const visibleChannelGroups = useMemo(() => {
    const groups = new Map<string, LiveChannel[]>();
    visibleChannels.forEach((channel) => {
      const group = groups.get(channel.category);
      if (group) group.push(channel);
      else groups.set(channel.category, [channel]);
    });
    const orderedGroups: Array<[string, LiveChannel[]]> = [];
    LIVE_CATEGORY_OPTIONS.forEach(({ label }) => {
      const group = groups.get(label);
      if (group) orderedGroups.push([label, group]);
    });
    return orderedGroups;
  }, [visibleChannels]);
  const selectedChannel = channels.find((channel) => channel.id === channelId);

  useEffect(() => {
    setVisibleCount(INITIAL_CHANNEL_COUNT);
  }, [normalizedQuery, selectedCategory]);

  const updateCategory = (category: LiveCategory) => {
    const nextParams = new URLSearchParams(searchParams);
    if (category === selectedCategory) nextParams.delete('category');
    else nextParams.set('category', category);
    setSearchParams(nextParams, { replace: true });
  };

  const selectChannel = (channel: LiveChannel) => {
    const query = searchParams.toString();
    navigate({
      pathname: `/live/${encodeURIComponent(channel.id)}`,
      search: query ? `?${query}` : '',
    });
  };

  const renderChannelButton = (channel: LiveChannel) => {
    const isSelected = channel.id === channelId;
    return (
      <button
        key={channel.id}
        type="button"
        onClick={() => selectChannel(channel)}
        aria-current={isSelected ? 'true' : undefined}
        className={`group flex min-w-0 items-center gap-2.5 rounded-xl border p-2.5 text-left transition-colors sm:gap-3 sm:p-3 ${
          isSelected
            ? 'border-red-500/45 bg-red-500/[0.09]'
            : 'border-white/[0.06] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]'
        }`}
      >
        <ChannelLogo channel={channel} />
        <span className="min-w-0 flex-1">
          <span className={`block truncate text-xs font-semibold sm:text-sm ${isSelected ? 'text-white' : 'text-zinc-200 group-hover:text-white'}`}>
            {channel.name}
          </span>
          <span className="mt-1 block truncate text-[10px] text-zinc-500 sm:text-[11px]">
            {channel.category}
          </span>
        </span>
        {isSelected && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-label="Selected" />}
      </button>
    );
  };

  const channelListError = channelsQuery.error
    ? getLiveApiErrorMessage(channelsQuery.error)
    : '';

  return (
    <div className="mx-auto min-h-[calc(100vh-6rem)] w-full max-w-7xl space-y-5 px-4 pb-12 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/[0.07] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-red-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" aria-hidden="true" />
            Live channels
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Watch Live</h1>
          <p className="mt-1 text-sm text-zinc-400">Choose a channel and start watching.</p>
        </div>
        <div className="text-xs text-zinc-500">
          {channelsQuery.isSuccess ? `${filteredChannels.length.toLocaleString()} channels` : 'Live TV'}
        </div>
      </header>

      <section aria-label="Filter channels" className="space-y-3.5">
        <label className="relative block max-w-xl">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden="true" />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search channels or categories"
            aria-label="Search live channels"
            className="h-11 w-full rounded-xl border border-white/10 bg-zinc-900/70 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-white/25 focus:ring-2 focus:ring-red-500/20"
          />
        </label>

        <div>
          <div className="mb-2.5 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-300">Browse categories</h2>
              <p className="mt-1 text-[11px] text-zinc-500">Select a category to filter; select it again to show all channels.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5" aria-label="Channel categories">
            {LIVE_CATEGORY_OPTIONS.map(({ label, Icon }) => {
              const isSelected = selectedCategory === label;
              const count = categoryCounts[label];
              return (
            <button
              key={label}
              type="button"
              onClick={() => updateCategory(label)}
              aria-pressed={isSelected}
              disabled={channelsQuery.isSuccess && count === 0}
              className={`group flex min-h-[72px] min-w-0 items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
                isSelected
                  ? 'border-red-400/40 bg-gradient-to-br from-red-500/20 via-red-500/[0.08] to-zinc-950 shadow-[0_8px_28px_rgba(239,68,68,0.1)]'
                  : 'border-white/10 bg-white/[0.025] hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.05]'
              }`}
            >
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition-colors ${
                isSelected
                  ? 'border-red-300/20 bg-red-400/15 text-red-200'
                  : 'border-white/[0.06] bg-white/[0.04] text-zinc-400 group-hover:text-zinc-200'
              }`}>
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block truncate text-xs font-semibold ${isSelected ? 'text-white' : 'text-zinc-200'}`}>
                  {label}
                </span>
                <span className="mt-1 block text-[10px] text-zinc-500">{count.toLocaleString()} channels</span>
              </span>
              {isSelected && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" aria-hidden="true" />}
            </button>
              );
            })}
          </div>
        </div>
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(19rem,0.9fr)]">
        <LiveEmbedPlayer channelId={channelId ?? null} channelName={selectedChannel?.name} />

        <aside className="min-w-0 rounded-2xl border border-white/10 bg-zinc-900/55 p-3.5 sm:p-4" aria-label="Channel list">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Tv2 className="h-4 w-4 text-zinc-400" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-white">Channels</h2>
            </div>
            {channelsQuery.isSuccess && (
              <span className="text-[11px] text-zinc-500">
                {filteredChannels.length.toLocaleString()} available
              </span>
            )}
          </div>

          {channelsQuery.isPending ? (
            <ChannelSkeleton />
          ) : channelsQuery.isError ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] p-4">
              <p className="text-sm text-zinc-200" role="alert">{channelListError}</p>
              <button
                type="button"
                onClick={() => void channelsQuery.refetch()}
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/10"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                Retry
              </button>
            </div>
          ) : visibleChannels.length === 0 ? (
            <div className="flex min-h-36 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 px-4 text-center">
              <Search className="mb-2 h-5 w-5 text-zinc-600" aria-hidden="true" />
              <p className="text-sm font-medium text-zinc-300">No channels found</p>
              <p className="mt-1 text-xs text-zinc-500">Try another search or category.</p>
            </div>
          ) : (
            <>
              <div className="max-h-[62vh] overflow-y-auto pr-1 lg:max-h-[calc(100vh-17rem)]">
                {visibleChannelGroups.map(([category, categoryChannels]) => (
                  <section key={category} className="mb-4 last:mb-0" aria-label={`${category} channels`}>
                    <div className="mb-2 flex items-center justify-between px-1">
                      <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                        {category}
                      </h3>
                      <span className="text-[10px] text-zinc-600">{categoryChannels.length}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
                      {categoryChannels.map(renderChannelButton)}
                    </div>
                  </section>
                ))}
              </div>
              {visibleChannels.length < filteredChannels.length && (
                <button
                  type="button"
                  onClick={() => setVisibleCount((current) => current + INITIAL_CHANNEL_COUNT)}
                  className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-zinc-300 transition-colors hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
                >
                  Load more channels
                </button>
              )}
            </>
          )}
        </aside>
      </div>
    </div>
  );
};

export default Live;