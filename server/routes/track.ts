import { Router, Request, Response } from "express";
import { supabase } from "../lib/supabase";

export const trackRouter = Router();

/**
 * Fire-and-forget counter increment helper.
 * Logs errors but never throws - ensures the endpoint always succeeds.
 */
async function incrementCounter(counterId: "downloads" | "users"): Promise<void> {
  try {
    const { error } = await supabase.rpc("increment_counter", {
      counter_id: counterId,
    });

    if (error) {
      console.error(`[track] Failed to increment '${counterId}':`, error.message);
    } else {
      console.log(`[track] ✅ Successfully incremented '${counterId}'`);
    }
  } catch (err) {
    console.error(`[track] Unexpected error incrementing '${counterId}':`, err);
  }
}

/**
 * POST /api/track/download
 * Increments the downloads counter. Fire-and-forget.
 */
trackRouter.post("/download", (_req: Request, res: Response) => {
  console.log("[track] POST /api/track/download called");
  // Don't await - fire and forget
  incrementCounter("downloads");

  // Always return success immediately
  res.json({ success: true });
});

/**
 * POST /api/track/user
 * Increments the users counter. Fire-and-forget.
 */
trackRouter.post("/user", (_req: Request, res: Response) => {
  console.log("[track] POST /api/track/user called");
  // Don't await - fire and forget
  incrementCounter("users");

  // Always return success immediately
  res.json({ success: true });
});

/**
 * GET /api/track/stats
 * Returns current counter values.
 */
trackRouter.get("/stats", async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("counters")
      .select("id, count")
      .in("id", ["downloads", "users", "stars"]);

    if (error) {
      console.error("[track] Failed to fetch stats:", error.message);
      res.json({ downloads: 0, users: 0, stars: 0 });
      return;
    }

    const stats = {
      downloads: 0,
      users: 0,
      stars: 0,
    };

    for (const row of data || []) {
      if (row.id === "downloads") {
        stats.downloads = Number(row.count);
      } else if (row.id === "users") {
        stats.users = Number(row.count);
      } else if (row.id === "stars") {
        stats.stars = Number(row.count);
      }
    }

    res.json(stats);
  } catch (err) {
    console.error("[track] Unexpected error fetching stats:", err);
    res.json({ downloads: 0, users: 0, stars: 0 });
  }
});
