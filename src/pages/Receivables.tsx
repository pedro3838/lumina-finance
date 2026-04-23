import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useFinance } from "@/store/finance-store";
import { FiltersBar, type FilterValue } from "@/components/finance/FiltersBar";
import { IncomeFormDialog } from "@/components/finance/IncomeFormDialog";
import { KpiCard } from "@/components/finance/KpiCard";
import { StatusBadge } from "@/components/finance/StatusBadge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowDownToLine, AlertTriangle, CheckCircle2, Clock, Pencil, Trash2, Check } from "lucide-react";
import { formatBRL, formatDateBR, todayISO } from "@/lib/format";
import { filterIncomes } from "@/lib/finance-selectors";
import type { Income } from "@/lib/finance-types";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function Receivables() {
  const incomes = useFinance((s) => s.incomes);
  const updateIncome = useFinance((s) => s.updateIncome);
  const removeIncome = useFinance((s) => s.removeIncome);
  const [filter, setFilter] = useState<FilterValue>({ month: "all", person: "Todos", category: "Todas" });
  const [editing, setEditing] = useState<Income | null>(null);

  const filtered = useMemo(
    () =>
      filterIncomes(incomes, {
        month: filter.month === "all" ? undefined : filter.month,
        person: filter.person,
        category: filter.category === "Todas" ? undefined : filter.category,
      }),
    [incomes, filter]
  );

  const totalReceived = filtered.filter((i) => i.status === "recebido").reduce((s, i) => s + i.amount, 0);
  const totalPending = filtered.filter((i) => i.status === "pendente").reduce((s, i) => s + i.amount, 0);
  const total = totalReceived + totalPending;
  const today = todayISO();
  const overdue = filtered.filter((i) => i.status === "pendente" && i.date < today);

  function markReceived(i: Income) {
    updateIncome(i.id, { status: "recebido" });
    toast.success("Marcada como recebida");
  }

  return (
    <AppLayout
      title="Contas a Receber"
      description="Gestão de receitas previstas e recebidas"
      actions={<IncomeFormDialog />}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <KpiCard label="Total previsto" value={formatBRL(total)} icon={ArrowDownToLine} />
          <KpiCard label="Recebido" value={formatBRL(totalReceived)} icon={CheckCircle2} tone="success" />
          <KpiCard label="Pendente" value={formatBRL(totalPending)} icon={Clock} tone="warning" />
          <KpiCard label="Atrasadas" value={`${overdue.length}`} icon={AlertTriangle} tone={overdue.length > 0 ? "danger" : "default"} hint={formatBRL(overdue.reduce((s, i) => s + i.amount, 0))} />
        </div>

        <FiltersBar value={filter} onChange={setFilter} />

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Pessoa</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                      Nenhuma receita cadastrada neste filtro.
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((i) => {
                  const isOverdue = i.status === "pendente" && i.date < today;
                  return (
                    <TableRow key={i.id} className={isOverdue ? "bg-destructive/5" : ""}>
                      <TableCell className="whitespace-nowrap text-sm">{formatDateBR(i.date)}</TableCell>
                      <TableCell className="font-medium text-sm">{i.description}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{i.category}</TableCell>
                      <TableCell className="text-sm">{i.person}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{formatBRL(i.amount)}</TableCell>
                      <TableCell>
                        <StatusBadge status={i.status} />
                        {isOverdue && <span className="ml-2 text-xs text-destructive">Atrasada</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {i.status === "pendente" && (
                            <Button size="icon" variant="ghost" onClick={() => markReceived(i)} title="Marcar como recebida">
                              <Check className="h-4 w-4 text-success" />
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" onClick={() => setEditing(i)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <DeleteButton onConfirm={() => { removeIncome(i.id); toast.success("Receita removida"); }} />
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
        <IncomeFormDialog
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
        <Button size="icon" variant="ghost">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
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
