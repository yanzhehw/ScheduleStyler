import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import {
  fetchBackgrounds,
  type BackgroundOption,
  type BackgroundsData,
} from '../services/backgroundApi';

interface BackgroundsContextValue {
  /** Whether backgrounds are currently being fetched */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Landscape background options */
  landscapes: BackgroundOption[];
  /** Portrait background options */
  portraits: BackgroundOption[];
  /** Map of background IDs to full image URLs */
  imageMap: Record<string, string>;
  /** Get the full image URL for a background ID */
  getImageUrl: (id: string) => string | undefined;
  /** Refresh the backgrounds data from the server */
  refresh: () => Promise<void>;
}

const BackgroundsContext = createContext<BackgroundsContextValue | null>(null);

interface BackgroundsProviderProps {
  children: ReactNode;
}

export function BackgroundsProvider({ children }: BackgroundsProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BackgroundsData | null>(null);

  const loadBackgrounds = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchBackgrounds();
      setData(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load backgrounds';
      setError(message);
      console.error('Failed to load backgrounds:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBackgrounds();
  }, []);

  const value: BackgroundsContextValue = {
    isLoading,
    error,
    landscapes: data?.landscape ?? [],
    portraits: data?.portrait ?? [],
    imageMap: data?.map ?? {},
    getImageUrl: (id: string) => data?.map[id],
    refresh: loadBackgrounds,
  };

  return <BackgroundsContext.Provider value={value}>{children}</BackgroundsContext.Provider>;
}

/**
 * Hook to access backgrounds data and loading state
 * Must be used within a BackgroundsProvider
 */
export function useBackgrounds(): BackgroundsContextValue {
  const context = useContext(BackgroundsContext);
  if (!context) {
    throw new Error('useBackgrounds must be used within a BackgroundsProvider');
  }
  return context;
}
