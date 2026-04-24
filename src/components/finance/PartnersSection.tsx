import { useState, useEffect, useMemo } from "react";
import { Plus, Pencil, Trash2, Users, Loader2, ArrowDownToLine } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  usePartners,
  useUpsertPartner,
  useDeletePartner,
  useProfitDistributions,
  useCreateDistribution,
  useDeleteDistribution,
  type Partner,
  type ProfitDistribution,
} from "@/hooks/use-finance-data";
import { formatBRL, formatPct } from "@/lib/format";
import { toast } from "sonner";
import { z } from "zod";

const SUGGESTED_COLORS = [
  "#10b981", "#3b82f6", "#a855f7", "#f59e0b",
  "#ef4444", "#06b6d4", "#ec4899", "#84cc16",
];

const partnerSchema = z.object({
  name: z.string().trim().nonempty("Informe o nome do sócio").max(60),
  percentage: z.number().min(0).max(100),
});

const distSchema = z.object({
  partner_id: z.string().uuid("Selecione um sócio"),
  amount: z.number().positive("Valor deve ser maior que zero"),
  distribution_date: z.string().nonempty("Informe a data"),
});

interface PartnersSectionProps {
  netProfit: number;
}

export function PartnersSection({ netProfit }: PartnersSectionProps) {
  const { data: partners = [], isLoading: loadingP } = usePartners();
  const { data: distributions = [], isLoading: loadingD } = useProfitDistributions();
  const upsertPartner = useUpsertPartner();
  const removePartner = useDeletePartner();
  const createDist = useCreateDistribution();
  const removeDist = useDeleteDistribution();

  // Partner dialog
  const [pOpen, setPOpen] = useState(false);
  const [editingP, setEditingP] = useState<Partner | null>(null);
  const [pName, setPName] = useState("");
  const [pPct, setPPct] = useState("");
  const [pColor, setPColor] = useState(SUGGESTED_COLORS[0]);
  const [confirmDelP, setConfirmDelP] = useState<Partner | null>(null);

  // Distribution dialog
  const [dOpen, setDOpen] = useState(false);
  const [dPartnerId, setDPartnerId] = useState<string>("");
  const [dAmount, setDAmount] = useState("");
  const [dDate, setDDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dNotes, setDNotes] = useState("");
  const [confirmDelD, setConfirmDelD] = useState<ProfitDistribution | null>(null);

  useEffect(() => {
    if (pOpen) {
      setPName(editingP?.name ?? "");
      setPPct(editingP ? String(editingP.percentage) : "");
      setPColor(editingP?.color ?? SUGGESTED_COLORS[partners.length % SUGGESTED_COLORS.length]);
    }
  }, [pOpen, editingP, partners.length]);

  useEffect(() => {
    if (dOpen) {
      setDPartnerId(partners[0]?.id ?? "");
      setDAmount("");
      setDDate(new Date().toISOString().slice(0, 10));
      setDNotes("");
    }
  }, [dOpen, partners]);

  const totalPct = partners.reduce((s, p) => s + Number(p.percentage), 0);
  const profitForDistribution = Math.max(0, netProfit);

  // Per-partner stats
  const stats = useMemo(() => {
    return partners.map((p) => {
      const expected = profitForDistribution * (Number(p.percentage) / 100);
      const withdrawn = distributions
        .filter((d) => d.partner_id === p.id)
        .reduce((s, d) => s + Number(d.amount), 0);
      return {
        partner: p,
        expected,
        withdrawn,
        balance: expected - withdrawn,
      };
    });
  }, [partners, distributions, profitForDistribution]);

  const handleSavePartner = async () => {
    const pctNum = Number(pPct.replace(",", "."));
    const parsed = partnerSchema.safeParse({ name: pName, percentage: isFinite(pctNum) ? pctNum : -1 });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    try {
      await upsertPartner.mutateAsync({
        id: editingP?.id,
        name: parsed.data.name,
        percentage: parsed.data.percentage,
        color: pColor,
      });
      toast.success(editingP ? "Sócio atualizado" : "Sócio adicionado");
      setPOpen(false);
      setEditingP(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    }
  };

  const handleDeletePartner = async () => {
    if (!confirmDelP) return;
    try {
      await removePartner.mutateAsync(confirmDelP.id);
      toast.success("Sócio removido");
      setConfirmDelP(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao remover");
    }
  };

  const handleSaveDist = async () => {
    const amountNum = Number(dAmount.replace(",", "."));
    const parsed = distSchema.safeParse({
      partner_id: dPartnerId,
      amount: isFinite(amountNum) ? amountNum : 0,
      distribution_date: dDate,
    });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    try {
      await createDist.mutateAsync({
        partner_id: parsed.data.partner_id,
        amount: parsed.data.amount,
        distribution_date: parsed.data.distribution_date,
        notes: dNotes || undefined,
      });
      toast.success("Sangria registrada");
      setDOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    }
  };

  const handleDeleteDist = async () => {
    if (!confirmDelD) return;
    try {
      await removeDist.mutateAsync(confirmDelD.id);
      toast.success("Sangria removida");
      setConfirmDelD(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao remover");
    }
  };

  const isLoading = loadingP || loadingD;

  return (
    <div className="rounded-xl border border-border bg-card p-4 md:p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Distribuição de lucro
          </h3>
          <p className="text-xs text-muted-foreground">
            Lucro distribuível: <span className="font-medium text-foreground">{formatBRL(profitForDistribution)}</span>
            {totalPct > 0 && (
              <>
                {" "}· Total alocado: <span className={totalPct > 100 ? "text-destructive font-medium" : "text-foreground font-medium"}>{totalPct.toFixed(1)}%</span>
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditingP(null);
              setPOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Sócio
          </Button>
          <Button
            size="sm"
            onClick={() => setDOpen(true)}
            disabled={partners.length === 0}
          >
            <ArrowDownToLine className="h-4 w-4 mr-1" /> Sangria
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-8 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : partners.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Nenhum sócio cadastrado. Adicione os sócios e seus percentuais de participação para ver a distribuição automática.
        </div>
      ) : (
        <div className="space-y-2">
          {stats.map(({ partner: p, expected, withdrawn, balance }) => (
            <div
              key={p.id}
              className="rounded-lg border border-border bg-background/40 p-3 hover:border-primary/40 transition-colors group"
            >
              <div className="flex items-center gap-3 flex-wrap">
                <div
                  className="h-10 w-10 rounded-full grid place-items-center shrink-0 font-semibold text-sm"
                  style={{ background: `${p.color}33`, color: p.color }}
                >
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{formatPct(Number(p.percentage))} de participação</div>
                </div>
                <div className="flex gap-4 md:gap-6 text-xs">
                  <div>
                    <div className="text-muted-foreground">Previsto</div>
                    <div className="font-semibold tabular-nums text-info">{formatBRL(expected)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Retirado</div>
                    <div className="font-semibold tabular-nums">{formatBRL(withdrawn)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Saldo</div>
                    <div className={`font-semibold tabular-nums ${balance >= 0 ? "text-success" : "text-destructive"}`}>
                      {formatBRL(balance)}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    aria-label="Editar"
                    onClick={() => {
                      setEditingP(p);
                      setPOpen(true);
                    }}
                    className="h-7 w-7 grid place-items-center rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    aria-label="Remover"
                    onClick={() => setConfirmDelP(p)}
                    className="h-7 w-7 grid place-items-center rounded hover:bg-destructive/15 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {distributions.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                Últimas sangrias
              </div>
              <div className="space-y-1">
                {distributions.slice(0, 5).map((d) => {
                  const partner = partners.find((p) => p.id === d.partner_id);
                  return (
                    <div
                      key={d.id}
                      className="flex items-center justify-between text-xs py-1.5 px-2 rounded hover:bg-background/60 group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ background: partner?.color ?? "#888" }}
                        />
                        <span className="font-medium truncate">{partner?.name ?? "—"}</span>
                        <span className="text-muted-foreground shrink-0">
                          {new Date(d.distribution_date + "T00:00").toLocaleDateString("pt-BR")}
                        </span>
                        {d.notes && (
                          <span className="text-muted-foreground truncate hidden md:inline">— {d.notes}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-semibold tabular-nums">{formatBRL(Number(d.amount))}</span>
                        <button
                          aria-label="Remover sangria"
                          onClick={() => setConfirmDelD(d)}
                          className="h-6 w-6 grid place-items-center rounded hover:bg-destructive/15 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Partner dialog */}
      <Dialog open={pOpen} onOpenChange={setPOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingP ? "Editar sócio" : "Novo sócio"}</DialogTitle>
            <DialogDescription>Defina o nome e o percentual de participação.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="p-name">Nome</Label>
              <Input id="p-name" value={pName} onChange={(e) => setPName(e.target.value)} placeholder="Ex: Pedro Henrique" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-pct">Participação (%)</Label>
              <Input id="p-pct" inputMode="decimal" value={pPct} onChange={(e) => setPPct(e.target.value)} placeholder="0,00" />
              <p className="text-[11px] text-muted-foreground">A soma de todos os sócios não deve passar de 100%.</p>
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setPColor(c)}
                    aria-label={`Cor ${c}`}
                    className={`h-8 w-8 rounded-md border-2 transition-transform ${pColor === c ? "scale-110 border-foreground" : "border-transparent"}`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setPOpen(false)} disabled={upsertPartner.isPending}>
              Cancelar
            </Button>
            <Button onClick={handleSavePartner} disabled={upsertPartner.isPending}>
              {upsertPartner.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Distribution dialog */}
      <Dialog open={dOpen} onOpenChange={setDOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar sangria</DialogTitle>
            <DialogDescription>Lance uma retirada de lucro para um sócio.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Sócio</Label>
              <Select value={dPartnerId} onValueChange={setDPartnerId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {partners.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="d-amount">Valor (R$)</Label>
                <Input id="d-amount" inputMode="decimal" value={dAmount} onChange={(e) => setDAmount(e.target.value)} placeholder="0,00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="d-date">Data</Label>
                <Input id="d-date" type="date" value={dDate} onChange={(e) => setDDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="d-notes">Observação (opcional)</Label>
              <Input id="d-notes" value={dNotes} onChange={(e) => setDNotes(e.target.value)} placeholder="Ex: Pró-labore março" />
            </div>
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setDOpen(false)} disabled={createDist.isPending}>
              Cancelar
            </Button>
            <Button onClick={handleSaveDist} disabled={createDist.isPending}>
              {createDist.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelP} onOpenChange={(o) => !o && setConfirmDelP(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover sócio?</AlertDialogTitle>
            <AlertDialogDescription>
              "{confirmDelP?.name}" e todas as sangrias relacionadas serão removidas. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePartner} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!confirmDelD} onOpenChange={(o) => !o && setConfirmDelD(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover sangria?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta retirada de {confirmDelD ? formatBRL(Number(confirmDelD.amount)) : ""} será removida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDist} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
