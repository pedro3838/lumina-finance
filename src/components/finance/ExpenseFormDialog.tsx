import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useFinance } from "@/store/finance-store";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_TYPE_LABEL,
  PAYMENT_METHOD_LABEL,
  PEOPLE,
  type Expense,
  type ExpenseStatus,
  type ExpenseType,
  type PaymentMethod,
  type Person,
} from "@/lib/finance-types";
import { todayISO } from "@/lib/format";
import { toast } from "sonner";

interface ExpenseFormDialogProps {
  initial?: Expense;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
}

export function ExpenseFormDialog({ initial, trigger, open, onOpenChange }: ExpenseFormDialogProps) {
  const addExpense = useFinance((s) => s.addExpense);
  const updateExpense = useFinance((s) => s.updateExpense);
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [form, setForm] = useState<Omit<Expense, "id" | "createdAt">>(() => ({
    date: initial?.date ?? todayISO(),
    type: initial?.type ?? "fixo",
    category: initial?.category ?? EXPENSE_CATEGORIES[0],
    description: initial?.description ?? "",
    paymentMethod: initial?.paymentMethod ?? "pix",
    plannedAmount: initial?.plannedAmount ?? 0,
    actualAmount: initial?.actualAmount ?? 0,
    status: initial?.status ?? "pendente",
    person: initial?.person ?? "Pedro",
  }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description.trim()) return toast.error("Descrição obrigatória");
    if (form.plannedAmount < 0 || form.actualAmount < 0) return toast.error("Valores inválidos");

    if (initial) {
      updateExpense(initial.id, form);
      toast.success("Despesa atualizada");
    } else {
      addExpense(form);
      toast.success("Despesa adicionada");
    }
    setOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      {!trigger && !open && (
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-1" /> Nova despesa
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar despesa" : "Nova despesa"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Data</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Pessoa</Label>
              <Select value={form.person} onValueChange={(v) => setForm({ ...form, person: v as Person })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PEOPLE.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={120} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as ExpenseType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(EXPENSE_TYPE_LABEL) as ExpenseType[]).map((t) => (
                    <SelectItem key={t} value={t}>{EXPENSE_TYPE_LABEL[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{EXPENSE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Pagamento</Label>
              <Select value={form.paymentMethod} onValueChange={(v) => setForm({ ...form, paymentMethod: v as PaymentMethod })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(PAYMENT_METHOD_LABEL) as PaymentMethod[]).map((m) => (
                    <SelectItem key={m} value={m}>{PAYMENT_METHOD_LABEL[m]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ExpenseStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Valor previsto (R$)</Label>
              <Input
                type="number" step="0.01" min="0"
                value={form.plannedAmount || ""}
                onChange={(e) => setForm({ ...form, plannedAmount: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Valor real (R$)</Label>
              <Input
                type="number" step="0.01" min="0"
                value={form.actualAmount || ""}
                onChange={(e) => setForm({ ...form, actualAmount: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit">{initial ? "Salvar" : "Adicionar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
