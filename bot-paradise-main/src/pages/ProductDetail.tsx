import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Bot, Check, ShoppingCart, Star, TrendingUp, Zap, ArrowLeft } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/useCart";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  price_usd: number;
  cover_image_url: string | null;
  gallery_urls: string[];
  features: unknown;
  performance: unknown;
  is_featured: boolean;
  rating: number | null;
  total_sales: number;
  category_id: string | null;
}

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem, items } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from("bots")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle()
      .then(({ data }) => {
        setProduct(data as Product | null);
        setLoading(false);
        if (data) document.title = `${data.name} — CipherBots`;
      });
  }, [slug]);

  if (loading) {
    return (
      <SiteLayout>
        <div className="container py-20">
          <div className="glass rounded-2xl h-96 animate-pulse" />
        </div>
      </SiteLayout>
    );
  }

  if (!product) {
    return (
      <SiteLayout>
        <div className="container py-20 text-center">
          <Bot className="h-16 w-16 mx-auto mb-4 text-muted-foreground/40" />
          <h1 className="font-display text-2xl font-bold mb-2">Bot not found</h1>
          <Button variant="outline" asChild className="mt-4">
            <Link to="/marketplace">Back to marketplace</Link>
          </Button>
        </div>
      </SiteLayout>
    );
  }

  const features: string[] = Array.isArray(product.features)
    ? product.features.filter((feature): feature is string => typeof feature === "string")
    : [];
  const perf = product.performance && typeof product.performance === "object" && !Array.isArray(product.performance)
    ? (product.performance as Record<string, string | number>)
    : {};
  const inCart = items.some((i) => i.id === product.id);

  const handleAdd = () => {
    addItem({
      id: product.id,
      name: product.name,
      price_usd: Number(product.price_usd),
      cover_image_url: product.cover_image_url,
      slug: product.slug,
    });
    toast.success(`${product.name} added to cart`);
  };

  return (
    <SiteLayout>
      <div className="container py-8 md:py-12">
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link to="/marketplace"><ArrowLeft className="h-4 w-4 mr-2" /> Back to marketplace</Link>
        </Button>

        <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3"
          >
            <div className="glass rounded-2xl overflow-hidden aspect-[16/10] mb-4">
              {product.cover_image_url ? (
                <img
                  src={product.cover_image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-card">
                  <Bot className="h-24 w-24 text-muted-foreground/30" />
                </div>
              )}
            </div>

            {product.gallery_urls?.length > 0 && (
              <div className="grid grid-cols-4 gap-3">
                {product.gallery_urls.slice(0, 4).map((url, i) => (
                  <div key={i} className="glass rounded-lg overflow-hidden aspect-square">
                    <img src={url} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            {/* Description */}
            <div className="mt-10">
              <h2 className="font-display text-2xl font-bold mb-4">About this bot</h2>
              <div className="glass rounded-2xl p-6 prose prose-invert max-w-none">
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            </div>

            {features.length > 0 && (
              <div className="mt-10">
                <h2 className="font-display text-2xl font-bold mb-4">Features</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {features.map((f, i) => (
                    <div key={i} className="glass rounded-xl p-4 flex items-start gap-3">
                      <div className="bg-primary/10 rounded-lg p-1.5 mt-0.5">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <div className="lg:sticky lg:top-24 space-y-5">
              <div className="glass-strong rounded-2xl p-7">
                {product.is_featured && (
                  <Badge className="mb-3 bg-gradient-accent border-0">
                    <Star className="h-3 w-3 mr-1 fill-current" /> Featured
                  </Badge>
                )}
                <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-3">
                  {product.name}
                </h1>
                <p className="text-muted-foreground mb-6">{product.short_description}</p>

                <div className="flex items-baseline gap-2 mb-6">
                  <span className="font-display text-5xl font-bold text-gradient">
                    ${Number(product.price_usd).toFixed(0)}
                  </span>
                  <span className="text-sm text-muted-foreground">USD · pay in crypto</span>
                </div>

                <div className="space-y-3">
                  {inCart ? (
                    <Button variant="glass" size="xl" className="w-full" asChild>
                      <Link to="/cart">
                        <ShoppingCart className="h-5 w-5" /> View cart
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="hero" size="xl" className="w-full" onClick={handleAdd}>
                      <ShoppingCart className="h-5 w-5" /> Add to cart
                    </Button>
                  )}
                  <Button variant="outline" size="xl" className="w-full" onClick={() => { handleAdd(); navigate("/cart"); }}>
                    <Zap className="h-5 w-5" /> Buy now
                  </Button>
                </div>

                <div className="mt-6 pt-6 border-t border-border/40 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Rating</div>
                    <div className="font-display font-bold flex items-center justify-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                      {product.rating ? Number(product.rating).toFixed(1) : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Sales</div>
                    <div className="font-display font-bold flex items-center justify-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5 text-primary" />
                      {product.total_sales}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Delivery</div>
                    <div className="font-display font-bold text-success">Instant</div>
                  </div>
                </div>
              </div>

              {Object.keys(perf).length > 0 && (
                <div className="glass rounded-2xl p-6">
                  <h3 className="font-display font-semibold mb-4">Performance</h3>
                  <div className="space-y-3">
                    {Object.entries(perf).map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between text-sm border-b border-border/30 pb-2 last:border-0 last:pb-0">
                        <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}</span>
                        <span className="font-mono font-semibold">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </SiteLayout>
  );
};

export default ProductDetail;
