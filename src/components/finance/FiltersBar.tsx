import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PEOPLE, type Person } from "@/lib/finance-types";
import { useFinance } from "@/store/finance-store";
import { useMemo } from "react";
import { monthKey, monthLabel } from "@/lib/format";

export interface FilterValue {
  month: string; // "all" or YYYY-MM
  person: Person | "Todos";
  category: string;
}

interface FiltersBarProps {
  value: FilterValue;
  onChange: (v: FilterValue) => void;
  categories?: string[];
  showCategory?: boolean;
}

export function FiltersBar({ value, onChange, categories, showCategory = true }: FiltersBarProps) {
  const incomes = useFinance((s) => s.incomes);
  const expenses = useFinance((s) => s.expenses);

  const months = useMemo(() => {
    const set = new Set<string>();
    incomes.forEach((i) => set.add(monthKey(i.date)));
    expenses.forEach((e) => set.add(monthKey(e.date)));
    return Array.from(set).sort().reverse();
  }, [incomes, expenses]);

  const cats = useMemo(() => {
    if (categories) return categories;
    const set = new Set<string>();
    incomes.forEach((i) => set.add(i.category));
    expenses.forEach((e) => set.add(e.category));
    return Array.from(set).sort();
  }, [categories, incomes, expenses]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      <Select value={value.month} onValueChange={(v) => onChange({ ...value, month: v })}>
        <SelectTrigger className="bg-card">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os períodos</SelectItem>
          {months.map((m) => (
            <SelectItem key={m} value={m}>
              {monthLabel(m)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={value.person} onValueChange={(v) => onChange({ ...value, person: v as Person | "Todos" })}>
        <SelectTrigger className="bg-card">
          <SelectValue placeholder="Pessoa" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Todos">Todas as pessoas</SelectItem>
          {PEOPLE.map((p) => (
            <SelectItem key={p} value={p}>
              {p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showCategory && (
        <Select value={value.category} onValueChange={(v) => onChange({ ...value, category: v })}>
          <SelectTrigger className="bg-card">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todas">Todas as categorias</SelectItem>
            {cats.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
