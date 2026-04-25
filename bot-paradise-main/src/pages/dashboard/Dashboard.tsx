import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SiteLayout } from "@/components/SiteLayout";
import { useAuth } from "@/contexts/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Bot, Package, Receipt, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ purchases: 0, orders: 0, spent: 0 });
  const [recent, setRecent] = useState<Array<{ id: string; bot_id: string; name: string; cover_image_url: string | null; slug: string }>>([]);

  useEffect(() => {
    document.title = "Dashboard — CipherBots";
    if (!user) return;

    Promise.all([
      supabase.from("my_purchases").select("bot_id,name,cover_image_url,slug,order_id").eq("user_id", user.id),
      supabase.from("orders").select("id,total_usd,status").eq("user_id", user.id),
    ]).then(([{ data: purchases }, { data: orders }]) => {
      const paidOrders = (orders ?? []).filter((o) => o.status === "paid");
      setStats({
        purchases: purchases?.length ?? 0,
        orders: paidOrders.length,
        spent: paidOrders.reduce((s, o) => s + Number(o.total_usd), 0),
      });
      setRecent(
        ((purchases ?? []) as Array<{ order_id: string; bot_id: string; name: string; cover_image_url: string | null; slug: string }>)
          .slice(0, 4)
          .map((p) => ({ id: p.order_id, bot_id: p.bot_id, name: p.name, cover_image_url: p.cover_image_url, slug: p.slug })),
      );
    });
  }, [user]);

  return (
    <SiteLayout>
      <div className="container py-12">
        <div className="mb-10">
          <Badge variant="outline" className="mb-3 border-primary/30 text-primary">Dashboard</Badge>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
            Welcome back, {user?.user_metadata?.display_name || user?.email?.split("@")[0]}
          </h1>
        </div>

        <div className="grid sm:grid-cols-3 gap-5 mb-10">
          {[
            { label: "Bots owned", value: stats.purchases, icon: Bot },
            { label: "Orders", value: stats.orders, icon: Receipt },
            { label: "Total spent", value: `$${stats.spent.toFixed(0)}`, icon: Package },
          ].map((s) => (
            <div key={s.label} className="glass rounded-2xl p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{s.label}</div>
                  <div className="font-display text-3xl font-bold">{s.value}</div>
                </div>
                <div className="bg-primary/10 rounded-lg p-2.5">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-xl font-bold">Recent purchases</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/purchases">View all <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>

          {recent.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Bot className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No purchases yet</p>
              <Button variant="hero" className="mt-4" asChild>
                <Link to="/marketplace">Browse marketplace</Link>
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {recent.map((r) => (
                <Link key={r.id + r.bot_id} to={`/product/${r.slug}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 transition-colors">
                  <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                    {r.cover_image_url ? (
                      <img src={r.cover_image_url} alt={r.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Bot className="h-5 w-5 text-muted-foreground/40" /></div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{r.name}</div>
                    <div className="text-xs text-muted-foreground">Tap to view</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </SiteLayout>
  );
};

export default Dashboard;
