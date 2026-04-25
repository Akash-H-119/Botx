import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Bot, Trash2, ShoppingCart } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/useCart";
import { useAuth } from "@/contexts/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

const Cart = () => {
  const { items, removeItem, total, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);

  const handleCheckout = async () => {
    if (!user) {
      toast.info("Sign in to complete your purchase");
      navigate("/auth/sign-in");
      return;
    }
    setCreating(true);

    const { data, error } = await supabase.functions.invoke("create-payment", {
      body: {
        items: items.map((item) => ({ botId: item.id })),
        payCurrency: "btc",
      },
    });

    if (error || !data?.orderId) {
      setCreating(false);
      toast.error(error?.message ?? data?.error ?? "Could not create payment");
      return;
    }

    setCreating(false);
    navigate(`/checkout/${data.orderId}`);
  };

  return (
    <SiteLayout>
      <div className="container py-12 max-w-4xl">
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link to="/marketplace"><ArrowLeft className="h-4 w-4 mr-2" /> Continue browsing</Link>
        </Button>

        <Badge variant="outline" className="mb-3 border-primary/30 text-primary">Cart</Badge>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-8">Your cart</h1>

        {items.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center">
            <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium mb-1">Your cart is empty</p>
            <p className="text-sm text-muted-foreground mb-5">Add some bots to get started.</p>
            <Button variant="hero" asChild><Link to="/marketplace">Browse marketplace</Link></Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              {items.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass rounded-2xl p-4 flex items-center gap-4"
                >
                  <div className="w-20 h-20 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                    {item.cover_image_url ? (
                      <img src={item.cover_image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Bot className="h-6 w-6 text-muted-foreground/40" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to={`/product/${item.slug}`} className="font-display font-semibold hover:text-primary transition-colors">
                      {item.name}
                    </Link>
                    <div className="text-sm text-muted-foreground mt-0.5">Digital · instant delivery</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display font-bold text-lg">${Number(item.price_usd).toFixed(0)}</div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} aria-label="Remove">
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </motion.div>
              ))}
            </div>

            <div className="lg:col-span-1">
              <div className="glass-strong rounded-2xl p-6 lg:sticky lg:top-24">
                <h2 className="font-display font-semibold text-lg mb-4">Order summary</h2>
                <div className="space-y-2 text-sm pb-4 border-b border-border/40">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Network fee</span>
                    <span>Paid by buyer</span>
                  </div>
                </div>
                <div className="flex justify-between items-baseline py-4">
                  <span className="font-display font-semibold">Total</span>
                  <span className="font-display text-2xl font-bold text-gradient">${total.toFixed(2)}</span>
                </div>
                <Button variant="hero" size="lg" className="w-full" onClick={handleCheckout} disabled={creating}>
                  {creating ? "Creating order..." : "Checkout with crypto"}
                </Button>
                <button onClick={clear} className="text-xs text-muted-foreground hover:text-destructive mt-3 w-full text-center">
                  Clear cart
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SiteLayout>
  );
};

export default Cart;
