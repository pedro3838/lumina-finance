import { useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useFinance } from "@/store/finance-store";
import { generateInsights } from "@/lib/finance-selectors";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, Sparkles } from "lucide-react";
import { ExportButton } from "@/components/finance/ExportButton";
import { downloadCSV, timestampedFilename, toCSV } from "@/lib/export-csv";

export default function Insights() {
  const incomes = useFinance((s) => s.incomes);
  const expenses = useFinance((s) => s.expenses);
  const insights = useMemo(() => generateInsights(incomes, expenses), [incomes, expenses]);

  function handleExport() {
    const headers = ["Nível", "Título", "Descrição"];
    const rows = insights.map((i) => [i.level, i.title, i.description]);
    downloadCSV(timestampedFilename("insights"), toCSV(headers, rows));
    return { rowCount: insights.length };
  }

  return (
    <AppLayout
      title="Insights inteligentes"
      description="Análises automáticas e sugestões para melhorar suas finanças"
      actions={<ExportButton onExport={handleExport} disabled={insights.length === 0} />}
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-gradient-surface p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-primary-soft grid place-items-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">Análise do período</h2>
              <p className="text-sm text-muted-foreground">{insights.length} {insights.length === 1 ? "insight gerado" : "insights gerados"}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {insights.map((i) => {
            const Icon = i.level === "danger" ? AlertCircle : i.level === "warning" ? AlertTriangle : i.level === "success" ? CheckCircle2 : Info;
            const tone =
              i.level === "danger"
                ? "border-destructive/30 bg-destructive/10 text-destructive"
                : i.level === "warning"
                ? "border-warning/30 bg-warning/10 text-warning"
                : i.level === "success"
                ? "border-success/30 bg-success/10 text-success"
                : "border-info/30 bg-info/10 text-info";
            return (
              <div key={i.id} className={`rounded-xl border p-4 ${tone}`}>
                <div className="flex items-start gap-3">
                  <Icon className="h-5 w-5 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-semibold text-foreground">{i.title}</div>
                    <p className="text-sm text-muted-foreground mt-1">{i.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold mb-3">Boas práticas financeiras</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2"><span className="text-primary">•</span> Mantenha despesas essenciais (moradia, alimentação, fixos) em até <strong className="text-foreground">50%</strong> da receita.</li>
            <li className="flex gap-2"><span className="text-primary">•</span> Direcione pelo menos <strong className="text-foreground">10–20%</strong> da receita para investimentos (ATIVO).</li>
            <li className="flex gap-2"><span className="text-primary">•</span> Limite gastos supérfluos a <strong className="text-foreground">15%</strong> da receita.</li>
            <li className="flex gap-2"><span className="text-primary">•</span> Acompanhe variação previsto vs real e investigue estouros acima de <strong className="text-foreground">10%</strong>.</li>
            <li className="flex gap-2"><span className="text-primary">•</span> Reserve uma parte do caixa para <strong className="text-foreground">imprevistos</strong> (3–6 meses de despesas).</li>
          </ul>
        </div>
      </div>
    </AppLayout>
  );
}
