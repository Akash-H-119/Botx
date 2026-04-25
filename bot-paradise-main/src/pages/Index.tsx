import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Bot, Shield, Zap, TrendingUp, Code, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SiteLayout } from "@/components/SiteLayout";
import { ProductCard } from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import heroBg from "@/assets/hero-bg.jpg";

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

const Index = () => {
  const [featured, setFeatured] = useState<Product[]>([]);

  useEffect(() => {
    document.title = "Quro — Premium Crypto-Native Trading Bot Marketplace";
    const desc = "Discover, buy and deploy production-grade algorithmic trading bots. Pay in crypto. Instant access. Built by quant engineers.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);

    supabase
      .from("bots")
      .select("id,name,slug,short_description,price_usd,cover_image_url,is_featured,rating,total_sales")
      .eq("is_published", true)
      .order("is_featured", { ascending: false })
      .order("total_sales", { ascending: false })
      .limit(6)
      .then(({ data }) => setFeatured((data ?? []) as Product[]));
  }, []);

  return (
    <SiteLayout>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `url(${heroBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />
        <div className="absolute inset-0 grid-pattern opacity-50" />

        <div className="container relative pt-24 pb-32 md:pt-32 md:pb-40">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <Badge variant="outline" className="mb-6 glass border-primary/30 text-primary">
              <span className="w-2 h-2 rounded-full bg-success mr-2 animate-pulse" />
              Live marketplace · 100% crypto payments
            </Badge>

            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[0.95] mb-6">
              Trade like the
              <br />
              <span className="text-gradient-primary">top 1%.</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              The next-generation marketplace for production-ready algorithmic trading bots.
              Backtested. Battle-proven. Delivered instantly to your wallet.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button variant="hero" size="xl" asChild>
                <Link to="/marketplace">
                  Explore the marketplace
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="glass" size="xl" asChild>
                <Link to="/auth/sign-up">Create free account</Link>
              </Button>
            </div>

            <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              {[
                { value: "150+", label: "Strategies" },
                { value: "$24M+", label: "Volume traded" },
                { value: "12k+", label: "Active traders" },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="text-center"
                >
                  <div className="font-display text-3xl md:text-4xl font-bold text-gradient">
                    {s.value}
                  </div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">
                    {s.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="container py-20">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Built for serious traders
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
          Every bot on Quro is reviewed, backtested, and ships with full source plus deployment docs.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: Zap, title: "Instant delivery", desc: "Pay in crypto, get download access in seconds via signed URLs." },
            { icon: Shield, title: "Verified strategies", desc: "Each bot is reviewed by our quant team before publication." },
            { icon: Code, title: "Full source code", desc: "No black boxes. Audit, modify, and extend every strategy you buy." },
            { icon: TrendingUp, title: "Live performance", desc: "Real backtest results and live track records on every product page." },
            { icon: Lock, title: "Buyer-only access", desc: "Files are gated to verified purchasers — never publicly indexed." },
            { icon: Bot, title: "Multi-exchange", desc: "Bots ship for Binance, Bybit, Coinbase, Hyperliquid and more." },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-2xl p-6 hover:border-primary/30 transition-colors"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FEATURED BOTS */}
      <section className="container py-20">
        <div className="flex items-end justify-between mb-10 gap-4">
          <div>
            <Badge variant="outline" className="mb-3 border-primary/30 text-primary">Featured</Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
              Top-performing bots
            </h2>
          </div>
          <Button variant="ghost" asChild>
            <Link to="/marketplace">
              View all <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {featured.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center text-muted-foreground">
            <Bot className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No bots published yet.</p>
            <p className="text-sm mt-1">Admins can add bots from the admin panel.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="container py-20">
        <div className="relative overflow-hidden glass-strong rounded-3xl p-10 md:p-16 text-center">
          <div className="absolute inset-0 bg-gradient-mesh opacity-60" />
          <div className="relative">
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Ready to deploy?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8">
              Join thousands of traders running Quro strategies across every major exchange.
            </p>
            <Button variant="hero" size="xl" asChild>
              <Link to="/marketplace">Browse marketplace <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
};

export default Index;
