import { Link } from "react-router-dom";
import { DollarSign } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t border-border/40 mt-24">
      <div className="container py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="bg-gradient-primary p-2 rounded-lg">
                <DollarSign className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-lg">
                Qu<span className="text-gradient">ro</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-md">
              The next-gen marketplace for production-ready algorithmic trading bots.
              Pay in crypto. Get instant access.
            </p>
          </div>

          <div>
            <h4 className="font-display font-semibold text-sm mb-3">Marketplace</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/marketplace" className="hover:text-primary transition-colors">All Bots</Link></li>
              <li><Link to="/marketplace?featured=1" className="hover:text-primary transition-colors">Featured</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-sm mb-3">Account</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link></li>
              <li><Link to="/dashboard/purchases" className="hover:text-primary transition-colors">My Bots</Link></li>
              <li><Link to="/auth/sign-in" className="hover:text-primary transition-colors">Sign in</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/40 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Quro. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
