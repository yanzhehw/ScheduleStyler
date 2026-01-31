import { createServerClient } from "../../../lib/supabase/server";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json",
};

type MarkUsedRequest = {
  activationToken?: string;
};

const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), { status, headers: NO_STORE_HEADERS });

const errorResponse = (message: string, status: number) =>
  jsonResponse({ error: message }, status);

export async function POST(request: Request) {
  console.log("[mark-used API] Received request");

  let payload: MarkUsedRequest;
  try {
    payload = (await request.json()) as MarkUsedRequest;
  } catch {
    console.log("[mark-used API] ❌ Invalid JSON body");
    return errorResponse("Invalid JSON body", 400);
  }

  const activationToken = payload.activationToken?.trim();
  console.log("[mark-used API] Activation token received:", activationToken ? `${activationToken.substring(0, 8)}...` : "none");

  if (!activationToken) {
    console.log("[mark-used API] ❌ No activation token provided");
    return errorResponse("Activation token is required", 400);
  }

  const supabase = createServerClient();
  console.log("[mark-used API] Looking up passcode by activation_token...");

  const { data, error } = await supabase
    .from("passcodes")
    .select("code,status,activation_token,expires_at")
    .eq("activation_token", activationToken)
    .maybeSingle();

  if (error) {
    console.log("[mark-used API] ❌ Database error:", error.message);
    return errorResponse("Database error", 500);
  }

  if (!data) {
    console.log("[mark-used API] ❌ No passcode found for this activation token");
    return errorResponse("Invalid or expired token", 401);
  }

  console.log("[mark-used API] Found passcode:", { code: data.code, status: data.status, expires_at: data.expires_at });

  // Check if already used
  if (data.status === "USED") {
    console.log("[mark-used API] ⚠️ Code already marked as USED (idempotent success)");
    // Already marked as used, return success (idempotent)
    return jsonResponse({ ok: true, alreadyUsed: true });
  }

  const now = new Date();
  const expiresAt = data.expires_at ? new Date(data.expires_at) : null;
  const isExpired = !expiresAt || expiresAt <= now;

  if (data.status !== "ACTIVATED" || isExpired) {
    console.log("[mark-used API] ❌ Token not valid:", { status: data.status, isExpired });
    return errorResponse("Invalid or expired token", 401);
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
    return errorResponse("Failed to mark code as used", 500);
  }

  console.log("[mark-used API] ✅ Successfully marked code as USED:", {
    code: data.code,
    used_at: now.toISOString(),
    activation_token: "cleared (null)"
  });

  return jsonResponse({ ok: true });
}
