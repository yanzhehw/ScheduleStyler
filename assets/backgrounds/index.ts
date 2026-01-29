// Auto-discover background images using Vite's import.meta.glob
// To add new backgrounds, just drop image files into landscape/ or portrait/
// Thumbnails are auto-generated at 720px (longer side) using vite-imagetools

// Full resolution images (for CalendarCanvas)
const landscapeFull = import.meta.glob<string>(
  './landscape/*.{jpg,jpeg,png,webp}',
  { eager: true, import: 'default' }
);

const portraitFull = import.meta.glob<string>(
  './portrait/*.{jpg,jpeg,png,webp}',
  { eager: true, import: 'default' }
);

// Thumbnails at 720px on the longer side (for picker UI)
// Landscape: width is longer → w=720
// Portrait: height is longer → h=720
const landscapeThumbs = import.meta.glob<string>(
  './landscape/*.{jpg,jpeg,png,webp}',
  { eager: true, import: 'default', query: '?w=720' }
);

const portraitThumbs = import.meta.glob<string>(
  './portrait/*.{jpg,jpeg,png,webp}',
  { eager: true, import: 'default', query: '?h=720' }
);

/** Extract filename without extension from a module path */
const getBaseName = (path: string): string => {
  const filename = path.split('/').pop() || '';
  return filename.replace(/\.[^.]+$/, '');
};

/** Strip query string from path for matching */
const stripQuery = (path: string): string => path.split('?')[0];

export interface BackgroundOption {
  id: string;
  url: string;
  thumbnailUrl: string;
  name: string;
}

/** All landscape backgrounds, sorted by filename */
export const LANDSCAPE_BACKGROUNDS: BackgroundOption[] = Object.entries(landscapeFull)
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  .map(([path, url]) => {
    const baseName = getBaseName(path);
    // Find matching thumbnail
    const thumbEntry = Object.entries(landscapeThumbs).find(
      ([thumbPath]) => stripQuery(thumbPath) === stripQuery(path)
    );
    return {
      id: `l${baseName}`,
      url,
      thumbnailUrl: thumbEntry?.[1] ?? url,
      name: `Landscape ${baseName}`,
    };
  });

/** All portrait backgrounds, sorted by filename */
export const PORTRAIT_BACKGROUNDS: BackgroundOption[] = Object.entries(portraitFull)
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  .map(([path, url]) => {
    const baseName = getBaseName(path);
    // Find matching thumbnail
    const thumbEntry = Object.entries(portraitThumbs).find(
      ([thumbPath]) => stripQuery(thumbPath) === stripQuery(path)
    );
    return {
      id: baseName,
      url,
      thumbnailUrl: thumbEntry?.[1] ?? url,
      name: `Portrait ${baseName}`,
    };
  });

/** Combined map of all background IDs to full URLs (for CalendarCanvas lookups) */
export const BACKGROUND_IMAGE_MAP: Record<string, string> = Object.fromEntries([
  ...LANDSCAPE_BACKGROUNDS.map((bg) => [bg.id, bg.url]),
  ...PORTRAIT_BACKGROUNDS.map((bg) => [bg.id, bg.url]),
]);
