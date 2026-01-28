// Auto-discover background images using Vite's import.meta.glob
// To add new backgrounds, just drop image files into landscape/ or portrait/

const landscapeModules = import.meta.glob<string>(
  './landscape/*.{jpg,jpeg,png,webp}',
  { eager: true, import: 'default' }
);

const portraitModules = import.meta.glob<string>(
  './portrait/*.{jpg,jpeg,png,webp}',
  { eager: true, import: 'default' }
);

/** Extract filename without extension from a module path */
const getBaseName = (path: string): string => {
  const filename = path.split('/').pop() || '';
  return filename.replace(/\.[^.]+$/, '');
};

export interface BackgroundOption {
  id: string;
  url: string;
  name: string;
}

/** All landscape backgrounds, sorted by filename */
export const LANDSCAPE_BACKGROUNDS: BackgroundOption[] = Object.entries(landscapeModules)
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  .map(([path, url]) => {
    const baseName = getBaseName(path);
    return {
      id: `l${baseName}`,
      url,
      name: `Landscape ${baseName}`,
    };
  });

/** All portrait backgrounds, sorted by filename */
export const PORTRAIT_BACKGROUNDS: BackgroundOption[] = Object.entries(portraitModules)
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  .map(([path, url]) => {
    const baseName = getBaseName(path);
    return {
      id: baseName,
      url,
      name: `Portrait ${baseName}`,
    };
  });

/** Combined map of all background IDs to URLs (for CalendarCanvas lookups) */
export const BACKGROUND_IMAGE_MAP: Record<string, string> = Object.fromEntries([
  ...LANDSCAPE_BACKGROUNDS.map((bg) => [bg.id, bg.url]),
  ...PORTRAIT_BACKGROUNDS.map((bg) => [bg.id, bg.url]),
]);
