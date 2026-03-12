import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import type { Readable } from 'stream';
import { getR2Client } from '../../lib/r2.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, filename } = req.query;

  if (typeof type !== 'string' || typeof filename !== 'string') {
    return res.status(400).json({ error: 'Invalid parameters' });
  }

  const validTypes = ['landscape', 'portrait', 'thumbnails_landscape', 'thumbnails_portrait'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: 'Invalid type' });
  }

  const decodedFilename = decodeURIComponent(filename);
  const key = `${type}/${decodedFilename}`;
  const bucket = process.env.R2_BUCKET_NAME || 'schedule-styler-backgrouds';

  try {
    const client = getR2Client();
    const response = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key })
    );

    if (!response.Body) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const ext = key.split('.').pop()?.toLowerCase();
    const contentType =
      { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }[ext || ''] ||
      'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, s-maxage=31536000, max-age=31536000, immutable');
    if (response.ContentLength) {
      res.setHeader('Content-Length', response.ContentLength);
    }

    // Stream the response
    const stream = response.Body as Readable;
    stream.pipe(res);
  } catch (error: any) {
    if (error.name === 'NoSuchKey') {
      return res.status(404).json({ error: 'Image not found' });
    }
    console.error('Failed to serve image:', error);
    return res.status(500).json({ error: 'Failed to load image' });
  }
}
