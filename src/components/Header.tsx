import { Settings, RefreshCw, LogOut, Search, X, Loader2, UserRound, Home, Clapperboard, Tv, Radio, Trophy } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { getInitials } from '@/lib/pirateIdentity';
import { usePirateIdentity } from '@/contexts/PirateIdentityContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { searchMulti, Movie, getImageUrl } from '@/lib/tmdb';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';
import pirateOneLogo from '@/assets/logo.svg';
import animeIcon from '@/assets/anime-icon.svg';

const AnimeNavIcon = ({ className }: { className?: string }) => (
  <span
    className={cn('inline-block shrink-0 bg-current', className)}
    style={{
      maskImage: `url(${animeIcon})`,
      WebkitMaskImage: `url(${animeIcon})`,
      maskRepeat: 'no-repeat',
      WebkitMaskRepeat: 'no-repeat',
      maskPosition: 'center',
      WebkitMaskPosition: 'center',
      maskSize: 'contain',
      WebkitMaskSize: 'contain',
    }}
    aria-hidden="true"
  />
);

const Header = () => {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);

  // Global search overlay
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debouncedSearch = useDebounce(searchQuery, 300);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { identity, isLoading, isRegenerating, regenerateIdentity } = usePirateIdentity();
  const { user, signOut } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) { setProfileAvatarUrl(null); setProfileName(null); return; }
      const { data, error } = await supabase
        .from('profiles').select('custom_avatar_url, pirate_name').eq('user_id', user.id).maybeSingle();
      if (error) { console.error('Failed to load profile for header:', error); return; }
      setProfileAvatarUrl(data?.custom_avatar_url || null);
      setProfileName(data?.pirate_name || null);
    };
    loadProfile();
  }, [user, userDropdownOpen]);

  // Global search fetch
  useEffect(() => {
    if (!searchOpen) return;
    if (debouncedSearch.length < 2) { setSearchResults([]); return; }
    let cancelled = false;
    setSearchLoading(true);
    searchMulti(debouncedSearch).then(results => {
      if (!cancelled) { setSearchResults(results); setSearchLoading(false); }
    }).catch(() => { if (!cancelled) setSearchLoading(false); });
    return () => { cancelled = true; };
  }, [debouncedSearch, searchOpen]);

  // Open search overlay
  const openSearch = useCallback(() => {
    setSearchOpen(true);
    setSearchQuery('');
    setSearchResults([]);
    setTimeout(() => searchInputRef.current?.focus(), 80);
  }, []);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isEditable = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable;
      if (e.key === 'Escape') { closeSearch(); }
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !isEditable && !searchOpen) {
        e.preventDefault();
        openSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeSearch, openSearch, searchOpen]);

  const handleSettingsClick = () => { setUserDropdownOpen(false); navigate('/settings'); };
  const handleRegenerateIdentity = async () => { try { await regenerateIdentity(); } catch (e) { console.error(e); } };
  const handleSignOut = async () => { setUserDropdownOpen(false); await signOut(); navigate('/'); };
  const navItems = [
    { label: 'Home', path: '/', Icon: Home },
    { label: 'Movies', path: '/movies', Icon: Clapperboard },
    { label: 'Series', path: '/series', Icon: Tv },
    { label: 'Anime', path: '/anime', Icon: AnimeNavIcon },
    { label: 'Sports', path: '/sports', Icon: Trophy },
  ];

  const displayName = profileName || identity?.name || 'Guest Pirate';
  const displayAvatarUrl = profileAvatarUrl || identity?.imagePath || null;
  const isLiveActive = location.pathname === '/live' || location.pathname.startsWith('/live/');

  return (
    <>
      <header
        className={cn(
          'site-header nav-page-change fixed inset-x-3 top-3 z-[60] mx-auto flex h-14 w-[calc(100%-1.5rem)] max-w-6xl items-center justify-between rounded-full border border-white/15 bg-zinc-950/95 px-3 shadow-[0_10px_34px_rgba(0,0,0,0.55)] transition-all duration-300 ease-out sm:inset-x-4 sm:h-16 sm:w-[calc(100%-2rem)] sm:px-5'
        )}
      >
        <NavLink to="/" aria-label="PirateOne home" className="flex h-full shrink-0 items-center">
          <img src={pirateOneLogo} alt="PirateOne" className="h-8 w-8 object-contain sm:h-9 sm:w-9" />
        </NavLink>

        <nav aria-label="Main navigation" className="mx-5 hidden min-w-0 flex-1 items-center justify-center gap-3 md:flex lg:gap-5">
          {navItems.map((item) => {
            const isActive = item.path === '/'
              ? location.pathname === '/'
              : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
            const Icon = item.Icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'inline-flex items-center justify-center gap-2 rounded-full border border-transparent px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.09em] transition-colors duration-200 lg:text-[11px]',
                  isActive
                    ? 'border-white bg-white text-black'
                    : 'text-zinc-400 hover:border-white/40 hover:bg-white/[0.08] hover:text-white'
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </NavLink>
            );
          })}
          <NavLink
            to="/live"
            aria-current={isLiveActive ? 'page' : undefined}
            title="Live"
            className={cn(
              'flex shrink-0 items-center gap-2 rounded-full border border-transparent px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.09em] transition-colors duration-200 lg:text-[11px]',
              isLiveActive
                ? 'border-white bg-white text-black'
                : 'text-zinc-400 hover:border-white/40 hover:bg-white/[0.08] hover:text-white'
            )}
          >
            <Radio className="h-3.5 w-3.5 text-red-500" aria-hidden="true" />
            Live
          </NavLink>
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            onClick={openSearch}
             className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/[0.03] text-zinc-300 transition-colors duration-200 hover:border-white/60 hover:bg-white/[0.08] hover:text-white sm:h-9 sm:w-9"
            aria-label="Search"
          >
             <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>

          {!user ? (
            <button
              type="button"
              onClick={() => navigate('/auth?mode=signup')}
              aria-label="Create an account"
              title="Sign up"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white bg-white text-zinc-950 transition-colors duration-200 hover:bg-zinc-200 sm:h-9 sm:w-9"
            >
              <UserRound className="h-4 w-4" />
            </button>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                aria-label="Open profile menu"
                aria-expanded={userDropdownOpen}
                 className="overflow-hidden rounded-full border border-white/20 transition-colors duration-200 hover:border-white/70"
              >
                 <Avatar className="h-7 w-7 rounded-full sm:h-8 sm:w-8">
                  {displayAvatarUrl ? <AvatarImage src={displayAvatarUrl} alt={displayName} className="object-cover" /> : null}
                   <AvatarFallback className="rounded-full bg-zinc-800 text-zinc-100 text-xs">
                    {isLoading ? '...' : getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-popover border border-border rounded-lg shadow-lg z-50 py-2">
                  <div className="px-3 py-2 border-b border-border">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        {displayAvatarUrl ? <AvatarImage src={displayAvatarUrl} alt={displayName} className="object-cover" /> : null}
                        <AvatarFallback className="bg-muted text-muted-foreground text-sm">{getInitials(displayName)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                    {identity?.bounty && <p className="text-xs text-primary mt-2 font-medium">💰 {identity.bounty}</p>}
                  </div>
                  <button onClick={handleRegenerateIdentity} disabled={isRegenerating}
                    className="w-full px-3 py-2 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50">
                    <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                    <span>{isRegenerating ? 'Getting new identity...' : 'Get New Identity'}</span>
                  </button>
                  <button onClick={handleSettingsClick}
                    className="w-full px-3 py-2 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                  <button onClick={handleSignOut}
                    className="w-full px-3 py-2 flex items-center gap-2 text-sm text-destructive hover:bg-muted/50 transition-colors border-t border-border mt-1 pt-2">
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>
      {/* Pages that open with a hero slider sit directly under the floating navbar, so no spacer */}
      {!['/', '/movies', '/series', '/anime', '/sports'].includes(location.pathname) && (
        <div className="site-header-spacer h-20 sm:h-[92px]" aria-hidden="true" />
      )}

      <nav
        aria-label="Mobile main navigation"
        className="mobile-bottom-nav fixed inset-x-2 bottom-2 z-[65] mx-auto grid max-w-md grid-cols-6 gap-0.5 rounded-full border border-white/15 bg-zinc-950/95 p-1 text-zinc-300 shadow-[0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur-2xl transition-all duration-300 md:hidden"
      >
        {navItems.map(({ label, path, Icon }) => {
          const isActive = path === '/'
            ? location.pathname === '/'
            : location.pathname === path || location.pathname.startsWith(`${path}/`);
          return (
            <NavLink
              key={path}
              to={path}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                 'flex min-w-0 flex-col items-center justify-center gap-0 rounded-full py-1.5 text-[8px] font-semibold uppercase tracking-[0.02em] transition-colors',
                isActive
                   ? 'bg-white text-zinc-950 shadow-sm'
                   : 'text-zinc-400 hover:bg-white/[0.08] hover:text-white'
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          );
        })}
        <NavLink
          to="/live"
          aria-label="Live"
          aria-current={isLiveActive ? 'page' : undefined}
          className={cn(
            'flex min-w-0 flex-col items-center justify-center gap-0 rounded-full py-1.5 text-[8px] font-semibold uppercase tracking-[0.02em] transition-colors',
            isLiveActive
              ? 'bg-white text-zinc-950 shadow-sm'
              : 'text-zinc-400 hover:bg-white/[0.08] hover:text-white'
          )}
        >
          <Radio className="h-4 w-4 text-red-500" aria-hidden="true" />
          <span>Live</span>
        </NavLink>
      </nav>

      {/* ── Global Search Overlay ── */}
      {searchOpen && (
        <div className="fixed inset-0 z-[80] flex flex-col items-center" style={{ paddingTop: '18vh' }}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={closeSearch} />

          {/* Search panel */}
          <div className="relative w-full max-w-2xl mx-4 animate-in fade-in-0 zoom-in-95 duration-200">
            {/* Input row */}
            <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-3 shadow-2xl ring-1 ring-primary/30">
              {searchLoading
                ? <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
                : <Search className="w-5 h-5 text-zinc-400 shrink-0" />}
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search movies, TV shows, anime…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-base text-white placeholder:text-zinc-500 outline-none"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setSearchResults([]); searchInputRef.current?.focus(); }}
                  className="text-zinc-500 hover:text-white transition-colors shrink-0">
                  <X className="w-4 h-4" />
                </button>
              )}
              <button onClick={closeSearch} className="text-zinc-500 hover:text-white transition-colors shrink-0 ml-1">
                <span className="text-xs font-medium px-1.5 py-0.5 bg-zinc-800 rounded border border-zinc-600">Esc</span>
              </button>
            </div>

            {/* Hint */}
            {!searchQuery && (
              <p className="text-center text-xs text-zinc-600 mt-3">Type to search · Press <kbd className="bg-zinc-800 px-1 rounded">Esc</kbd> to close</p>
            )}

            {/* Results */}
            {searchQuery.length >= 2 && (
              <div className="mt-3 bg-zinc-900/95 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl max-h-[52vh] overflow-y-auto">
                {searchLoading && searchResults.length === 0 ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="py-10 text-center text-zinc-500 text-sm">No results for "{searchQuery}"</div>
                ) : (
                  <div className="p-3">
                    <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-2 px-1">{searchResults.length} results</p>
                    <div className="grid gap-1">
                      {searchResults.slice(0, 8).map(item => {
                        const title = item.title || item.name || 'Untitled';
                        const year = (item.release_date || item.first_air_date)?.split('-')[0] || '';
                        const type = item.media_type === 'tv' ? 'TV' : 'Movie';
                        const poster = item.poster_path ? getImageUrl(item.poster_path, 'w200') : null;
                        return (
                          <button
                            key={item.id}
                            onClick={() => { navigate(`/watch/${item.media_type || 'movie'}/${item.id}`); closeSearch(); }}
                            className="flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-800 transition-colors text-left group w-full"
                          >
                            <div className="w-9 h-[54px] rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                              {poster
                                ? <img src={poster} alt={title} className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center text-[8px] text-zinc-600">N/A</div>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate group-hover:text-primary transition-colors">{title}</p>
                              <p className="text-xs text-zinc-500">{type}{year ? ` · ${year}` : ''}</p>
                            </div>
                            <span className="text-[10px] text-zinc-600 shrink-0">
                              {item.vote_average?.toFixed(1)} ★
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {searchResults.length > 8 && (
                      <button
                        onClick={() => { navigate(`/search?q=${encodeURIComponent(searchQuery)}`); closeSearch(); }}
                        className="w-full mt-2 py-2 text-xs text-primary hover:text-primary/80 transition-colors text-center"
                      >
                        See all {searchResults.length} results →
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Header;