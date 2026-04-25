import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SiteLayout } from "@/components/SiteLayout";
import { useAuth } from "@/contexts/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Bot, Copy, Download, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Purchase {
  bot_id: string;
  name: string;
  slug: string;
  cover_image_url: string | null;
  short_description: string;
  version: string | null;
  paid_at: string | null;
  license_key: string | null;
  license_status: string | null;
  activations_count: number | null;
  max_activations: number | null;
  license_expires_at: string | null;
}

const Purchases = () => {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    document.title = "My Bots - CipherBots";
    if (!user) return;
    supabase
      .from("my_purchases")
      .select("bot_id,name,slug,cover_image_url,short_description,version,paid_at,license_key,license_status,activations_count,max_activations,license_expires_at")
      .eq("user_id", user.id)
      .then(({ data }) => {
        const seen = new Set<string>();
        const rows = (data ?? []) as Purchase[];
        const uniq = rows.filter((p) => {
          if (seen.has(p.bot_id)) return false;
          seen.add(p.bot_id);
          return true;
        });
        setPurchases(uniq);
        setLoading(false);
      });
  }, [user]);

  const handleDownload = async (p: Purchase) => {
    setDownloading(p.bot_id);
    const { data, error } = await supabase.functions.invoke("create-download-link", {
      body: { botId: p.bot_id },
    });
    setDownloading(null);

    if (error || data?.error || !data?.signedUrl) {
      toast.error(error?.message ?? data?.error ?? "Could not generate download link");
      return;
    }

    window.open(data.signedUrl, "_blank");
  };

  return (
    <SiteLayout>
      <div className="container py-12">
        <div className="mb-10">
          <Badge variant="outline" className="mb-3 border-primary/30 text-primary">My Library</Badge>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-2">My Bots</h1>
          <p className="text-muted-foreground">Download your purchased bots and copy their license keys.</p>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass rounded-2xl h-40 animate-pulse" />
            ))}
          </div>
        ) : purchases.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <Bot className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium mb-1">No bots yet</p>
            <p className="text-sm text-muted-foreground mb-4">Purchase a bot from the marketplace to access downloads here.</p>
            <Button variant="hero" asChild>
              <Link to="/marketplace">Browse marketplace</Link>
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-5">
            {purchases.map((p) => (
              <div key={p.bot_id} className="glass rounded-2xl p-5 flex gap-4">
                <div className="w-24 h-24 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                  {p.cover_image_url ? (
                    <img src={p.cover_image_url} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Bot className="h-8 w-8 text-muted-foreground/30" /></div>
                  )}
                </div>
                <div className="min-w-0 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display font-semibold truncate">{p.name}</h3>
                      <div className="text-xs text-muted-foreground">v{p.version ?? "1.0.0"}</div>
                    </div>
                    <Badge variant="outline" className="text-success border-success/30 capitalize">{p.license_status ?? "active"}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1 mb-3">{p.short_description}</p>
                  <div className="bg-muted/30 rounded-lg p-2 mb-3 flex items-center gap-2">
                    <code className="font-mono text-xs truncate flex-1">{p.license_key ?? "License pending"}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={!p.license_key}
                      onClick={() => {
                        if (!p.license_key) return;
                        navigator.clipboard.writeText(p.license_key);
                        toast.success("License copied");
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="hero"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDownload(p)}
                      disabled={downloading === p.bot_id || p.license_status !== "active"}
                    >
                      <Download className="h-4 w-4" />
                      {downloading === p.bot_id ? "..." : "Download"}
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/product/${p.slug}`} aria-label="View product">
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  );
};

export default Purchases;
