import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Receipt, RefreshCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Order {
  id: string;
  user_id: string;
  status: string;
  total_usd: number;
  created_at: string;
  paid_at: string | null;
  payment_provider: string | null;
}

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [checking, setChecking] = useState<string | null>(null);

  const load = () => {
    supabase.from("orders").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      setOrders((data ?? []) as Order[]);
    });
  };

  useEffect(() => {
    document.title = "Admin · Orders — Quro";
    load();
  }, []);

  const verifyPayment = async (order: Order) => {
    setChecking(order.id);
    const { data, error } = await supabase.functions.invoke("verify-payment", {
      body: { orderId: order.id, demoConfirm: order.payment_provider === "demo" },
    });
    setChecking(null);

    if (error || data?.error) {
      toast.error(error?.message ?? data?.error ?? "Could not verify payment");
      return;
    }

    toast.success(`Payment status: ${data.status}`);
    load();
  };

  const statusStyles: Record<string, string> = {
    paid: "bg-success/20 text-success border-success/30",
    pending: "bg-warning/20 text-warning border-warning/30",
    failed: "bg-destructive/20 text-destructive border-destructive/30",
    cancelled: "bg-muted text-muted-foreground border-border",
  };

  return (
    <AdminLayout>
      <h1 className="font-display text-3xl font-bold mb-2">Orders</h1>
      <p className="text-muted-foreground mb-8">Every order placed across the marketplace.</p>

      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left p-4">Order</th>
              <th className="text-left p-4 hidden md:table-cell">Date</th>
              <th className="text-left p-4">Total</th>
              <th className="text-left p-4">Status</th>
              <th className="text-right p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr><td colSpan={5} className="p-12 text-center text-muted-foreground">
                <Receipt className="h-10 w-10 mx-auto mb-2 opacity-30" />
                No orders yet.
              </td></tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-border/30 last:border-0 hover:bg-muted/20">
                <td className="p-4 font-mono text-xs">{o.id.slice(0, 12)}...</td>
                <td className="p-4 hidden md:table-cell text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                <td className="p-4 font-display font-semibold">${Number(o.total_usd).toFixed(2)}</td>
                <td className="p-4">
                  <Badge variant="outline" className={statusStyles[o.status]}>{o.status}</Badge>
                </td>
                <td className="p-4 text-right">
                  {(o.status === "pending" || o.status === "failed") && (
                    <Button variant="outline" size="sm" onClick={() => verifyPayment(o)} disabled={checking === o.id}>
                      {checking === o.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5" />}
                      Verify
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
