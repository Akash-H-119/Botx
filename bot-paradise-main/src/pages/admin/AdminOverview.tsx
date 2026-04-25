import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Bot, Users, Receipt, DollarSign } from "lucide-react";

type AdminOrder = {
  status: string;
  total_usd: number;
};

const AdminOverview = () => {
  const [stats, setStats] = useState({ bots: 0, orders: 0, users: 0, revenue: 0 });

  useEffect(() => {
    document.title = "Admin — CipherBots";
    Promise.all([
      supabase.from("bots").select("id", { count: "exact", head: true }),
      supabase.from("orders").select("total_usd,status"),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
    ]).then(([prod, ordersRes, profiles]) => {
      const orders = (ordersRes.data ?? []) as AdminOrder[];
      const paid = orders.filter((o) => o.status === "paid");
      setStats({
        bots: prod.count ?? 0,
        orders: orders.length,
        users: profiles.count ?? 0,
        revenue: paid.reduce((s, o) => s + Number(o.total_usd), 0),
      });
    });
  }, []);

  const cards = [
    { label: "Total revenue", value: `$${stats.revenue.toFixed(0)}`, icon: DollarSign, accent: "text-success" },
    { label: "Orders", value: stats.orders, icon: Receipt, accent: "text-primary" },
    { label: "Bots", value: stats.bots, icon: Bot, accent: "text-secondary" },
    { label: "Users", value: stats.users, icon: Users, accent: "text-accent" },
  ];

  return (
    <AdminLayout>
      <h1 className="font-display text-3xl font-bold mb-2">Overview</h1>
      <p className="text-muted-foreground mb-8">Real-time stats across the marketplace.</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((c) => (
          <div key={c.label} className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg bg-muted/40 ${c.accent}`}>
                <c.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="font-display text-3xl font-bold">{c.value}</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">{c.label}</div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
};

export default AdminOverview;
