import { NavLink as RouterNavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowDownToLine,
  ArrowUpFromLine,
  Wallet,
  ShoppingCart,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/receber", label: "Contas a Receber", icon: ArrowDownToLine },
  { to: "/pagar", label: "Contas a Pagar", icon: ArrowUpFromLine },
  { to: "/fluxo", label: "Fluxo de Caixa", icon: Wallet },
  { to: "/vendas", label: "Vendas", icon: ShoppingCart },
  { to: "/insights", label: "Insights", icon: Sparkles },
];

export function AppSidebar() {
  return (
    <aside className="hidden md:flex w-60 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex items-center gap-2 px-5 py-5 border-b border-sidebar-border">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-primary shadow-glow">
          <TrendingUp className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <div className="font-semibold tracking-tight text-sidebar-accent-foreground">Finova</div>
          <div className="text-[11px] text-sidebar-foreground">Controle financeiro</div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {items.map((it) => (
          <RouterNavLink
            key={it.to}
            to={it.to}
            end={it.end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive &&
                  "bg-primary-soft text-primary-foreground border border-primary/30 font-medium shadow-glow"
              )
            }
          >
            <it.icon className="h-4 w-4" />
            <span>{it.label}</span>
          </RouterNavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <div className="rounded-lg bg-sidebar-accent p-3 text-xs text-sidebar-foreground">
          <div className="font-medium text-sidebar-accent-foreground mb-1">💡 Dica</div>
          Cadastre receitas e despesas para destravar análises automáticas.
        </div>
      </div>
    </aside>
  );
}
