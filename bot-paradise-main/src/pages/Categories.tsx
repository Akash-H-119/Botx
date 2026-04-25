import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SiteLayout } from "@/components/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Layers } from "lucide-react";

interface Category {
  id: string; name: string; slug: string; description: string | null;
}

const Categories = () => {
  const [cats, setCats] = useState<Category[]>([]);

  useEffect(() => {
    document.title = "Categories — CipherBots";
    supabase.from("categories").select("*").order("name").then(({ data }) => setCats((data ?? []) as Category[]));
  }, []);

  return (
    <SiteLayout>
      <div className="container py-12">
        <Badge variant="outline" className="mb-3 border-primary/30 text-primary">Browse</Badge>
        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-3">Categories</h1>
        <p className="text-muted-foreground mb-10 max-w-2xl">Find bots that match your strategy and risk profile.</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cats.map((c) => (
            <Link
              key={c.id}
              to={`/marketplace?category=${c.id}`}
              className="glass rounded-2xl p-6 group hover:border-primary/40 transition-all hover:-translate-y-1"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                <Layers className="h-5 w-5 text-primary" />
              </div>
              <h2 className="font-display text-xl font-semibold mb-2 group-hover:text-primary transition-colors">{c.name}</h2>
              <p className="text-sm text-muted-foreground mb-4">{c.description}</p>
              <div className="text-sm text-primary flex items-center gap-1 font-medium">
                Explore <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </SiteLayout>
  );
};

export default Categories;
