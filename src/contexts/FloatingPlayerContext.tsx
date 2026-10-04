import { createContext, useContext, useState, ReactNode } from 'react';
import { ServerType } from '@/lib/tmdb';

export interface FloatingPlayerState {
  id: number;
  mediaType: 'movie' | 'tv' | 'anime';
  season?: number;
  episode?: number;
  server: ServerType;
  title: string;
  watchPath: string;
}

interface FloatingPlayerContextType {
  floatingPlayer: FloatingPlayerState | null;
  openFloatingPlayer: (p: FloatingPlayerState) => void;
  closeFloatingPlayer: () => void;
}

const FloatingPlayerContext = createContext<FloatingPlayerContextType>({
  floatingPlayer: null,
  openFloatingPlayer: () => {},
  closeFloatingPlayer: () => {},
});

export const FloatingPlayerProvider = ({ children }: { children: ReactNode }) => {
  const [floatingPlayer, setFloatingPlayer] = useState<FloatingPlayerState | null>(null);
  return (
    <FloatingPlayerContext.Provider value={{
      floatingPlayer,
      openFloatingPlayer: setFloatingPlayer,
      closeFloatingPlayer: () => setFloatingPlayer(null),
    }}>
      {children}
    </FloatingPlayerContext.Provider>
  );
};

export const useFloatingPlayer = () => useContext(FloatingPlayerContext);
