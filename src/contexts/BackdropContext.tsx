import { createContext, useCallback, useContext, useSyncExternalStore, ReactNode } from 'react';
import { getBackdropUrlValue, setBackdropUrlValue, subscribeBackdropUrl } from '@/lib/backdropStore';

interface BackdropSetterContextType {
  setBackdropUrl: (url: string | null) => void;
}

const BackdropSetterContext = createContext<BackdropSetterContextType | undefined>(undefined);

export const BackdropProvider = ({ children }: { children: ReactNode }) => {
  const setBackdropUrl = useCallback((url: string | null) => {
    setBackdropUrlValue(url);
  }, []);

  return (
    <BackdropSetterContext.Provider value={{ setBackdropUrl }}>
      {children}
    </BackdropSetterContext.Provider>
  );
};

export const useBackdropUrl = () => {
  return useSyncExternalStore(subscribeBackdropUrl, getBackdropUrlValue, getBackdropUrlValue);
};

export const useSetBackdropUrl = () => {
  const context = useContext(BackdropSetterContext);
  if (!context) {
    throw new Error('useSetBackdropUrl must be used within a BackdropProvider');
  }
  return context.setBackdropUrl;
};

// Backwards-compatible helper
export const useBackdrop = () => {
  return {
    backdropUrl: useBackdropUrl(),
    setBackdropUrl: useSetBackdropUrl(),
  };
};
