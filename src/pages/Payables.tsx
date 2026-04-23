import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useFinance } from "@/store/finance-store";
import { FiltersBar, type FilterValue } from "@/components/finance/FiltersBar";
import { ExpenseFormDialog } from "@/components/finance/ExpenseFormDialog";
import { KpiCard } from "@/components/finance/KpiCard";
import { StatusBadge } from "@/components/finance/StatusBadge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpFromLine, AlertTriangle, CheckCircle2, Clock, Pencil, Trash2, Check, TrendingUp } from "lucide-react";
import { formatBRL, formatDateBR } from "@/lib/format";
import { filterExpenses } from "@/lib/finance-selectors";
import { classifyExpense, EXPENSE_TYPE_LABEL, PAYMENT_METHOD_LABEL, type Expense } from "@/lib/finance-types";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function Payables() {
  const expenses = useFinance((s) => s.expenses);
  const updateExpense = useFinance((s) => s.updateExpense);
  const removeExpense = useFinance((s) => s.removeExpense);
  const [filter, setFilter] = useState<FilterValue>({ month: "all", person: "Todos", category: "Todas" });
  const [editing, setEditing] = useState<Expense | null>(null);

  const filtered = useMemo(
    () =>
      filterExpenses(expenses, {
        month: filter.month === "all" ? undefined : filter.month,
        person: filter.person,
        category: filter.category === "Todas" ? undefined : filter.category,
      }),
    [expenses, filter]
  );

  const totalActual = filtered.reduce((s, e) => s + e.actualAmount, 0);
  const totalPlanned = filtered.reduce((s, e) => s + e.plannedAmount, 0);
  const totalInvest = filtered.filter((e) => e.type === "investimento").reduce((s, e) => s + e.actualAmount, 0);
  const overrun = filtered.filter((e) => e.plannedAmount > 0 && e.actualAmount > e.plannedAmount * 1.1);

  function markPaid(e: Expense) {
    updateExpense(e.id, { status: "pago", actualAmount: e.actualAmount || e.plannedAmount });
    toast.success("Marcada como paga");
  }

  return (
    <AppLayout
      title="Contas a Pagar"
      description="Despesas, investimentos e classificação ATIVO/PASSIVO"
      actions={<ExpenseFormDialog />}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <KpiCard label="Total real" value={formatBRL(totalActual)} icon={ArrowUpFromLine} tone="danger" />
          <KpiCard label="Total previsto" value={formatBRL(totalPlanned)} icon={Clock} hint={`Diferença: ${formatBRL(totalActual - totalPlanned)}`} />
          <KpiCard label="Investimento (ATIVO)" value={formatBRL(totalInvest)} icon={TrendingUp} tone="success" />
          <KpiCard label="Estouros" value={`${overrun.length}`} icon={AlertTriangle} tone={overrun.length > 0 ? "warning" : "default"} hint=">10% acima do previsto" />
        </div>

        <FiltersBar value={filter} onChange={setFilter} />

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="hidden md:table-cell">Categoria</TableHead>
                  <TableHead className="hidden lg:table-cell">Pagamento</TableHead>
                  <TableHead>Class.</TableHead>
                  <TableHead className="text-right">Previsto</TableHead>
                  <TableHead className="text-right">Real</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-10">
                      Nenhuma despesa cadastrada neste filtro.
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((e) => {
                  const cls = classifyExpense(e.type);
                  const overrunPct = e.plannedAmount > 0 ? ((e.actualAmount - e.plannedAmount) / e.plannedAmount) * 100 : 0;
                  return (
                    <TableRow key={e.id} className={overrunPct > 10 ? "bg-warning/5" : ""}>
                      <TableCell className="whitespace-nowrap text-sm">{formatDateBR(e.date)}</TableCell>
                      <TableCell className="font-medium text-sm">{e.description}</TableCell>
                      <TableCell><StatusBadge status={EXPENSE_TYPE_LABEL[e.type].toLowerCase()} /></TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{e.category}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{PAYMENT_METHOD_LABEL[e.paymentMethod]}</TableCell>
                      <TableCell><StatusBadge status={cls} /></TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">{formatBRL(e.plannedAmount)}</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">
                        {formatBRL(e.actualAmount)}
                        {overrunPct > 10 && <div className="text-[10px] text-warning">+{overrunPct.toFixed(0)}%</div>}
                      </TableCell>
                      <TableCell><StatusBadge status={e.status} /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {e.status === "pendente" && (
                            <Button size="icon" variant="ghost" onClick={() => markPaid(e)} title="Marcar como paga">
                              <Check className="h-4 w-4 text-success" />
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" onClick={() => setEditing(e)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <DeleteButton onConfirm={() => { removeExpense(e.id); toast.success("Despesa removida"); }} />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {editing && (
        <ExpenseFormDialog
          initial={editing}
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}
    </AppLayout>
  );
}

function DeleteButton({ onConfirm }: { onConfirm: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="icon" variant="ghost"><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
          <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Excluir</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
