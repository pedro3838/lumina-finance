import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Building2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useBankAccounts,
  useUpsertBankAccount,
  useDeleteBankAccount,
  type BankAccount,
} from "@/hooks/use-finance-data";
import { formatBRL } from "@/lib/format";
import { toast } from "sonner";
import { z } from "zod";

const SUGGESTED_COLORS = [
  "#10b981", "#3b82f6", "#a855f7", "#f59e0b",
  "#ef4444", "#06b6d4", "#ec4899", "#84cc16",
];

const schema = z.object({
  name: z.string().trim().nonempty("Informe o nome do banco").max(60),
  balance: z.number().finite(),
});

export function BanksSection() {
  const { data: banks = [], isLoading } = useBankAccounts();
  const upsert = useUpsertBankAccount();
  const remove = useDeleteBankAccount();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BankAccount | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<BankAccount | null>(null);
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [color, setColor] = useState(SUGGESTED_COLORS[0]);

  useEffect(() => {
    if (open) {
      setName(editing?.name ?? "");
      setBalance(editing ? String(editing.balance) : "");
      setColor(editing?.color ?? SUGGESTED_COLORS[0]);
    }
  }, [open, editing]);

  const totalBalance = banks.reduce((s, b) => s + Number(b.balance), 0);

  const handleSave = async () => {
    const balanceNum = Number(balance.replace(",", "."));
    const parsed = schema.safeParse({ name, balance: balanceNum });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    try {
      await upsert.mutateAsync({
        id: editing?.id,
        name: parsed.data.name,
        balance: parsed.data.balance,
        color,
      });
      toast.success(editing ? "Banco atualizado" : "Banco adicionado");
      setOpen(false);
      setEditing(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await remove.mutateAsync(confirmDelete.id);
      toast.success("Banco removido");
      setConfirmDelete(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao remover");
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 md:p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" /> Saldos por banco
          </h3>
          <p className="text-xs text-muted-foreground">
            Total consolidado: <span className="font-medium text-foreground">{formatBRL(totalBalance)}</span>
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1" /> Banco
        </Button>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-8 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : banks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Nenhuma conta cadastrada. Adicione bancos como Nubank, Itaú, Mercado Pago para acompanhar seus saldos.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {banks.map((b) => (
            <div
              key={b.id}
              className="group relative rounded-lg border border-border bg-background/40 p-3 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-lg grid place-items-center shrink-0"
                  style={{ background: `${b.color}22`, color: b.color }}
                >
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{b.name}</div>
                  <div className="text-base font-semibold tabular-nums truncate">
                    {formatBRL(Number(b.balance))}
                  </div>
                </div>
                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    aria-label="Editar"
                    onClick={() => {
                      setEditing(b);
                      setOpen(true);
                    }}
                    className="h-7 w-7 grid place-items-center rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    aria-label="Remover"
                    onClick={() => setConfirmDelete(b)}
                    className="h-7 w-7 grid place-items-center rounded hover:bg-destructive/15 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar banco" : "Novo banco"}</DialogTitle>
            <DialogDescription>
              Informe o nome do banco e o saldo atual da conta.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="b-name">Nome</Label>
              <Input
                id="b-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Nubank, Itaú, Mercado Pago"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="b-balance">Saldo atual (R$)</Label>
              <Input
                id="b-balance"
                inputMode="decimal"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="0,00"
              />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    aria-label={`Cor ${c}`}
                    className={`h-8 w-8 rounded-md border-2 transition-transform ${
                      color === c ? "scale-110 border-foreground" : "border-transparent"
                    }`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={upsert.isPending}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={upsert.isPending}>
              {upsert.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover banco?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O banco "{confirmDelete?.name}" será removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
