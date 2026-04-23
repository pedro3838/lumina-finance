import type { Expense, Income, Person, Sale } from "@/lib/finance-types";
import { calcSale, classifyExpense } from "@/lib/finance-types";
import { monthKey } from "@/lib/format";

export interface PeriodFilter {
  month?: string; // YYYY-MM, undefined = all
  person?: Person | "Todos";
  category?: string | "Todas";
}

export function inPeriod(dateISO: string, filter: PeriodFilter): boolean {
  if (filter.month && monthKey(dateISO) !== filter.month) return false;
  return true;
}

export function filterIncomes(items: Income[], f: PeriodFilter): Income[] {
  return items.filter((i) => {
    if (!inPeriod(i.date, f)) return false;
    if (f.person && f.person !== "Todos" && i.person !== f.person) return false;
    if (f.category && f.category !== "Todas" && i.category !== f.category) return false;
    return true;
  });
}

export function filterExpenses(items: Expense[], f: PeriodFilter): Expense[] {
  return items.filter((e) => {
    if (!inPeriod(e.date, f)) return false;
    if (f.person && f.person !== "Todos" && e.person !== f.person) return false;
    if (f.category && f.category !== "Todas" && e.category !== f.category) return false;
    return true;
  });
}

export interface DashboardKpis {
  totalRevenue: number;
  totalReceived: number;
  totalPending: number;
  totalExpensePlanned: number;
  totalExpenseActual: number;
  totalInvested: number;
  netProfit: number;
  investmentPct: number;
  realPower: number; // saldo disponível: recebido - pago - investido (investido continua "seu" mas alocado)
  available: number; // recebido - pago
}

export function computeKpis(incomes: Income[], expenses: Expense[]): DashboardKpis {
  const totalRevenue = incomes.reduce((s, i) => s + i.amount, 0);
  const totalReceived = incomes.filter((i) => i.status === "recebido").reduce((s, i) => s + i.amount, 0);
  const totalPending = totalRevenue - totalReceived;

  const totalExpensePlanned = expenses.reduce((s, e) => s + e.plannedAmount, 0);
  const totalExpenseActual = expenses.reduce((s, e) => s + e.actualAmount, 0);
  const totalInvested = expenses.filter((e) => e.type === "investimento").reduce((s, e) => s + e.actualAmount, 0);

  const netProfit = totalReceived - totalExpenseActual;
  const investmentPct = totalReceived > 0 ? (totalInvested / totalReceived) * 100 : 0;
  const available = totalReceived - totalExpenseActual;
  const realPower = available + totalInvested; // patrimônio líquido do período

  return {
    totalRevenue,
    totalReceived,
    totalPending,
    totalExpensePlanned,
    totalExpenseActual,
    totalInvested,
    netProfit,
    investmentPct,
    realPower,
    available,
  };
}

export function groupByMonth(incomes: Income[], expenses: Expense[]) {
  const map = new Map<string, { month: string; receitas: number; despesas: number; lucro: number }>();
  for (const i of incomes) {
    const k = monthKey(i.date);
    const cur = map.get(k) ?? { month: k, receitas: 0, despesas: 0, lucro: 0 };
    cur.receitas += i.status === "recebido" ? i.amount : 0;
    map.set(k, cur);
  }
  for (const e of expenses) {
    const k = monthKey(e.date);
    const cur = map.get(k) ?? { month: k, receitas: 0, despesas: 0, lucro: 0 };
    cur.despesas += e.actualAmount;
    map.set(k, cur);
  }
  const arr = Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
  arr.forEach((r) => (r.lucro = r.receitas - r.despesas));
  return arr;
}

export function revenueByPerson(incomes: Income[]) {
  const map = new Map<string, number>();
  for (const i of incomes) {
    if (i.status !== "recebido") continue;
    map.set(i.person, (map.get(i.person) ?? 0) + i.amount);
  }
  return Array.from(map.entries()).map(([person, value]) => ({ person, value }));
}

export function expenseByType(expenses: Expense[]) {
  const map = new Map<string, number>();
  for (const e of expenses) {
    map.set(e.type, (map.get(e.type) ?? 0) + e.actualAmount);
  }
  return Array.from(map.entries()).map(([type, value]) => ({ type, value }));
}

export function expenseByCategory(expenses: Expense[]) {
  const map = new Map<string, number>();
  for (const e of expenses) {
    map.set(e.category, (map.get(e.category) ?? 0) + e.actualAmount);
  }
  return Array.from(map.entries())
    .map(([category, value]) => ({ category, value }))
    .sort((a, b) => b.value - a.value);
}

export interface CashFlowRow {
  date: string;
  description: string;
  category: string;
  person: Person;
  inflow: number;
  outflow: number;
  type: "income" | "expense";
}

