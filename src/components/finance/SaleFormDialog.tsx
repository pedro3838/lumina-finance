import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useFinance } from "@/store/finance-store";
import { calcSale, PEOPLE, type Person, type Sale, type SaleStatus } from "@/lib/finance-types";
import { formatBRL, todayISO } from "@/lib/format";
import { toast } from "sonner";

interface SaleFormDialogProps {
  initial?: Sale;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
}

const STATUSES: SaleStatus[] = ["rascunho", "enviado", "aprovado", "concluido", "cancelado"];

export function SaleFormDialog({ initial, trigger, open, onOpenChange }: SaleFormDialogProps) {
  const addSale = useFinance((s) => s.addSale);
  const updateSale = useFinance((s) => s.updateSale);
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [form, setForm] = useState<Omit<Sale, "id" | "createdAt">>(() => ({
    date: initial?.date ?? todayISO(),
    client: initial?.client ?? "",
    city: initial?.city ?? "",
    product: initial?.product ?? "",
    cost: initial?.cost ?? 0,
    quantity: initial?.quantity ?? 1,
    marginPercent: initial?.marginPercent ?? 30,
    commissionPercent: initial?.commissionPercent ?? 50,
    status: initial?.status ?? "rascunho",
    person: initial?.person ?? "Pedro",
  }));

  const calc = useMemo(() => calcSale(form), [form]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.client.trim() || !form.product.trim()) return toast.error("Cliente e produto são obrigatórios");
    if (form.cost < 0 || form.quantity <= 0) return toast.error("Valores inválidos");
    if (initial) {
      updateSale(initial.id, form);
      toast.success("Orçamento atualizado");
    } else {
      addSale(form);
      toast.success("Orçamento adicionado");
    }
    setOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      {!trigger && !open && (
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-1" /> Novo orçamento
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar orçamento" : "Novo orçamento"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Data</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Pessoa responsável</Label>
              <Select value={form.person} onValueChange={(v) => setForm({ ...form, person: v as Person })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PEOPLE.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Cliente</Label>
              <Input value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} maxLength={120} required />
            </div>
            <div className="space-y-1.5">
              <Label>Cidade</Label>
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} maxLength={80} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Produto / Serviço</Label>
              <Input value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} maxLength={160} required />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label>Custo unit. (R$)</Label>
              <Input type="number" step="0.01" min="0" value={form.cost || ""} onChange={(e) => setForm({ ...form, cost: parseFloat(e.target.value) || 0 })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Quantidade</Label>
              <Input type="number" step="1" min="1" value={form.quantity || ""} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Margem (%)</Label>
              <Input type="number" step="0.1" min="0" max="99" value={form.marginPercent} onChange={(e) => setForm({ ...form, marginPercent: parseFloat(e.target.value) || 0 })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Comissão (%)</Label>
              <Input type="number" step="0.1" min="0" max="100" value={form.commissionPercent} onChange={(e) => setForm({ ...form, commissionPercent: parseFloat(e.target.value) || 0 })} required />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-4 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <Stat label="Markup" value={`${calc.markup.toFixed(2)}x`} />
            <Stat label="Preço sugerido" value={formatBRL(calc.unitPrice)} />
            <Stat label="Valor total" value={formatBRL(calc.totalValue)} highlight />
            <Stat label="Lucro bruto" value={formatBRL(calc.grossProfit)} />
            <Stat label="Comissão" value={formatBRL(calc.commissionAmount)} />
            <Stat label="Lucro líquido" value={formatBRL(calc.netProfit)} highlight />
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as SaleStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">Cancelar</Button>
            <Button type="submit" className="w-full sm:w-auto">{initial ? "Salvar" : "Adicionar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className={`mt-0.5 font-semibold tabular-nums ${highlight ? "text-primary" : ""}`}>{value}</div>
    </div>
  );
}
