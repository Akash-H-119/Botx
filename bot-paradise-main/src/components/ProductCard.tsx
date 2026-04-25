import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Bot, TrendingUp, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    short_description: string;
    price_usd: number;
    cover_image_url?: string | null;
    is_featured?: boolean;
    rating?: number | null;
    total_sales?: number;
  };
  index?: number;
}

export const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link
        to={`/product/${product.slug}`}
        className="group block glass rounded-2xl overflow-hidden hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-card-elevated"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {product.cover_image_url ? (
            <img
              src={product.cover_image_url}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-card">
              <Bot className="h-16 w-16 text-muted-foreground/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
          {product.is_featured && (
            <Badge className="absolute top-3 left-3 bg-gradient-accent border-0 text-accent-foreground">
              <Star className="h-3 w-3 mr-1 fill-current" />
              Featured
            </Badge>
          )}
        </div>

        <div className="p-5">
          <h3 className="font-display font-semibold text-lg leading-tight mb-1.5 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[2.5rem]">
            {product.short_description}
          </p>

          <div className="flex items-center justify-between pt-3 border-t border-border/40">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {product.rating != null && product.rating > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-warning text-warning" />
                  {Number(product.rating).toFixed(1)}
                </span>
              )}
              {(product.total_sales ?? 0) > 0 && (
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {product.total_sales}
                </span>
              )}
            </div>
            <div className="font-display font-bold text-lg text-gradient">
              ${Number(product.price_usd).toFixed(0)}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
