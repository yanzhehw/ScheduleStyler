import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import {
  fetchExamples,
  type ExampleImage,
  type ExamplesData,
} from '../services/examplesApi';

interface ExamplesContextValue {
  /** Whether examples are currently being fetched */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Product example images */
  products: ExampleImage[];
  /** Texture example images */
  textures: ExampleImage[];
  /** Refresh the examples data from the server */
  refresh: () => Promise<void>;
}

const ExamplesContext = createContext<ExamplesContextValue | null>(null);

interface ExamplesProviderProps {
  children: ReactNode;
}

export function ExamplesProvider({ children }: ExamplesProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ExamplesData | null>(null);

  const loadExamples = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchExamples();
      setData(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load examples';
      setError(message);
      console.error('Failed to load examples:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExamples();
  }, []);

  const value: ExamplesContextValue = {
    isLoading,
    error,
    products: data?.products ?? [],
    textures: data?.texture ?? [],
    refresh: loadExamples,
  };

  return <ExamplesContext.Provider value={value}>{children}</ExamplesContext.Provider>;
}

/**
 * Hook to access examples data and loading state
 * Must be used within an ExamplesProvider
 */
export function useExamples(): ExamplesContextValue {
  const context = useContext(ExamplesContext);
  if (!context) {
    throw new Error('useExamples must be used within an ExamplesProvider');
  }
  return context;
}
