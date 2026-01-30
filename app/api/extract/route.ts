import { createServerClient } from "../../../lib/supabase/server";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json",
};

type ExtractRequest = {
  activationToken?: string;
  imageBase64?: string;
};

const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), { status, headers: NO_STORE_HEADERS });

const errorResponse = (message: string, status: number) =>
  jsonResponse({ error: message }, status);

export async function POST(request: Request) {
  let payload: ExtractRequest;
  try {
    payload = (await request.json()) as ExtractRequest;
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const activationToken = payload.activationToken?.trim();
  const imageBase64 = payload.imageBase64?.trim();

  if (!activationToken || !imageBase64) {
    return errorResponse("Activation token and image data are required", 400);
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("passcodes")
    .select("code,status,activation_token,expires_at")
    .eq("activation_token", activationToken)
    .maybeSingle();

  if (error) {
    return errorResponse("Database error", 500);
  }

  if (!data) {
    return errorResponse("Invalid or expired token", 401);
  }

  const now = new Date();
  const expiresAt = data.expires_at ? new Date(data.expires_at) : null;
  const isExpired = !expiresAt || expiresAt <= now;

  if (data.status !== "ACTIVATED" || isExpired) {
    return errorResponse("Invalid or expired token", 401);
  }

  // Stub processing; replace with actual extraction.
  const extracted = { message: "stub" };

  const { error: updateError } = await supabase
    .from("passcodes")
    .update({
      status: "USED",
      used_at: now.toISOString(),
      activation_token: null,
    })
    .eq("code", data.code);

  if (updateError) {
    return errorResponse("Failed to finalize extraction", 500);
  }

  return jsonResponse({ ok: true, extracted });
}
