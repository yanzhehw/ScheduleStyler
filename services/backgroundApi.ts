/**
 * Background API client
 * Fetches background image data from the Express backend
 */

export interface BackgroundOption {
  id: string;
  url: string;
  thumbnailUrl: string;
  name: string;
}

export interface BackgroundsData {
  landscape: BackgroundOption[];
  portrait: BackgroundOption[];
  map: Record<string, string>;
}

// Module-level cache
let cachedData: BackgroundsData | null = null;
let fetchPromise: Promise<BackgroundsData> | null = null;

/**
 * Fetch backgrounds from the API
 * Returns cached data if available, otherwise fetches from server
 */
export async function fetchBackgrounds(): Promise<BackgroundsData> {
  // Return cached data immediately if available
  if (cachedData) {
    return cachedData;
  }

  // If a fetch is already in progress, return that promise
  if (fetchPromise) {
    return fetchPromise;
  }

  // Start a new fetch
  fetchPromise = fetch('/api/backgrounds')
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Failed to fetch backgrounds: ${res.status} ${res.statusText}`);
      }
      return res.json();
    })
    .then((data: BackgroundsData) => {
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
 * Get cached backgrounds data synchronously
 * Returns null if data hasn't been fetched yet
 */
export function getCachedBackgrounds(): BackgroundsData | null {
  return cachedData;
}

/**
 * Clear the backgrounds cache
 * Useful for forcing a refresh
 */
export function clearBackgroundsCache(): void {
  cachedData = null;
  fetchPromise = null;
}

/**
 * Get the URL for a background image by ID
 * Returns undefined if the ID is not found
 */
export function getBackgroundUrl(id: string): string | undefined {
  return cachedData?.map[id];
}
