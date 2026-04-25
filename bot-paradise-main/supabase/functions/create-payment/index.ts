import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { createServiceClient, getUserFromRequest } from "../_shared/supabase.ts";
import { createPaymentSession } from "../_shared/payments.ts";

type CartInput = {
  botId?: string;
  productId?: string;
  id?: string;
};

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const { user, error: authError } = await getUserFromRequest(req);
    if (!user) return jsonResponse({ error: authError ?? "Unauthenticated" }, 401);

    const body = await req.json().catch(() => ({}));
    const payCurrency = String(body.payCurrency ?? "btc").toLowerCase();
    const items = Array.isArray(body.items) ? (body.items as CartInput[]) : [];
    const botIds = Array.from(
      new Set(items.map((item) => item.botId ?? item.productId ?? item.id).filter(Boolean)),
    ) as string[];

    if (botIds.length === 0) return jsonResponse({ error: "Cart is empty" }, 400);

    const service = createServiceClient();
    const { data: bots, error: botsError } = await service
      .from("bots")
      .select("id,name,price_usd,is_published")
      .in("id", botIds)
      .eq("is_published", true);

    if (botsError) throw botsError;
    if (!bots || bots.length !== botIds.length) {
      return jsonResponse({ error: "One or more bots are unavailable" }, 400);
    }

    const totalUsd = bots.reduce((sum, bot) => sum + Number(bot.price_usd), 0);
    if (totalUsd <= 0) return jsonResponse({ error: "Order total must be greater than zero" }, 400);

    const expiresAt = new Date(Date.now() + 45 * 60 * 1000).toISOString();
    const { data: order, error: orderError } = await service
      .from("orders")
      .insert({
        user_id: user.id,
        status: "pending",
        total_usd: Number(totalUsd.toFixed(2)),
        payment_provider: null,
        payment_currency: payCurrency.toUpperCase(),
        expires_at: expiresAt,
        metadata: { item_count: bots.length },
      })
      .select("id,order_number,total_usd")
      .single();

    if (orderError || !order) throw orderError ?? new Error("Could not create order");

    const { error: itemsError } = await service.from("order_items").insert(
      bots.map((bot) => ({
        order_id: order.id,
        bot_id: bot.id,
        bot_name: bot.name,
        unit_price_usd: Number(bot.price_usd),
        quantity: 1,
      })),
    );

    if (itemsError) throw itemsError;

    const payment = await createPaymentSession({
      orderId: order.id,
      totalUsd,
      payCurrency,
      description: `CipherBots order ${order.order_number ?? order.id}`,
    });

    const { error: txError } = await service.from("transactions").insert({
      order_id: order.id,
      user_id: user.id,
      provider: payment.provider,
      provider_payment_id: payment.providerPaymentId,
      network: payment.network,
      pay_currency: payment.payCurrency,
      pay_amount: payment.payAmount,
      pay_address: payment.payAddress,
      expected_usd: Number(totalUsd.toFixed(2)),
      status: "pending",
      provider_payload: payment.raw,
    });

    if (txError) throw txError;

    const { error: updateError } = await service
      .from("orders")
      .update({
        payment_provider: payment.provider,
        payment_id: payment.providerPaymentId,
        payment_address: payment.payAddress,
        payment_currency: payment.payCurrency,
        payment_amount: payment.payAmount,
      })
      .eq("id", order.id);

    if (updateError) throw updateError;

    return jsonResponse({
      orderId: order.id,
      orderNumber: order.order_number,
      totalUsd: Number(totalUsd.toFixed(2)),
      expiresAt,
      payment: {
        provider: payment.provider,
        paymentId: payment.providerPaymentId,
        address: payment.payAddress,
        amount: payment.payAmount,
        currency: payment.payCurrency,
        network: payment.network,
      },
    });
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
