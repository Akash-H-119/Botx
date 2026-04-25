import { Link, NavLink as RouterNavLink, useNavigate } from "react-router-dom";
import { Bot, ShoppingCart, User as UserIcon, LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/useAuth";
import { useCart } from "@/contexts/useCart";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "./ThemeToggle";

export const Navbar = () => {
  const { user, isAdmin, signOut } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const links = [
    { to: "/marketplace", label: "Marketplace" },
    { to: "/categories", label: "Categories" },
    { to: "/about", label: "About" },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="glass-strong border-b border-border/40">
        <div className="container flex h-16 items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-primary blur-md opacity-60 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-gradient-primary p-2 rounded-lg">
                <Bot className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>
            <span className="font-display font-bold text-lg tracking-tight">
              Cipher<span className="text-gradient">Bots</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <RouterNavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`
                }
              >
                {l.label}
              </RouterNavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" asChild className="relative">
              <Link to="/cart" aria-label="Cart">
                <ShoppingCart className="h-5 w-5" />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-primary text-primary-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {count}
                  </span>
                )}
              </Link>
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="glass" size="icon" className="rounded-full">
                    <UserIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 glass-strong">
                  <DropdownMenuLabel className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/purchases" className="cursor-pointer">
                      <Bot className="mr-2 h-4 w-4" />
                      My Bots
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="cursor-pointer text-primary">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/auth/sign-in">Sign in</Link>
                </Button>
                <Button variant="hero" size="sm" asChild>
                  <Link to="/auth/sign-up">Get started</Link>
                </Button>
              </div>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setOpen((o) => !o)}
              aria-label="Menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden border-t border-border/40"
            >
              <nav className="container py-4 flex flex-col gap-1">
                {links.map((l) => (
                  <RouterNavLink
                    key={l.to}
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `px-4 py-2.5 text-sm font-medium rounded-lg ${
                        isActive ? "text-primary bg-primary/10" : "text-muted-foreground"
                      }`
                    }
                  >
                    {l.label}
                  </RouterNavLink>
                ))}
                {!user && (
                  <div className="flex gap-2 mt-2">
                    <Button variant="outline" className="flex-1" asChild>
                      <Link to="/auth/sign-in" onClick={() => setOpen(false)}>Sign in</Link>
                    </Button>
                    <Button variant="hero" className="flex-1" asChild>
                      <Link to="/auth/sign-up" onClick={() => setOpen(false)}>Get started</Link>
                    </Button>
                  </div>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};
