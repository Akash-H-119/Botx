import { ReactNode } from "react";
import { NavLink, Link } from "react-router-dom";
import { LayoutDashboard, Bot, Users, Receipt, ArrowLeft } from "lucide-react";

const navItems = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/products", label: "Bots", icon: Bot },
  { to: "/admin/orders", label: "Orders", icon: Receipt },
  { to: "/admin/users", label: "Users", icon: Users },
];

export const AdminLayout = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen flex flex-col md:flex-row bg-background">
    <aside className="md:w-64 md:min-h-screen border-b md:border-b-0 md:border-r border-border/40 glass-strong">
      <div className="p-5 border-b border-border/40">
        <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to site
        </Link>
        <div className="font-display font-bold text-lg mt-3">Admin Panel</div>
      </div>
      <nav className="p-3 flex md:flex-col gap-1 overflow-x-auto">
        {navItems.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                isActive
                  ? "bg-gradient-primary text-primary-foreground shadow-glow-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`
            }
          >
            <n.icon className="h-4 w-4" />
            {n.label}
          </NavLink>
        ))}
      </nav>
    </aside>
    <main className="flex-1 p-6 md:p-10 overflow-auto">{children}</main>
  </div>
);
