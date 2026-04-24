import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { KpiCard } from "@/components/finance/KpiCard";
import { FiltersBar, type FilterValue } from "@/components/finance/FiltersBar";
import { BanksSection } from "@/components/finance/BanksSection";
import { PartnersSection } from "@/components/finance/PartnersSection";
import { useFinance } from "@/store/finance-store";
import { useBankAccounts, usePartners } from "@/hooks/use-finance-data";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  PiggyBank,
  Wallet,
  TrendingUp,
  PercentSquare,
  AlertCircle,
  Landmark,
  Users,
} from "lucide-react";
import { formatBRL, formatPct, monthLabel } from "@/lib/format";
import {
  computeKpis,
  expenseByType,
  filterExpenses,
  filterIncomes,
  generateInsights,
  groupByMonth,
  revenueByPerson,
} from "@/lib/finance-selectors";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EXPENSE_TYPE_LABEL } from "@/lib/finance-types";
import { Button } from "@/components/ui/button";
import { IncomeFormDialog } from "@/components/finance/IncomeFormDialog";
import { ExpenseFormDialog } from "@/components/finance/ExpenseFormDialog";
import { ExportButton } from "@/components/finance/ExportButton";
import { csvNumber, downloadCSV, timestampedFilename, toCSV } from "@/lib/export-csv";
import { Plus } from "lucide-react";

const PIE_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const tooltipStyle = {
  contentStyle: {
    background: "hsl(var(--popover))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 8,
    fontSize: 12,
    color: "hsl(var(--popover-foreground))",
  },
  labelStyle: { color: "hsl(var(--muted-foreground))", fontSize: 11 },
  itemStyle: { color: "hsl(var(--foreground))" },
};

