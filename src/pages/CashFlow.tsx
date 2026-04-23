import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useFinance } from "@/store/finance-store";
import { FiltersBar, type FilterValue } from "@/components/finance/FiltersBar";
import { KpiCard } from "@/components/finance/KpiCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowDownToLine, ArrowUpFromLine, Wallet, TrendingUp } from "lucide-react";
import { formatBRL, formatDateBR } from "@/lib/format";
import { buildCashFlow, filterExpenses, filterIncomes } from "@/lib/finance-selectors";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const tooltipStyle = {
  contentStyle: {
    background: "hsl(var(--popover))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 8,
    fontSize: 12,
    color: "hsl(var(--popover-foreground))",
  },
  labelStyle: { color: "hsl(var(--muted-foreground))", fontSize: 11 },
};

export default function CashFlow() {
  const incomes = useFinance((s) => s.incomes);
  const expenses = useFinance((s) => s.expenses);
  const [filter, setFilter] = useState<FilterValue>({ month: "all", person: "Todos", category: "Todas" });

  const filteredIncomes = useMemo(
    () => filterIncomes(incomes, { month: filter.month === "all" ? undefined : filter.month, person: filter.person, category: filter.category === "Todas" ? undefined : filter.category }),
    [incomes, filter]
  );
  const filteredExpenses = useMemo(
    () => filterExpenses(expenses, { month: filter.month === "all" ? undefined : filter.month, person: filter.person, category: filter.category === "Todas" ? undefined : filter.category }),
    [expenses, filter]
  );

  const { rows, daily } = useMemo(() => buildCashFlow(filteredIncomes, filteredExpenses), [filteredIncomes, filteredExpenses]);

  const totalIn = rows.reduce((s, r) => s + r.inflow, 0);
  const totalOut = rows.reduce((s, r) => s + r.outflow, 0);
  const totalInvested = filteredExpenses.filter((e) => e.type === "investimento" && e.status === "pago").reduce((s, e) => s + e.actualAmount, 0);
  const balance = totalIn - totalOut;

  return (
    <AppLayout title="Fluxo de Caixa" description="Movimentação real consolidada (entradas e saídas confirmadas)">
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <KpiCard label="Entradas" value={formatBRL(totalIn)} icon={ArrowDownToLine} tone="success" />
          <KpiCard label="Saídas" value={formatBRL(totalOut)} icon={ArrowUpFromLine} tone="danger" />
          <KpiCard label="Saldo do período" value={formatBRL(balance)} icon={Wallet} tone={balance >= 0 ? "success" : "danger"} />
          <KpiCard label="Investido" value={formatBRL(totalInvested)} icon={TrendingUp} tone="info" />
        </div>

        <FiltersBar value={filter} onChange={setFilter} />

        <div className="rounded-xl border border-border bg-card p-4 md:p-5">
          <h3 className="font-semibold text-sm mb-1">Saldo acumulado</h3>
          <p className="text-xs text-muted-foreground mb-3">Evolução diária do caixa</p>
          {daily.length === 0 ? (
            <div className="h-[260px] grid place-items-center text-sm text-muted-foreground">Sem movimentação no período</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={daily} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="acc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(d) => d.slice(8)} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip {...tooltipStyle} formatter={(v: number) => formatBRL(v)} labelFormatter={formatDateBR} />
                <Area type="monotone" dataKey="acumulado" stroke="hsl(var(--primary))" fill="url(#acc)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 md:px-5 py-3 border-b border-border">
            <h3 className="font-semibold text-sm">Lançamentos do período</h3>
            <p className="text-xs text-muted-foreground">Apenas itens com status confirmado (recebido/pago)</p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Pessoa</TableHead>
                  <TableHead className="text-right">Entrada</TableHead>
                  <TableHead className="text-right">Saída</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                      Nenhum lançamento confirmado neste período.
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((r, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="whitespace-nowrap text-sm">{formatDateBR(r.date)}</TableCell>
                    <TableCell className="text-sm font-medium">{r.description}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.category}</TableCell>
                    <TableCell className="text-sm">{r.person}</TableCell>
                    <TableCell className="text-right tabular-nums text-success">
                      {r.inflow > 0 ? formatBRL(r.inflow) : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-destructive">
                      {r.outflow > 0 ? formatBRL(r.outflow) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
