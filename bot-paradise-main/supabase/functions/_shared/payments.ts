type CreatePaymentArgs = {
  orderId: string;
  totalUsd: number;
  payCurrency: string;
  description: string;
};

export type CreatedPayment = {
  provider: string;
  providerPaymentId: string;
  payAddress: string;
  payAmount: number;
  payCurrency: string;
  network: string | null;
  raw: Record<string, unknown>;
};

export type PaymentVerification = {
  status: "pending" | "confirming" | "confirmed" | "failed" | "expired";
  txHash: string | null;
  confirmations: number;
  raw: Record<string, unknown>;
};

const providerName = () => (Deno.env.get("PAYMENT_PROVIDER") || "demo").toLowerCase();

const nowPaymentsUrl = () => Deno.env.get("NOWPAYMENTS_API_URL") || "https://api.nowpayments.io/v1";

const nowPaymentsKey = () => {
  const key = Deno.env.get("NOWPAYMENTS_API_KEY");
  if (!key) throw new Error("NOWPAYMENTS_API_KEY is required when PAYMENT_PROVIDER=nowpayments");
  return key;
};

const assertOk = async (res: Response, context: string) => {
  if (res.ok) return;
  const text = await res.text();
  throw new Error(`${context} failed (${res.status}): ${text}`);
};

export const createPaymentSession = async ({
  orderId,
  totalUsd,
  payCurrency,
  description,
}: CreatePaymentArgs): Promise<CreatedPayment> => {
  const provider = providerName();

  if (provider === "nowpayments") {
    const res = await fetch(`${nowPaymentsUrl()}/payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": nowPaymentsKey(),
      },
      body: JSON.stringify({
        price_amount: Number(totalUsd.toFixed(2)),
        price_currency: "usd",
        pay_currency: payCurrency.toLowerCase(),
        order_id: orderId,
        order_description: description,
      }),
    });

    await assertOk(res, "NOWPayments create payment");
    const raw = await res.json();

    return {
      provider,
      providerPaymentId: String(raw.payment_id),
      payAddress: String(raw.pay_address ?? ""),
      payAmount: Number(raw.pay_amount ?? 0),
      payCurrency: String(raw.pay_currency ?? payCurrency).toUpperCase(),
      network: raw.network ? String(raw.network) : null,
      raw,
    };
  }

  const normalizedCurrency = payCurrency.toUpperCase();
  const addressSeed = orderId.replaceAll("-", "").slice(0, 30);

  return {
    provider: "demo",
    providerPaymentId: `demo_${orderId}`,
    payAddress: `demo_${normalizedCurrency.toLowerCase()}_${addressSeed}`,
    payAmount: Number(totalUsd.toFixed(2)),
    payCurrency: normalizedCurrency,
    network: "demo",
    raw: {
      mode: "demo",
      note: "Set PAYMENT_PROVIDER=nowpayments and NOWPAYMENTS_API_KEY for live crypto verification.",
    },
  };
};

export const verifyPaymentSession = async (
  provider: string,
  providerPaymentId: string | null,
  demoConfirm = false,
): Promise<PaymentVerification> => {
  if (provider === "nowpayments") {
    if (!providerPaymentId) throw new Error("Missing provider payment id");

    const res = await fetch(`${nowPaymentsUrl()}/payment/${providerPaymentId}`, {
      headers: { "x-api-key": nowPaymentsKey() },
    });

    await assertOk(res, "NOWPayments verify payment");
    const raw = await res.json();
    const paymentStatus = String(raw.payment_status ?? "").toLowerCase();

    if (["finished", "confirmed"].includes(paymentStatus)) {
      return {
        status: "confirmed",
        txHash: raw.payin_hash ? String(raw.payin_hash) : null,
        confirmations: Number(raw.confirmations ?? 0),
        raw,
      };
    }

    if (["confirming", "sending"].includes(paymentStatus)) {
      return {
        status: "confirming",
        txHash: raw.payin_hash ? String(raw.payin_hash) : null,
        confirmations: Number(raw.confirmations ?? 0),
        raw,
      };
    }

    if (paymentStatus === "expired") {
      return {
        status: "expired",
        txHash: raw.payin_hash ? String(raw.payin_hash) : null,
        confirmations: Number(raw.confirmations ?? 0),
        raw,
      };
    }

    if (["failed", "refunded"].includes(paymentStatus)) {
      return {
        status: "failed",
        txHash: raw.payin_hash ? String(raw.payin_hash) : null,
        confirmations: Number(raw.confirmations ?? 0),
        raw,
      };
    }

    return {
      status: "pending",
      txHash: raw.payin_hash ? String(raw.payin_hash) : null,
      confirmations: Number(raw.confirmations ?? 0),
      raw,
    };
  }

  const demoAllowed = Deno.env.get("ALLOW_DEMO_PAYMENT_CONFIRM") === "true";
  return {
    status: demoAllowed && demoConfirm ? "confirmed" : "pending",
    txHash: demoAllowed && demoConfirm ? `demo_tx_${crypto.randomUUID()}` : null,
    confirmations: demoAllowed && demoConfirm ? 1 : 0,
    raw: {
      mode: "demo",
      confirmed: demoAllowed && demoConfirm,
    },
  };
};
