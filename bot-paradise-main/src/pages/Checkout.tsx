import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Bot, Check, Copy, Loader2, RefreshCcw } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/useAuth";
import { useCart } from "@/contexts/useCart";
import { toast } from "sonner";

interface Order {
  id: string;
  order_number: string | null;
  status: string;
  total_usd: number;
  payment_provider: string | null;
  payment_address: string | null;
  payment_currency: string | null;
  payment_amount: number | null;
  expires_at: string | null;
}

interface Transaction {
  id: string;
  status: string;
  pay_currency: string;
  pay_amount: number | null;
  pay_address: string | null;
  network: string | null;
}

const Checkout = () => {
  const { orderId } = useParams();
  const { user } = useAuth();
  const { clear } = useCart();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  const load = useCallback(async () => {
    if (!orderId || !user) return;
    setLoading(true);

    const [{ data: orderData }, { data: txData }] = await Promise.all([
      supabase.from("orders").select("*").eq("id", orderId).maybeSingle(),
      supabase
        .from("transactions")
        .select("id,status,pay_currency,pay_amount,pay_address,network")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    setOrder(orderData as Order | null);
    setTransaction(txData as Transaction | null);
    setLoading(false);
  }, [orderId, user]);

  useEffect(() => {
    document.title = "Checkout - Quro";
    load();
  }, [load]);

  const handleVerifyPayment = async () => {
    if (!order) return;
    setChecking(true);
    const { data, error } = await supabase.functions.invoke("verify-payment", {
      body: { orderId: order.id, demoConfirm: order.payment_provider === "demo" },
    });
    setChecking(false);

    if (error || data?.error) {
      toast.error(error?.message ?? data?.error ?? "Could not verify payment");
      return;
    }

    if (data?.status === "paid") {
      clear();
      toast.success("Payment verified. Your licenses are ready.");
      navigate("/dashboard/purchases");
      return;
    }

    toast.info(`Payment status: ${data?.status ?? "pending"}`);
    load();
  };

  if (loading) {
    return (
      <SiteLayout>
        <div className="container py-20 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        </div>
      </SiteLayout>
    );
  }

  if (!order) {
    return (
      <SiteLayout>
        <div className="container py-20 text-center">
          <h1 className="font-display text-2xl font-bold mb-4">Order not found</h1>
          <Button variant="outline" asChild><Link to="/marketplace">Back to marketplace</Link></Button>
        </div>
      </SiteLayout>
    );
  }

  if (order.status === "paid") {
    return (
      <SiteLayout>
        <div className="container py-20 max-w-lg text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/15 border border-success/30 mb-6">
            <Check className="h-8 w-8 text-success" />
          </div>
          <h1 className="font-display text-3xl font-bold mb-3">Payment received</h1>
          <p className="text-muted-foreground mb-8">Your bots and licenses are ready.</p>
          <Button variant="hero" size="lg" asChild>
            <Link to="/dashboard/purchases">Go to my bots</Link>
          </Button>
        </div>
      </SiteLayout>
    );
  }

  const address = transaction?.pay_address ?? order.payment_address ?? "";
  const amount = transaction?.pay_amount ?? order.payment_amount;
  const currency = transaction?.pay_currency ?? order.payment_currency ?? "BTC";

  return (
    <SiteLayout>
      <div className="container py-12 max-w-xl">
        <Badge variant="outline" className="mb-3 border-primary/30 text-primary">Crypto Checkout</Badge>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-2">Complete your payment</h1>
        <p className="text-muted-foreground mb-8">Send the exact amount to the generated address. The backend verifies the transaction before access is granted.</p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong rounded-2xl p-7"
        >
          <div className="flex justify-between items-baseline mb-6">
            <span className="text-sm text-muted-foreground">Amount due</span>
            <span className="font-display text-3xl font-bold text-gradient">${Number(order.total_usd).toFixed(2)}</span>
          </div>

          <div className="bg-muted/30 rounded-xl p-4 mb-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Send {currency} to</div>
            <div className="flex items-center gap-2">
              <code className="font-mono text-sm break-all flex-1">{address || "Payment address pending"}</code>
              <Button
                variant="outline"
                size="icon"
                disabled={!address}
                onClick={() => {
                  navigator.clipboard.writeText(address);
                  toast.success("Address copied");
                }}
                aria-label="Copy"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
            <div className="glass rounded-lg p-3">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Crypto amount</div>
              <div className="font-mono font-semibold">{amount ? Number(amount).toFixed(8) : "-"} {currency}</div>
            </div>
            <div className="glass rounded-lg p-3">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Network</div>
              <div className="font-mono font-semibold uppercase">{transaction?.network ?? "provider"}</div>
            </div>
          </div>

          <Button variant="hero" size="lg" className="w-full" onClick={handleVerifyPayment} disabled={checking}>
            {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            Check payment status
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-3">
            Verification is handled by the Edge Function using the configured payment provider.
          </p>
        </motion.div>

        <div className="mt-6 glass rounded-2xl p-5 flex items-start gap-3">
          <div className="bg-primary/10 rounded-lg p-2 mt-0.5">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div className="text-sm">
            <div className="font-medium mb-0.5">{order.order_number ?? `Order ${order.id.slice(0, 8)}`}</div>
            <div className="text-muted-foreground">Status: <span className="text-warning capitalize">{transaction?.status ?? order.status}</span></div>
            {order.expires_at && (
              <div className="text-muted-foreground text-xs mt-1">Expires {new Date(order.expires_at).toLocaleString()}</div>
            )}
          </div>
        </div>
      </div>
    </SiteLayout>
  );
};

export default Checkout;