export function buildCashFlow(incomes: Income[], expenses: Expense[]): { rows: CashFlowRow[]; daily: { date: string; saldo: number; acumulado: number }[] } {
  const rows: CashFlowRow[] = [];
  for (const i of incomes) {
    if (i.status !== "recebido") continue;
    rows.push({
      date: i.date,
      description: i.description,
      category: i.category,
      person: i.person,
      inflow: i.amount,
      outflow: 0,
      type: "income",
    });
  }
  for (const e of expenses) {
    if (e.status !== "pago") continue;
    rows.push({
      date: e.date,
      description: e.description,
      category: e.category,
      person: e.person,
      inflow: 0,
      outflow: e.actualAmount,
      type: "expense",
    });
  }
  rows.sort((a, b) => a.date.localeCompare(b.date));

  const dailyMap = new Map<string, number>();
  for (const r of rows) {
    dailyMap.set(r.date, (dailyMap.get(r.date) ?? 0) + r.inflow - r.outflow);
  }
  const dates = Array.from(dailyMap.keys()).sort();
  let acc = 0;
  const daily = dates.map((date) => {
    const saldo = dailyMap.get(date) ?? 0;
    acc += saldo;
    return { date, saldo, acumulado: acc };
  });

  return { rows, daily };
}

export function salesSummary(sales: Sale[]) {
  const totals = sales.reduce(
    (acc, s) => {
      const c = calcSale(s);
      acc.totalValue += c.totalValue;
      acc.totalCost += c.totalCost;
      acc.grossProfit += c.grossProfit;
      acc.netProfit += c.netProfit;
      acc.commission += c.commissionAmount;
      return acc;
    },
    { totalValue: 0, totalCost: 0, grossProfit: 0, netProfit: 0, commission: 0 }
  );
  return totals;
}

export interface Insight {
  id: string;
  level: "info" | "success" | "warning" | "danger";
  title: string;
  description: string;
}

export function generateInsights(incomes: Income[], expenses: Expense[]): Insight[] {
  const out: Insight[] = [];
  const k = computeKpis(incomes, expenses);

  if (k.totalReceived === 0 && k.totalExpenseActual === 0) {
    out.push({
      id: "empty",
      level: "info",
      title: "Comece adicionando lançamentos",
      description: "Cadastre receitas e despesas para destravar análises automáticas.",
    });
    return out;
  }

  // Investment ratio
  if (k.totalReceived > 0) {
    if (k.investmentPct < 10) {
      out.push({
        id: "low-invest",
        level: "warning",
        title: "Investimento abaixo do recomendado",
        description: `Você está investindo ${k.investmentPct.toFixed(1)}% da sua receita. O ideal é começar em 10–20%.`,
      });
    } else if (k.investmentPct >= 20) {
      out.push({
        id: "good-invest",
        level: "success",
        title: "Excelente disciplina de investimento",
        description: `${k.investmentPct.toFixed(1)}% da receita foi para o ATIVO. Continue assim.`,
      });
    }
  }

  // Superfluous spending
  const superfluo = expenses.filter((e) => e.type === "superfluo").reduce((s, e) => s + e.actualAmount, 0);
  if (k.totalReceived > 0 && superfluo / k.totalReceived > 0.15) {
    out.push({
      id: "superfluo",
      level: "warning",
      title: "Gastos supérfluos elevados",
      description: `Supérfluos representam ${((superfluo / k.totalReceived) * 100).toFixed(1)}% da sua receita. Considere reduzir.`,
    });
  }

  // Essential rule (50%)
  const essential = expenses
    .filter((e) => e.type === "fixo" || e.category === "Moradia" || e.category === "Alimentação")
    .reduce((s, e) => s + e.actualAmount, 0);
  if (k.totalReceived > 0 && essential / k.totalReceived > 0.5) {
    out.push({
      id: "essential-50",
      level: "warning",
      title: "Despesas essenciais acima de 50%",
      description: `Essenciais consomem ${((essential / k.totalReceived) * 100).toFixed(1)}% da receita. A regra clássica sugere até 50%.`,
    });
  }

  // Negative balance
  if (k.netProfit < 0) {
    out.push({
      id: "negative",
      level: "danger",
      title: "Saldo negativo no período",
      description: `Seus gastos superaram as receitas em ${Math.abs(k.netProfit).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}.`,
    });
  } else if (k.netProfit > 0 && k.totalReceived > 0) {
    out.push({
      id: "surplus",
      level: "success",
      title: "Resultado positivo",
      description: `Você fechou o período com lucro líquido de ${k.netProfit.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}.`,
    });
  }

  // Planned vs actual
  const overrun = expenses.filter((e) => e.actualAmount > e.plannedAmount * 1.1 && e.plannedAmount > 0);
  if (overrun.length > 0) {
    out.push({
      id: "overrun",
      level: "warning",
      title: `${overrun.length} despesa(s) acima do planejado`,
      description: "Revise os gastos com estouro de orçamento superior a 10%.",
    });
  }

  // Pending receivables
  const pending = incomes.filter((i) => i.status === "pendente");
  if (pending.length > 0) {
    out.push({
      id: "pending",
      level: "info",
      title: `${pending.length} receita(s) pendente(s)`,
      description: `Total a receber: ${pending.reduce((s, i) => s + i.amount, 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}.`,
    });
  }

  return out;
}

export { classifyExpense };
