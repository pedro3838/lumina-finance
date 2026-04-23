import { NavLink } from "react-router-dom";
import { LayoutDashboard, ArrowDownToLine, ArrowUpFromLine, Wallet, ShoppingCart, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Início", icon: LayoutDashboard, end: true },
  { to: "/receber", label: "Receber", icon: ArrowDownToLine },
  { to: "/pagar", label: "Pagar", icon: ArrowUpFromLine },
  { to: "/fluxo", label: "Fluxo", icon: Wallet },
  { to: "/vendas", label: "Vendas", icon: ShoppingCart },
  { to: "/insights", label: "IA", icon: Sparkles },
];

export function MobileNav() {
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-6">
        {items.map((it) => (
          <li key={it.to}>
            <NavLink
              to={it.to}
              end={it.end}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              <it.icon className="h-4 w-4" />
              <span>{it.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
