import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useFinance } from "@/store/finance-store";
import { SaleFormDialog } from "@/components/finance/SaleFormDialog";
import { KpiCard } from "@/components/finance/KpiCard";
import { StatusBadge } from "@/components/finance/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2, Search, ShoppingCart, DollarSign, TrendingUp, Percent } from "lucide-react";
import { formatBRL, formatDateBR } from "@/lib/format";
import { calcSale, type Sale } from "@/lib/finance-types";
import { salesSummary } from "@/lib/finance-selectors";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function Sales() {
  const sales = useFinance((s) => s.sales);
  const removeSale = useFinance((s) => s.removeSale);
  const [editing, setEditing] = useState<Sale | null>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sales;
    return sales.filter(
      (s) =>
        s.client.toLowerCase().includes(q) ||
        s.product.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q)
    );
  }, [sales, query]);

  const summary = useMemo(() => salesSummary(filtered), [filtered]);

  return (
    <AppLayout title="Vendas / Orçamentos" description="Gestão de propostas comerciais com cálculo automático de markup, margem e lucro" actions={<SaleFormDialog />}>
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <KpiCard label="Volume total" value={formatBRL(summary.totalValue)} icon={DollarSign} tone="info" />
          <KpiCard label="Custo total" value={formatBRL(summary.totalCost)} icon={ShoppingCart} />
          <KpiCard label="Lucro bruto" value={formatBRL(summary.grossProfit)} icon={TrendingUp} tone="success" />
          <KpiCard label="Lucro líquido" value={formatBRL(summary.netProfit)} icon={Percent} tone="success" hint={`Comissão: ${formatBRL(summary.commission)}`} />
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar cliente, produto ou cidade..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="hidden sm:table-cell">Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden md:table-cell">Produto</TableHead>
                  <TableHead className="hidden lg:table-cell">Cidade</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Qtd</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Markup</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Lucro líq.</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-10">
                      Nenhum orçamento cadastrado.
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((s) => {
                  const c = calcSale(s);
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="whitespace-nowrap text-sm hidden sm:table-cell">{formatDateBR(s.date)}</TableCell>
                      <TableCell className="font-medium text-sm">
                        <div>{s.client}</div>
                        <div className="sm:hidden text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span>{formatDateBR(s.date)}</span>
                          <span>•</span>
                          <span>{s.product}</span>
                          <StatusBadge status={s.status} />
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{s.product}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{s.city || "—"}</TableCell>
                      <TableCell className="text-right tabular-nums text-sm hidden sm:table-cell">{s.quantity}</TableCell>
                      <TableCell className="text-right tabular-nums hidden md:table-cell text-sm">{c.markup.toFixed(2)}x</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">
                        {formatBRL(c.totalValue)}
                        <div className="sm:hidden text-xs text-success font-normal">{formatBRL(c.netProfit)}</div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-success hidden sm:table-cell">{formatBRL(c.netProfit)}</TableCell>
                      <TableCell className="hidden sm:table-cell"><StatusBadge status={s.status} /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-0.5 md:gap-1">
                          <Button size="icon" variant="ghost" onClick={() => setEditing(s)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <DeleteButton onConfirm={() => { removeSale(s.id); toast.success("Orçamento removido"); }} />
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

      {editing && <SaleFormDialog initial={editing} open={!!editing} onOpenChange={(o) => !o && setEditing(null)} />}
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
