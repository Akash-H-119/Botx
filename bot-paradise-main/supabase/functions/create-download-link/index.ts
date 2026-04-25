import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { createServiceClient, getUserFromRequest } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const { user, error: authError } = await getUserFromRequest(req);
    if (!user) return jsonResponse({ error: authError ?? "Unauthenticated" }, 401);

    const body = await req.json().catch(() => ({}));
    const botId = String(body.botId ?? body.productId ?? "");
    if (!botId) return jsonResponse({ error: "Missing botId" }, 400);

    const service = createServiceClient();
    const { data: license, error: licenseError } = await service
      .from("licenses")
      .select("id,status,expires_at")
      .eq("user_id", user.id)
      .eq("bot_id", botId)
      .eq("status", "active")
      .order("issued_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (licenseError) throw licenseError;
    if (!license) return jsonResponse({ error: "No active license for this bot" }, 403);

    if (license.expires_at && new Date(license.expires_at).getTime() < Date.now()) {
      await service.from("licenses").update({ status: "expired" }).eq("id", license.id);
      return jsonResponse({ error: "License expired" }, 403);
    }

    const { data: bot, error: botError } = await service
      .from("bots")
      .select("id,name,file_path")
      .eq("id", botId)
      .maybeSingle();

    if (botError) throw botError;
    if (!bot?.file_path) return jsonResponse({ error: "No downloadable file is attached to this bot" }, 404);

    const { data, error } = await service.storage
      .from("product-files")
      .createSignedUrl(bot.file_path, 60);

    if (error || !data) throw error ?? new Error("Could not create signed URL");

    return jsonResponse({
      signedUrl: data.signedUrl,
      expiresIn: 60,
      botName: bot.name,
    });
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
