import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useFinance } from "@/store/finance-store";
import { INCOME_CATEGORIES, PEOPLE, type Income, type IncomeStatus, type Person } from "@/lib/finance-types";
import { todayISO } from "@/lib/format";
import { toast } from "sonner";

interface IncomeFormDialogProps {
  initial?: Income;
  trigger?: React.ReactNode;
  onClose?: () => void;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
}

export function IncomeFormDialog({ initial, trigger, open, onOpenChange }: IncomeFormDialogProps) {
  const addIncome = useFinance((s) => s.addIncome);
  const updateIncome = useFinance((s) => s.updateIncome);
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [form, setForm] = useState<Omit<Income, "id" | "createdAt">>(() => ({
    date: initial?.date ?? todayISO(),
    description: initial?.description ?? "",
    category: initial?.category ?? INCOME_CATEGORIES[0],
    amount: initial?.amount ?? 0,
    status: initial?.status ?? "pendente",
    person: initial?.person ?? "Pedro",
  }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description.trim()) return toast.error("Descrição obrigatória");
    if (form.amount <= 0) return toast.error("Valor deve ser maior que zero");

    if (initial) {
      updateIncome(initial.id, form);
      toast.success("Receita atualizada");
    } else {
      addIncome(form);
      toast.success("Receita adicionada");
    }
    setOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      {!trigger && !open && (
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-1" /> Nova receita
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar receita" : "Nova receita"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Data</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.amount || ""}
                onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              maxLength={120}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INCOME_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Pessoa</Label>
              <Select value={form.person} onValueChange={(v) => setForm({ ...form, person: v as Person })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PEOPLE.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as IncomeStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="recebido">Recebido</SelectItem>
              </SelectContent>
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
