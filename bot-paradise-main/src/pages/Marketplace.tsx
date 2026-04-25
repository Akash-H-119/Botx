import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SiteLayout } from "@/components/SiteLayout";
import { ProductCard } from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, Bot } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  price_usd: number;
  cover_image_url: string | null;
  is_featured: boolean;
  rating: number | null;
  total_sales: number;
}

const Marketplace = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Marketplace — Quro";
  }, []);

  useEffect(() => {
    setLoading(true);
    supabase
      .from("bots")
      .select("id,name,slug,short_description,price_usd,cover_image_url,is_featured,rating,total_sales")
      .eq("is_published", true)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setProducts((data ?? []) as Product[]);
        setLoading(false);
      });
  }, []);

  const filtered = products.filter(
    (p) =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.short_description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SiteLayout>
      <div className="container py-12 md:py-16">
        <div className="mb-10 max-w-3xl">
          <Badge variant="outline" className="mb-3 border-primary/30 text-primary">Marketplace</Badge>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-3">
            All trading bots
          </h1>
          <p className="text-muted-foreground">
            Browse our complete catalogue of vetted, production-ready algorithmic trading strategies.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search strategies, exchanges, assets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-12 glass border-border/50 focus-visible:ring-primary/50"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass rounded-2xl aspect-[4/5] animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center text-muted-foreground">
            <Bot className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No bots match your filters.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  );
};

export default Marketplace;
