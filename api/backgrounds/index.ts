import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getR2Client } from '../lib/r2';

interface BackgroundMetadata {
  id: string;
  filename: string;
  type: 'landscape' | 'portrait';
  url: string;
  thumbnailUrl: string;
  name: string;
}

interface BackgroundsResponse {
  landscape: BackgroundMetadata[];
  portrait: BackgroundMetadata[];
  map: Record<string, string>;
}

async function listBackgrounds(): Promise<BackgroundsResponse> {
  const landscape: BackgroundMetadata[] = [];
  const portrait: BackgroundMetadata[] = [];
  const bucket = process.env.R2_BUCKET_NAME || 'schedule-styler-backgrounds';
  const client = getR2Client();

  // List landscape images
  const landscapeResponse = await client.send(
    new ListObjectsV2Command({ Bucket: bucket, Prefix: 'landscape/' })
  );

  for (const obj of landscapeResponse.Contents || []) {
    if (!obj.Key || obj.Key.endsWith('/')) continue;
    const filename = obj.Key.split('/').pop()!;
    const baseName = filename.replace(/\.[^.]+$/, '');
    // Thumbnails are standardized to .jpg
    const thumbnailFilename = `${baseName}.jpg`;

    landscape.push({
      id: `l${baseName}`,
      filename,
      type: 'landscape',
      url: `/api/backgrounds/landscape/${encodeURIComponent(filename)}`,
      thumbnailUrl: `/api/backgrounds/thumbnails_landscape/${encodeURIComponent(thumbnailFilename)}`,
      name: `Landscape ${baseName}`,
    });
  }

  // List portrait images
  const portraitResponse = await client.send(
    new ListObjectsV2Command({ Bucket: bucket, Prefix: 'portrait/' })
  );

  for (const obj of portraitResponse.Contents || []) {
    if (!obj.Key || obj.Key.endsWith('/')) continue;
    const filename = obj.Key.split('/').pop()!;
    const baseName = filename.replace(/\.[^.]+$/, '');
    // Thumbnails are standardized to .jpg
    const thumbnailFilename = `${baseName}.jpg`;

    portrait.push({
      id: baseName,
      filename,
      type: 'portrait',
      url: `/api/backgrounds/portrait/${encodeURIComponent(filename)}`,
      thumbnailUrl: `/api/backgrounds/thumbnails_portrait/${encodeURIComponent(thumbnailFilename)}`,
      name: `Portrait ${baseName}`,
    });
  }

  // Sort by filename numerically
  landscape.sort((a, b) => a.filename.localeCompare(b.filename, undefined, { numeric: true }));
  portrait.sort((a, b) => a.filename.localeCompare(b.filename, undefined, { numeric: true }));

  // Build combined map
  const map: Record<string, string> = {};
  for (const bg of landscape) map[bg.id] = bg.url;
  for (const bg of portrait) map[bg.id] = bg.url;

  return { landscape, portrait, map };
}

// Cache for background list
let backgroundsCache: { data: BackgroundsResponse; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const now = Date.now();

    if (backgroundsCache && now - backgroundsCache.timestamp < CACHE_TTL) {
      return res.json(backgroundsCache.data);
    }

    const data = await listBackgrounds();
    backgroundsCache = { data, timestamp: now };

    return res.json(data);
  } catch (error) {
    console.error('Failed to list backgrounds:', error);
    return res.status(500).json({ error: 'Failed to load backgrounds' });
  }
}
