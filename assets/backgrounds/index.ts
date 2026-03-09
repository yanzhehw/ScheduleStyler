/**
 * Background images facade
 *
 * For React components, prefer using the useBackgrounds() hook from BackgroundsContext
 * which provides loading states and error handling.
 */

import { getCachedBackgrounds } from '../../services/backgroundApi';

// Re-export the type
export interface BackgroundOption {
  id: string;
  url: string;
  thumbnailUrl: string;
  name: string;
}

/**
 * Get the default landscape background ID
 */
export function getDefaultLandscapeId(): string | undefined {
  const cached = getCachedBackgrounds();
  return cached?.landscape[0]?.id;
}
