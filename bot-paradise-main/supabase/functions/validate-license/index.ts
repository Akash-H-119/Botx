import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { createServiceClient } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== "POST") return jsonResponse({ valid: false, error: "Method not allowed" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const licenseKey = String(body.licenseKey ?? "").trim();
    const deviceId = String(body.deviceId ?? "").trim();
    const botId = body.botId ? String(body.botId) : null;

    if (!licenseKey || !deviceId) {
      return jsonResponse({ valid: false, error: "licenseKey and deviceId are required" }, 400);
    }

    const service = createServiceClient();
    const { data: license, error } = await service
      .from("licenses")
      .select("id,user_id,bot_id,status,max_activations,activations_count,activated_devices,expires_at")
      .eq("license_key", licenseKey)
      .maybeSingle();

    if (error) throw error;
    if (!license) return jsonResponse({ valid: false, error: "Invalid license" }, 404);
    if (botId && license.bot_id !== botId) return jsonResponse({ valid: false, error: "License is not for this bot" }, 403);

    if (license.status !== "active") {
      return jsonResponse({ valid: false, error: `License is ${license.status}` }, 403);
    }

    if (license.expires_at && new Date(license.expires_at).getTime() < Date.now()) {
      await service.from("licenses").update({ status: "expired" }).eq("id", license.id);
      return jsonResponse({ valid: false, error: "License expired" }, 403);
    }

    const devices = Array.isArray(license.activated_devices) ? license.activated_devices : [];
    const alreadyActivated = devices.some((entry) => entry && typeof entry === "object" && "device_id" in entry && entry.device_id === deviceId);

    if (!alreadyActivated && devices.length >= Number(license.max_activations)) {
      return jsonResponse({ valid: false, error: "Activation limit reached" }, 403);
    }

    const nextDevices = alreadyActivated
      ? devices.map((entry) =>
          entry && typeof entry === "object" && "device_id" in entry && entry.device_id === deviceId
            ? { ...entry, last_seen_at: new Date().toISOString() }
            : entry
        )
      : [
          ...devices,
          {
            device_id: deviceId,
            activated_at: new Date().toISOString(),
            last_seen_at: new Date().toISOString(),
          },
        ];

    const { error: updateError } = await service
      .from("licenses")
      .update({
        activated_devices: nextDevices,
        activations_count: nextDevices.length,
        last_checked_at: new Date().toISOString(),
      })
      .eq("id", license.id);

    if (updateError) throw updateError;

    return jsonResponse({
      valid: true,
      botId: license.bot_id,
      userId: license.user_id,
      activationsRemaining: Number(license.max_activations) - nextDevices.length,
      expiresAt: license.expires_at,
    });
  } catch (error) {
    console.error(error);
    return jsonResponse({ valid: false, error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
