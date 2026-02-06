/**
 * Examples API client
 * Fetches example images (products & textures) from the Express backend
 */

export interface ExampleImage {
  id: string;
  url: string;
  name: string;
  type: 'products' | 'texture';
}

export interface ExamplesData {
  products: ExampleImage[];
  texture: ExampleImage[];
}

// Module-level cache
let cachedData: ExamplesData | null = null;
let fetchPromise: Promise<ExamplesData> | null = null;

/**
 * Fetch examples from the API
 * Returns cached data if available, otherwise fetches from server
 */
export async function fetchExamples(): Promise<ExamplesData> {
  // Return cached data immediately if available
  if (cachedData) {
    return cachedData;
  }

  // If a fetch is already in progress, return that promise
  if (fetchPromise) {
    return fetchPromise;
  }

  // Start a new fetch
  fetchPromise = fetch('/api/examples')
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Failed to fetch examples: ${res.status} ${res.statusText}`);
      }
      return res.json();
    })
    .then((data: ExamplesData) => {
      cachedData = data;
      return data;
    })
    .catch((error) => {
      // Reset promise on error so we can retry
      fetchPromise = null;
      throw error;
    });

  return fetchPromise;
}

/**
 * Get cached examples data synchronously
 * Returns null if data hasn't been fetched yet
 */
export function getCachedExamples(): ExamplesData | null {
  return cachedData;
}

/**
 * Clear the examples cache
 * Useful for forcing a refresh
 */
export function clearExamplesCache(): void {
  cachedData = null;
  fetchPromise = null;
}

/**
 * Get all example images as a flat array
 */
export function getAllExamples(): ExampleImage[] {
  if (!cachedData) return [];
  return [...cachedData.products, ...cachedData.texture];
}
