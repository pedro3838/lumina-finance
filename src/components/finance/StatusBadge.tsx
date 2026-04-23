import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  variant?: "income" | "expense" | "sale" | "classification" | "type";
  className?: string;
}

const styles: Record<string, string> = {
  // income
  recebido: "bg-success/15 text-success border-success/30",
  // expense
  pago: "bg-success/15 text-success border-success/30",
  pendente: "bg-warning/15 text-warning border-warning/30",
  // classification
  ATIVO: "bg-success/15 text-success border-success/30",
  PASSIVO: "bg-destructive/15 text-destructive border-destructive/30",
  // sale
  rascunho: "bg-muted text-muted-foreground border-border",
  enviado: "bg-info/15 text-info border-info/30",
  aprovado: "bg-primary/20 text-primary border-primary/40",
  concluido: "bg-success/15 text-success border-success/30",
  cancelado: "bg-destructive/15 text-destructive border-destructive/30",
  // expense type
  fixo: "bg-info/15 text-info border-info/30",
  variavel: "bg-warning/15 text-warning border-warning/30",
  investimento: "bg-success/15 text-success border-success/30",
  superfluo: "bg-destructive/15 text-destructive border-destructive/30",
  imprevisto: "bg-muted text-foreground border-border",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const cls = styles[status] ?? "bg-muted text-muted-foreground border-border";
  return (
    <Badge variant="outline" className={cn("border font-medium capitalize", cls, className)}>
      {status}
    </Badge>
  );
}
