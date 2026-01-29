import { Router } from 'express';
import type { Request, Response } from 'express';
import { listBackgrounds, getImageStream, type BackgroundsResponse } from '../services/r2Client.js';

const router = Router();

// Cache for background list (refresh every 5 minutes)
let backgroundsCache: { data: BackgroundsResponse; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

/**
 * GET /api/backgrounds
 * List all available backgrounds from R2
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const now = Date.now();

    // Return cached data if still valid
    if (backgroundsCache && now - backgroundsCache.timestamp < CACHE_TTL) {
      return res.json(backgroundsCache.data);
    }

    const data = await listBackgrounds();
    backgroundsCache = { data, timestamp: now };

    res.json(data);
  } catch (error) {
    console.error('Failed to list backgrounds:', error);
    res.status(500).json({ error: 'Failed to load backgrounds' });
  }
});

/**
 * GET /api/backgrounds/:type/:filename
 * Serve an image from R2
 * :type is one of: landscape, portrait, thumbnails_landscape, thumbnails_portrait
 */
router.get('/:type/:filename', async (req: Request<{ type: string; filename: string }>, res: Response) => {
  const { type, filename } = req.params;

  // Validate type parameter
  const validTypes = ['landscape', 'portrait', 'thumbnails_landscape', 'thumbnails_portrait'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: 'Invalid type. Must be one of: ' + validTypes.join(', ') });
  }

  // Construct R2 key
  const decodedFilename = decodeURIComponent(filename);
  const key = `${type}/${decodedFilename}`;

  try {
    const result = await getImageStream(key);

    if (!result) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Set response headers
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // 1 year cache
    if (result.contentLength) {
      res.setHeader('Content-Length', result.contentLength);
    }

    // Pipe the stream to response
    result.stream.pipe(res);
  } catch (error) {
    console.error('Failed to serve image:', key, error);
    res.status(500).json({ error: 'Failed to load image' });
  }
});

export default router;
