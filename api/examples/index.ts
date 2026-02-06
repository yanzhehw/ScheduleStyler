import type { VercelRequest, VercelResponse } from '@vercel/node';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

export interface ExampleImage {
  id: string;
  filename: string;
  type: 'products' | 'texture';
  url: string;
  name: string;
}

export interface ExamplesResponse {
  products: ExampleImage[];
  texture: ExampleImage[];
}

function getR2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID || '';
  const endpoint = accountId.startsWith('https://')
    ? accountId
    : `https://${accountId}.r2.cloudflarestorage.com`;

  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('R2 credentials not configured');
  }

  return new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
}

async function listExamples(): Promise<ExamplesResponse> {
  const products: ExampleImage[] = [];
  const texture: ExampleImage[] = [];
  const bucket = process.env.R2_BUCKET_NAME || 'schedule-styler-backgrounds';
  const client = getR2Client();

  // List product examples
  const productsResponse = await client.send(
    new ListObjectsV2Command({ Bucket: bucket, Prefix: 'examples/products/' })
  );

  for (const obj of productsResponse.Contents || []) {
    if (!obj.Key || obj.Key.endsWith('/')) continue;
    const filename = obj.Key.split('/').pop()!;
    const baseName = filename.replace(/\.[^.]+$/, '');

    products.push({
      id: `product_${baseName}`,
      filename,
      type: 'products',
      url: `/api/examples/products/${encodeURIComponent(filename)}`,
      name: baseName.replace(/[-_]/g, ' '),
    });
  }

  // List texture examples
  const textureResponse = await client.send(
    new ListObjectsV2Command({ Bucket: bucket, Prefix: 'examples/texture/' })
  );

  for (const obj of textureResponse.Contents || []) {
    if (!obj.Key || obj.Key.endsWith('/')) continue;
    const filename = obj.Key.split('/').pop()!;
    const baseName = filename.replace(/\.[^.]+$/, '');

    texture.push({
      id: `texture_${baseName}`,
      filename,
      type: 'texture',
      url: `/api/examples/texture/${encodeURIComponent(filename)}`,
      name: baseName.replace(/[-_]/g, ' '),
    });
  }

  // Sort by filename numerically
  products.sort((a, b) => a.filename.localeCompare(b.filename, undefined, { numeric: true }));
  texture.sort((a, b) => a.filename.localeCompare(b.filename, undefined, { numeric: true }));

  return { products, texture };
}

// Cache for examples list
let examplesCache: { data: ExamplesResponse; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const now = Date.now();

    if (examplesCache && now - examplesCache.timestamp < CACHE_TTL) {
      return res.json(examplesCache.data);
    }

    const data = await listExamples();
    examplesCache = { data, timestamp: now };

    return res.json(data);
  } catch (error) {
    console.error('Failed to list examples:', error);
    return res.status(500).json({ error: 'Failed to load examples' });
  }
}