export default function Dashboard() {
  const incomes = useFinance((s) => s.incomes);
  const expenses = useFinance((s) => s.expenses);
  const { data: banks = [] } = useBankAccounts();
  const { data: partners = [] } = usePartners();
  const [filter, setFilter] = useState<FilterValue>({ month: "all", person: "Todos", category: "Todas" });

  const filteredIncomes = useMemo(
    () => filterIncomes(incomes, { month: filter.month === "all" ? undefined : filter.month, person: filter.person, category: filter.category === "Todas" ? undefined : filter.category }),
    [incomes, filter]
  );
  const filteredExpenses = useMemo(
    () => filterExpenses(expenses, { month: filter.month === "all" ? undefined : filter.month, person: filter.person, category: filter.category === "Todas" ? undefined : filter.category }),
    [expenses, filter]
  );

  const kpis = useMemo(() => computeKpis(filteredIncomes, filteredExpenses), [filteredIncomes, filteredExpenses]);
  const monthly = useMemo(() => groupByMonth(filteredIncomes, filteredExpenses), [filteredIncomes, filteredExpenses]);
  const byPerson = useMemo(() => revenueByPerson(filteredIncomes), [filteredIncomes]);
  const byType = useMemo(() => expenseByType(filteredExpenses), [filteredExpenses]);
  const insights = useMemo(() => generateInsights(filteredIncomes, filteredExpenses), [filteredIncomes, filteredExpenses]);

  const workingCapital = useMemo(() => banks.reduce((s, b) => s + Number(b.balance), 0), [banks]);
  const totalAllocatedPct = useMemo(() => partners.reduce((s, p) => s + Number(p.percentage), 0), [partners]);
  const expectedDistribution = Math.max(0, kpis.netProfit) * (totalAllocatedPct / 100);

  const isEmpty = incomes.length === 0 && expenses.length === 0;

  function handleExport() {
    const headers = ["Indicador", "Valor (R$)"];
    const rows: (string | number)[][] = [
      ["Receita recebida", csvNumber(kpis.totalReceived)],
      ["Receita pendente", csvNumber(kpis.totalPending)],
      ["Receita prevista total", csvNumber(kpis.totalRevenue)],
      ["Despesa real", csvNumber(kpis.totalExpenseActual)],
      ["Despesa prevista", csvNumber(kpis.totalExpensePlanned)],
      ["Investimento", csvNumber(kpis.totalInvested)],
      ["% investido", csvNumber(kpis.investmentPct)],
      ["Lucro líquido", csvNumber(kpis.netProfit)],
      ["Saldo disponível", csvNumber(kpis.available)],
      ["Poder real", csvNumber(kpis.realPower)],
    ];
    const sep: (string | number)[] = ["", ""];
    const monthlyHeader = ["Mês", "Receitas (R$)", "Despesas (R$)", "Lucro (R$)"];
    const monthlyRows = monthly.map((m) => [m.month, csvNumber(m.receitas), csvNumber(m.despesas), csvNumber(m.lucro)]);
    const personRows = byPerson.map((p) => [p.person, csvNumber(p.value), "", ""]);
    const typeRows = byType.map((t) => [EXPENSE_TYPE_LABEL[t.type as keyof typeof EXPENSE_TYPE_LABEL] ?? t.type, csvNumber(t.value), "", ""]);

    const csv = [
      toCSV(headers, rows),
      "",
      toCSV(monthlyHeader, monthlyRows),
      "",
      toCSV(["Receita por pessoa", "Valor (R$)"], personRows.map((r) => [r[0], r[1]])),
      "",
      toCSV(["Despesa por tipo", "Valor (R$)"], typeRows.map((r) => [r[0], r[1]])),
    ].join("\r\n");

    downloadCSV(timestampedFilename("dashboard"), csv);
    return { rowCount: rows.length + monthlyRows.length };
  }

  return (
    <AppLayout
      title="Dashboard"
      description="Visão geral das suas finanças"
      actions={
        <>
          <ExportButton onExport={handleExport} disabled={isEmpty} />
          <IncomeFormDialog
            trigger={
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" /> Receita
              </Button>
            }
          />
          <ExpenseFormDialog
            trigger={
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" /> Despesa
              </Button>
            }
          />
        </>
      }
    >
      <div className="space-y-6">
        <FiltersBar value={filter} onChange={setFilter} />

        {isEmpty && (
          <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary-soft grid place-items-center mb-3">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold">Bem-vindo ao Finova</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              Cadastre suas primeiras receitas e despesas para ver indicadores, gráficos e insights automáticos sobre suas finanças.
            </p>
          </div>
        )}

        {/* KPI grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <KpiCard label="Receita total" value={formatBRL(kpis.totalReceived)} icon={ArrowDownToLine} tone="success" hint={`Pendente: ${formatBRL(kpis.totalPending)}`} />
          <KpiCard label="Despesa total" value={formatBRL(kpis.totalExpenseActual)} icon={ArrowUpFromLine} tone="danger" hint={`Previsto: ${formatBRL(kpis.totalExpensePlanned)}`} />
          <KpiCard label="Lucro líquido" value={formatBRL(kpis.netProfit)} icon={TrendingUp} tone={kpis.netProfit >= 0 ? "success" : "danger"} hint="Receita - Despesa" />
          <KpiCard label="Investimento" value={formatPct(kpis.investmentPct)} icon={PiggyBank} tone="info" hint={formatBRL(kpis.totalInvested)} />
          <KpiCard label="Saldo disponível" value={formatBRL(kpis.available)} icon={Wallet} tone={kpis.available >= 0 ? "success" : "danger"} />
          <KpiCard label="Poder real" value={formatBRL(kpis.realPower)} icon={PercentSquare} tone="default" hint="Saldo + Investido" />
          <KpiCard label="Receita prevista" value={formatBRL(kpis.totalRevenue)} icon={ArrowDownToLine} hint="Inclui pendentes" />
          <KpiCard label="Insights ativos" value={`${insights.length}`} icon={AlertCircle} tone={insights.some((i) => i.level === "danger") ? "danger" : "info"} hint="Análises automáticas" />
        </div>

        {/* Charts grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ChartCard title="Evolução mensal" subtitle="Receitas vs despesas" className="lg:col-span-2">
            {monthly.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height={240} minWidth={0}>
                <AreaChart data={monthly} margin={{ top: 10, right: 6, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="g-rec" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="g-desp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--chart-5))" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(var(--chart-5))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" tickFormatter={monthLabel} stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} width={36} />
                  <Tooltip {...tooltipStyle} formatter={(v: number) => formatBRL(v)} labelFormatter={(l) => monthLabel(l as string)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="receitas" name="Receitas" stroke="hsl(var(--chart-1))" fill="url(#g-rec)" strokeWidth={2} />
                  <Area type="monotone" dataKey="despesas" name="Despesas" stroke="hsl(var(--chart-5))" fill="url(#g-desp)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Receita por pessoa" subtitle="Total recebido">
            {byPerson.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height={240} minWidth={0}>
                <BarChart data={byPerson} margin={{ top: 10, right: 6, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="person" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} width={36} />
                  <Tooltip {...tooltipStyle} formatter={(v: number) => formatBRL(v)} />
                  <Bar dataKey="value" name="Recebido" radius={[6, 6, 0, 0]}>
                    {byPerson.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Lucro mensal" subtitle="Tendência de lucro líquido" className="lg:col-span-2">
            {monthly.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height={220} minWidth={0}>
                <LineChart data={monthly} margin={{ top: 10, right: 6, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" tickFormatter={monthLabel} stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} width={36} />
                  <Tooltip {...tooltipStyle} formatter={(v: number) => formatBRL(v)} labelFormatter={(l) => monthLabel(l as string)} />
                  <Line type="monotone" dataKey="lucro" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Despesas por tipo" subtitle="Distribuição">
            {byType.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height={240} minWidth={0}>
                <PieChart>
                  <Pie data={byType} dataKey="value" nameKey="type" innerRadius={42} outerRadius={75} paddingAngle={2}>
                    {byType.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="hsl(var(--card))" />
                    ))}
                  </Pie>
                  <Tooltip
                    {...tooltipStyle}
                    formatter={(v: number, n) => [formatBRL(v), EXPENSE_TYPE_LABEL[n as keyof typeof EXPENSE_TYPE_LABEL] ?? n]}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 10 }}
                    formatter={(v) => EXPENSE_TYPE_LABEL[v as keyof typeof EXPENSE_TYPE_LABEL] ?? v}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* Insights preview */}
        {insights.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-primary" /> Insights automáticos
            </h3>
            <div className="grid gap-2 md:grid-cols-2">
              {insights.slice(0, 4).map((i) => (
                <div
                  key={i.id}
                  className={`rounded-lg p-3 border text-sm ${
                    i.level === "danger"
                      ? "border-destructive/30 bg-destructive/10"
                      : i.level === "warning"
                      ? "border-warning/30 bg-warning/10"
                      : i.level === "success"
                      ? "border-success/30 bg-success/10"
                      : "border-info/30 bg-info/10"
                  }`}
                >
                  <div className="font-medium">{i.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{i.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function ChartCard({ title, subtitle, children, className = "" }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-card p-4 md:p-5 ${className}`}>
      <div className="mb-2">
        <h3 className="font-semibold text-sm">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-[260px] grid place-items-center text-sm text-muted-foreground">
      Sem dados no período
    </div>
  );
}
