import { Router, Request, Response } from "express";
import { listBackgrounds, getImageStream, type BackgroundsResponse } from "../lib/r2";

export const backgroundsRouter = Router();

// Cache for background list (5 minutes)
let backgroundsCache: { data: BackgroundsResponse; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

// GET /api/backgrounds - List all backgrounds
backgroundsRouter.get("/", async (_req: Request, res: Response) => {
  try {
    const now = Date.now();

    if (backgroundsCache && now - backgroundsCache.timestamp < CACHE_TTL) {
      return res.json(backgroundsCache.data);
    }

    const data = await listBackgrounds();
    backgroundsCache = { data, timestamp: now };

    res.json(data);
  } catch (error) {
    console.error("Failed to list backgrounds:", error);
    res.status(500).json({ error: "Failed to load backgrounds" });
  }
});

// GET /api/backgrounds/:type/:filename - Serve image from R2
backgroundsRouter.get("/:type/:filename", async (req: Request<{ type: string; filename: string }>, res: Response) => {
  const { type, filename } = req.params;

  const validTypes = ["landscape", "portrait", "thumbnails_landscape", "thumbnails_portrait"];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: "Invalid type" });
  }

  const decodedFilename = decodeURIComponent(filename);
  const key = `${type}/${decodedFilename}`;

  try {
    const result = await getImageStream(key);

    if (!result) {
      return res.status(404).json({ error: "Image not found" });
    }

    res.setHeader("Content-Type", result.contentType);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    if (result.contentLength) {
      res.setHeader("Content-Length", result.contentLength);
    }

    result.stream.pipe(res);
  } catch (error) {
    console.error("Failed to serve image:", error);
    res.status(500).json({ error: "Failed to load image" });
  }
});
