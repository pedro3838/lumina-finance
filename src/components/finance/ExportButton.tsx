import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

interface ExportButtonProps {
  onExport: () => { rowCount: number } | void;
  disabled?: boolean;
  label?: string;
}

export function ExportButton({ onExport, disabled, label = "Baixar relatório" }: ExportButtonProps) {
  function handleClick() {
    try {
      const result = onExport();
      const count = result && typeof result === "object" ? result.rowCount : undefined;
      toast.success("Relatório baixado", {
        description: count !== undefined ? `${count} linha(s) exportada(s)` : undefined,
      });
    } catch (err) {
      toast.error("Falha ao exportar relatório");
      console.error(err);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={disabled}>
      <Download className="h-4 w-4 mr-1" />
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">Exportar</span>
    </Button>
  );
}
