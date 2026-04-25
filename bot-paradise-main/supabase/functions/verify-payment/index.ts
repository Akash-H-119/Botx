import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { createLicenseKey, addDays } from "../_shared/licenses.ts";
import { verifyPaymentSession } from "../_shared/payments.ts";
import { createServiceClient, getUserFromRequest, userIsAdmin } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const { user, error: authError } = await getUserFromRequest(req);
    if (!user) return jsonResponse({ error: authError ?? "Unauthenticated" }, 401);

    const body = await req.json().catch(() => ({}));
    const orderId = String(body.orderId ?? "");
    if (!orderId) return jsonResponse({ error: "Missing orderId" }, 400);

    const service = createServiceClient();
    const isAdmin = await userIsAdmin(service, user.id);

    const { data: order, error: orderError } = await service
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError) throw orderError;
    if (!order) return jsonResponse({ error: "Order not found" }, 404);
    if (order.user_id !== user.id && !isAdmin) return jsonResponse({ error: "Forbidden" }, 403);

    const { data: transaction, error: txError } = await service
      .from("transactions")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (txError) throw txError;
    if (!transaction) return jsonResponse({ error: "Payment transaction not found" }, 404);

    if (order.status === "paid" && transaction.status === "confirmed") {
      return jsonResponse({ status: "paid", orderId: order.id });
    }

    const verification = await verifyPaymentSession(
      transaction.provider,
      transaction.provider_payment_id,
      body.demoConfirm === true,
    );

    await service
      .from("transactions")
      .update({
        status: verification.status,
        tx_hash: verification.txHash,
        confirmations: verification.confirmations,
        provider_payload: verification.raw,
        confirmed_at: verification.status === "confirmed" ? new Date().toISOString() : transaction.confirmed_at,
      })
      .eq("id", transaction.id);

    if (verification.status === "failed" || verification.status === "expired") {
      await service
        .from("orders")
        .update({ status: verification.status === "expired" ? "cancelled" : "failed" })
        .eq("id", order.id);

      return jsonResponse({ status: verification.status, orderId: order.id });
    }

    if (verification.status !== "confirmed") {
      return jsonResponse({ status: verification.status, orderId: order.id });
    }

    const paidAt = new Date().toISOString();
    const { error: paidError } = await service
      .from("orders")
      .update({
        status: "paid",
        paid_at: paidAt,
        payment_id: transaction.provider_payment_id,
        payment_provider: transaction.provider,
        payment_address: transaction.pay_address,
        payment_currency: transaction.pay_currency,
        payment_amount: transaction.pay_amount,
      })
      .eq("id", order.id);

    if (paidError) throw paidError;

    const { data: items, error: itemsError } = await service
      .from("order_items")
      .select("bot_id,quantity")
      .eq("order_id", order.id);

    if (itemsError) throw itemsError;

    const botIds = Array.from(new Set((items ?? []).map((item) => item.bot_id)));
    const { data: bots, error: botsError } = await service
      .from("bots")
      .select("id,license_max_activations,license_expires_days")
      .in("id", botIds);

    if (botsError) throw botsError;
    const botById = new Map((bots ?? []).map((bot) => [bot.id, bot]));

    let licensesCreated = 0;
    for (const item of items ?? []) {
      const bot = botById.get(item.bot_id);
      if (!bot) continue;

      const { data: existing } = await service
        .from("licenses")
        .select("id")
        .eq("order_id", order.id)
        .eq("bot_id", item.bot_id)
        .eq("user_id", order.user_id)
        .maybeSingle();

      if (!existing) {
        const issuedAt = new Date();
        const { error: licenseError } = await service.from("licenses").insert({
          user_id: order.user_id,
          bot_id: item.bot_id,
          order_id: order.id,
          license_key: createLicenseKey(),
          status: "active",
          max_activations: Number(bot.license_max_activations ?? 1),
          expires_at: addDays(issuedAt, bot.license_expires_days),
        });

        if (licenseError) throw licenseError;
        licensesCreated += 1;
      }

      await service.rpc("increment_bot_sales", {
        _bot_id: item.bot_id,
        _quantity: Number(item.quantity ?? 1),
      });
    }

    return jsonResponse({
      status: "paid",
      orderId: order.id,
      paidAt,
      licensesCreated,
    });
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
