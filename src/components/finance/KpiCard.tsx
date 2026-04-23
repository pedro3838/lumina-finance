import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  hint?: string;
  trend?: number; // percent
  tone?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
  children?: ReactNode;
}

const toneStyles: Record<NonNullable<KpiCardProps["tone"]>, string> = {
  default: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  danger: "text-destructive",
  info: "text-info",
};

const toneIconBg: Record<NonNullable<KpiCardProps["tone"]>, string> = {
  default: "bg-muted text-muted-foreground",
  success: "bg-primary-soft text-primary",
  warning: "bg-warning/15 text-warning",
  danger: "bg-destructive/15 text-destructive",
  info: "bg-info/15 text-info",
};

export function KpiCard({ label, value, icon: Icon, hint, trend, tone = "default", className, children }: KpiCardProps) {
  return (
    <div className={cn("kpi-card", className)}>
      <div className="flex items-start justify-between gap-2 md:gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] md:text-xs uppercase tracking-wider text-muted-foreground font-medium truncate">{label}</p>
          <p className={cn("mt-1.5 md:mt-2 text-lg md:text-2xl font-semibold tabular-nums truncate", toneStyles[tone])}>{value}</p>
          {hint && <p className="mt-1 text-[10px] md:text-xs text-muted-foreground truncate">{hint}</p>}
        </div>
        {Icon && (
          <div className={cn("h-8 w-8 md:h-10 md:w-10 shrink-0 rounded-lg grid place-items-center", toneIconBg[tone])}>
            <Icon className="h-4 w-4 md:h-5 md:w-5" />
          </div>
        )}
      </div>
      {typeof trend === "number" && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          {trend >= 0 ? (
            <TrendingUp className="h-3.5 w-3.5 text-success" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-destructive" />
          )}
          <span className={trend >= 0 ? "text-success" : "text-destructive"}>
            {trend >= 0 ? "+" : ""}
            {trend.toFixed(1)}%
          </span>
          <span className="text-muted-foreground">vs período anterior</span>
        </div>
      )}
      {children}
    </div>
  );
}
