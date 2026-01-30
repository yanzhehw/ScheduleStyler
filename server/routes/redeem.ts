import { Router, Request, Response } from "express";
import crypto from "crypto";
import { supabase } from "../lib/supabase";

export const redeemRouter = Router();

interface RedeemRequest {
  code?: string;
}

redeemRouter.post("/", async (req: Request, res: Response) => {
  const payload = req.body as RedeemRequest;

  const code = payload.code?.trim();
  if (!code) {
    res.status(400).json({ error: "Code is required" });
    return;
  }

  try {
    const { data, error } = await supabase
      .from("passcodes")
      .select("code,status,activation_token,expires_at")
      .eq("code", code)
      .maybeSingle();

    if (error) {
      console.error("Database error:", error);
      res.status(500).json({ error: "Database error" });
      return;
    }

    if (!data) {
      res.status(404).json({ error: "Code not found" });
      return;
    }

    if (data.status === "USED") {
      res.status(400).json({ error: "Code already used" });
      return;
    }

    const now = new Date();
    const existingExpiresAt = data.expires_at
      ? new Date(data.expires_at)
      : null;

    // Return existing valid activation
    if (
      data.status === "ACTIVATED" &&
      existingExpiresAt &&
      existingExpiresAt > now &&
      data.activation_token
    ) {
      res.json({
        activationToken: data.activation_token,
        expiresAt: existingExpiresAt.toISOString(),
      });
      return;
    }

    // Create new activation
    const activationToken = crypto.randomUUID();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes

    const { data: updated, error: updateError } = await supabase
      .from("passcodes")
      .update({
        status: "ACTIVATED",
        activation_token: activationToken,
        activated_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .eq("code", code)
      .select("activation_token,expires_at")
      .maybeSingle();

    if (updateError || !updated) {
      console.error("Update error:", updateError);
      res.status(500).json({ error: "Failed to activate code" });
      return;
    }

    res.json({
      activationToken: updated.activation_token,
      expiresAt: updated.expires_at,
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
