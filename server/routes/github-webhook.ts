import { Router, Request, Response } from "express";
import crypto from "crypto";
import { supabase } from "../lib/supabase";

export const githubWebhookRouter = Router();

const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;

/**
 * Verify GitHub webhook signature
 */
function verifySignature(payload: string, signature: string | undefined): boolean {
  if (!WEBHOOK_SECRET || !signature) {
    console.warn("[github-webhook] Missing secret or signature");
    return false;
  }

  const expected = `sha256=${crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(payload)
    .digest("hex")}`;

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

/**
 * Update star count in Supabase
 */
async function updateStarCount(action: "created" | "deleted"): Promise<void> {
  try {
    if (action === "created") {
      const { error } = await supabase.rpc("increment_counter", { counter_id: "stars" });
      if (error) {
        console.error("[github-webhook] Failed to increment stars:", error.message);
      } else {
        console.log("[github-webhook] ⭐ Star added");
      }
    } else if (action === "deleted") {
      // Decrement: use raw SQL since we need count - 1
      const { error } = await supabase.rpc("decrement_counter", { counter_id: "stars" });
      if (error) {
        console.error("[github-webhook] Failed to decrement stars:", error.message);
      } else {
        console.log("[github-webhook] Star removed");
      }
    }
  } catch (err) {
    console.error("[github-webhook] Unexpected error:", err);
  }
}

/**
 * POST /api/webhooks/github
 * Receives GitHub webhook events
 */
githubWebhookRouter.post("/", (req: Request, res: Response) => {
  const signature = req.headers["x-hub-signature-256"] as string | undefined;
  const event = req.headers["x-github-event"] as string;
  const payload = JSON.stringify(req.body);

  // Verify signature
  if (!verifySignature(payload, signature)) {
    console.warn("[github-webhook] Invalid signature");
    res.status(401).json({ error: "Invalid signature" });
    return;
  }

  console.log(`[github-webhook] Received event: ${event}`);

  // Handle star events
  if (event === "star") {
    const action = req.body.action as "created" | "deleted";
    updateStarCount(action);
  }

  // Always respond quickly
  res.json({ received: true });
});
