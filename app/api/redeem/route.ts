import crypto from "crypto";

import { createServerClient } from "../../../lib/supabase/server";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json",
};

type RedeemRequest = {
  code?: string;
};

const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), { status, headers: NO_STORE_HEADERS });

const errorResponse = (message: string, status: number) =>
  jsonResponse({ error: message }, status);

export async function POST(request: Request) {
  let payload: RedeemRequest;
  try {
    payload = (await request.json()) as RedeemRequest;
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const code = payload.code?.trim();
  if (!code) {
    return errorResponse("Code is required", 400);
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("passcodes")
    .select("code,status,activation_token,expires_at")
    .eq("code", code)
    .maybeSingle();

  if (error) {
    return errorResponse("Database error", 500);
  }

  if (!data) {
    return errorResponse("Code not found", 404);
  }

  if (data.status === "USED") {
    return errorResponse("Code already used", 400);
  }

  const now = new Date();
  const existingExpiresAt = data.expires_at
    ? new Date(data.expires_at)
    : null;

  if (
    data.status === "ACTIVATED" &&
    existingExpiresAt &&
    existingExpiresAt > now &&
    data.activation_token
  ) {
    return jsonResponse({
      activationToken: data.activation_token,
      expiresAt: existingExpiresAt.toISOString(),
    });
  }

  const activationToken = crypto.randomUUID();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);

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
    return errorResponse("Failed to activate code", 500);
  }

  return jsonResponse({
    activationToken: updated.activation_token,
    expiresAt: updated.expires_at,
  });
}
