import { S3Client } from '@aws-sdk/client-s3';

export function getR2Client(): S3Client {
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
