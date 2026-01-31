import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import type { Readable } from "stream";
import { env } from "../env";

// Parse R2 endpoint - handles both full URL and just account ID
function getR2Endpoint(): string {
  const accountIdOrUrl = env.R2_ACCOUNT_ID || "";

  if (accountIdOrUrl.startsWith("https://")) {
    return accountIdOrUrl;
  }

  return `https://${accountIdOrUrl}.r2.cloudflarestorage.com`;
}

// Lazy-initialize R2 client
let r2Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (!r2Client) {
    const endpoint = getR2Endpoint();
    const accessKeyId = env.R2_ACCESS_KEY_ID;
    const secretAccessKey = env.R2_SECRET_ACCESS_KEY;

    if (!accessKeyId || !secretAccessKey) {
      throw new Error("R2 credentials not configured");
    }

    r2Client = new S3Client({
      region: "auto",
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }
  return r2Client;
}

export interface BackgroundMetadata {
  id: string;
  filename: string;
  type: "landscape" | "portrait";
  url: string;
  thumbnailUrl: string;
  name: string;
}

export interface BackgroundsResponse {
  landscape: BackgroundMetadata[];
  portrait: BackgroundMetadata[];
  map: Record<string, string>;
}

export async function listBackgrounds(): Promise<BackgroundsResponse> {
  const landscape: BackgroundMetadata[] = [];
  const portrait: BackgroundMetadata[] = [];
  const bucket = env.R2_BUCKET_NAME;

  // List landscape images
  const landscapeResponse = await getR2Client().send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: "landscape/",
    })
  );

  for (const obj of landscapeResponse.Contents || []) {
    if (!obj.Key || obj.Key.endsWith("/")) continue;
    const filename = obj.Key.split("/").pop()!;
    const baseName = filename.replace(/\.[^.]+$/, "");

    landscape.push({
      id: `l${baseName}`,
      filename,
      type: "landscape",
      url: `/api/backgrounds/landscape/${encodeURIComponent(filename)}`,
      thumbnailUrl: `/api/backgrounds/thumbnails_landscape/${encodeURIComponent(filename)}`,
      name: `Landscape ${baseName}`,
    });
  }

  // List portrait images
  const portraitResponse = await getR2Client().send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: "portrait/",
    })
  );

  for (const obj of portraitResponse.Contents || []) {
    if (!obj.Key || obj.Key.endsWith("/")) continue;
    const filename = obj.Key.split("/").pop()!;
    const baseName = filename.replace(/\.[^.]+$/, "");

    portrait.push({
      id: baseName,
      filename,
      type: "portrait",
      url: `/api/backgrounds/portrait/${encodeURIComponent(filename)}`,
      thumbnailUrl: `/api/backgrounds/thumbnails_portrait/${encodeURIComponent(filename)}`,
      name: `Portrait ${baseName}`,
    });
  }

  // Sort by filename numerically
  landscape.sort((a, b) => a.filename.localeCompare(b.filename, undefined, { numeric: true }));
  portrait.sort((a, b) => a.filename.localeCompare(b.filename, undefined, { numeric: true }));

  // Build combined map
  const map: Record<string, string> = {};
  for (const bg of landscape) {
    map[bg.id] = bg.url;
  }
  for (const bg of portrait) {
    map[bg.id] = bg.url;
  }

  return { landscape, portrait, map };
}

export async function getImageStream(key: string): Promise<{
  stream: Readable;
  contentType: string;
  contentLength?: number;
} | null> {
  try {
    const response = await getR2Client().send(
      new GetObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: key,
      })
    );

    if (!response.Body) {
      return null;
    }

    const ext = key.split(".").pop()?.toLowerCase();
    const contentType =
      {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        webp: "image/webp",
      }[ext || ""] || "application/octet-stream";

    return {
      stream: response.Body as Readable,
      contentType,
      contentLength: response.ContentLength,
    };
  } catch (error: any) {
    if (error.name === "NoSuchKey") {
      return null;
    }
    throw error;
  }
}
