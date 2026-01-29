/**
 * Background images facade
 *
 * This module provides backward-compatible exports for background images.
 * Data is now fetched from the API rather than loaded statically via import.meta.glob.
 *
 * For React components, prefer using the useBackgrounds() hook from BackgroundsContext
 * which provides loading states and error handling.
 */

import { fetchBackgrounds, getCachedBackgrounds } from '../../services/backgroundApi';

// Re-export the type
export interface BackgroundOption {
  id: string;
  url: string;
  thumbnailUrl: string;
  name: string;
}

/**
 * Initialize backgrounds by fetching from the API
 * Call this early in the app lifecycle to pre-populate the cache
 */
export async function initializeBackgrounds(): Promise<void> {
  await fetchBackgrounds();
}

/**
 * Get landscape backgrounds (async)
 */
export async function getLandscapeBackgrounds(): Promise<BackgroundOption[]> {
  const data = await fetchBackgrounds();
  return data.landscape;
}

/**
 * Get portrait backgrounds (async)
 */
export async function getPortraitBackgrounds(): Promise<BackgroundOption[]> {
  const data = await fetchBackgrounds();
  return data.portrait;
}

/**
 * Get the background image map (async)
 */
export async function getBackgroundImageMap(): Promise<Record<string, string>> {
  const data = await fetchBackgrounds();
  return data.map;
}

/**
 * Get the default landscape background ID
 */
export function getDefaultLandscapeId(): string | undefined {
  const cached = getCachedBackgrounds();
  return cached?.landscape[0]?.id;
}

/**
 * Get the default portrait background ID
 */
export function getDefaultPortraitId(): string | undefined {
  const cached = getCachedBackgrounds();
  return cached?.portrait[0]?.id;
}

// ============================================================================
// BACKWARD COMPATIBILITY EXPORTS
// These use Proxy to return cached data when available
// For new code, prefer using the async functions or useBackgrounds() hook
// ============================================================================

/**
 * @deprecated Use getLandscapeBackgrounds() or useBackgrounds() hook instead
 * Returns cached landscape backgrounds (empty array if not loaded yet)
 */
export const LANDSCAPE_BACKGROUNDS: BackgroundOption[] = new Proxy([] as BackgroundOption[], {
  get(target, prop, receiver) {
    const cached = getCachedBackgrounds();
    const source = cached?.landscape ?? target;
    return Reflect.get(source, prop, receiver);
  },
  has(target, prop) {
    const cached = getCachedBackgrounds();
    const source = cached?.landscape ?? target;
    return Reflect.has(source, prop);
  },
  ownKeys(_target) {
    const cached = getCachedBackgrounds();
    const source = cached?.landscape ?? [];
    return Reflect.ownKeys(source);
  },
  getOwnPropertyDescriptor(target, prop) {
    const cached = getCachedBackgrounds();
    const source = cached?.landscape ?? target;
    return Reflect.getOwnPropertyDescriptor(source, prop);
  },
});

/**
 * @deprecated Use getPortraitBackgrounds() or useBackgrounds() hook instead
 * Returns cached portrait backgrounds (empty array if not loaded yet)
 */
export const PORTRAIT_BACKGROUNDS: BackgroundOption[] = new Proxy([] as BackgroundOption[], {
  get(target, prop, receiver) {
    const cached = getCachedBackgrounds();
    const source = cached?.portrait ?? target;
    return Reflect.get(source, prop, receiver);
  },
  has(target, prop) {
    const cached = getCachedBackgrounds();
    const source = cached?.portrait ?? target;
    return Reflect.has(source, prop);
  },
  ownKeys(_target) {
    const cached = getCachedBackgrounds();
    const source = cached?.portrait ?? [];
    return Reflect.ownKeys(source);
  },
  getOwnPropertyDescriptor(target, prop) {
    const cached = getCachedBackgrounds();
    const source = cached?.portrait ?? target;
    return Reflect.getOwnPropertyDescriptor(source, prop);
  },
});

/**
 * @deprecated Use getBackgroundImageMap() or useBackgrounds() hook instead
 * Returns cached background image map (empty object if not loaded yet)
 */
export const BACKGROUND_IMAGE_MAP: Record<string, string> = new Proxy(
  {} as Record<string, string>,
  {
    get(target, prop, receiver) {
      const cached = getCachedBackgrounds();
      const source = cached?.map ?? target;
      return Reflect.get(source, prop, receiver);
    },
    has(target, prop) {
      const cached = getCachedBackgrounds();
      const source = cached?.map ?? target;
      return Reflect.has(source, prop);
    },
    ownKeys(_target) {
      const cached = getCachedBackgrounds();
      const source = cached?.map ?? {};
      return Reflect.ownKeys(source);
    },
    getOwnPropertyDescriptor(target, prop) {
      const cached = getCachedBackgrounds();
      const source = cached?.map ?? target;
      return Reflect.getOwnPropertyDescriptor(source, prop);
    },
  }
);
