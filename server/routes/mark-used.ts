import { Router, Request, Response } from "express";
import { supabase } from "../lib/supabase";

export const markUsedRouter = Router();

interface MarkUsedRequest {
  activationToken?: string;
}

markUsedRouter.post("/", async (req: Request, res: Response) => {
  console.log("[mark-used API] Received request");

  const payload = req.body as MarkUsedRequest;
  const activationToken = payload.activationToken?.trim();

  console.log("[mark-used API] Activation token received:", activationToken ? `${activationToken.substring(0, 8)}...` : "none");

  if (!activationToken) {
    console.log("[mark-used API] ❌ No activation token provided");
    res.status(400).json({ error: "Activation token is required" });
    return;
  }

  try {
    console.log("[mark-used API] Looking up passcode by activation_token...");

    const { data, error } = await supabase
      .from("passcodes")
      .select("code,status,activation_token,expires_at")
      .eq("activation_token", activationToken)
      .maybeSingle();

    if (error) {
      console.log("[mark-used API] ❌ Database error:", error.message);
      res.status(500).json({ error: "Database error" });
      return;
    }

    if (!data) {
      console.log("[mark-used API] ❌ No passcode found for this activation token");
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }

    console.log("[mark-used API] Found passcode:", { code: data.code, status: data.status, expires_at: data.expires_at });

    // Check if already used
    if (data.status === "USED") {
      console.log("[mark-used API] ⚠️ Code already marked as USED (idempotent success)");
      res.json({ ok: true, alreadyUsed: true });
      return;
    }

    const now = new Date();
    const expiresAt = data.expires_at ? new Date(data.expires_at) : null;
    const isExpired = !expiresAt || expiresAt <= now;

    if (data.status !== "ACTIVATED" || isExpired) {
      console.log("[mark-used API] ❌ Token not valid:", { status: data.status, isExpired });
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }

    // Mark the code as used
    console.log("[mark-used API] Updating database: setting status=USED, used_at, clearing activation_token...");
    const { error: updateError } = await supabase
      .from("passcodes")
      .update({
        status: "USED",
        used_at: now.toISOString(),
        activation_token: null,
      })
      .eq("code", data.code);

    if (updateError) {
      console.log("[mark-used API] ❌ Failed to update:", updateError.message);
      res.status(500).json({ error: "Failed to mark code as used" });
      return;
    }

    console.log("[mark-used API] ✅ Successfully marked code as USED:", {
      code: data.code,
      used_at: now.toISOString(),
      activation_token: "cleared (null)"
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("[mark-used API] ❌ Unexpected error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
