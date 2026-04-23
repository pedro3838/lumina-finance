import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Expense, Income, Sale } from "@/lib/finance-types";

interface FinanceState {
  incomes: Income[];
  expenses: Expense[];
  sales: Sale[];
  addIncome: (i: Omit<Income, "id" | "createdAt">) => void;
  updateIncome: (id: string, patch: Partial<Income>) => void;
  removeIncome: (id: string) => void;
  addExpense: (e: Omit<Expense, "id" | "createdAt">) => void;
  updateExpense: (id: string, patch: Partial<Expense>) => void;
  removeExpense: (id: string) => void;
  addSale: (s: Omit<Sale, "id" | "createdAt">) => void;
  updateSale: (id: string, patch: Partial<Sale>) => void;
  removeSale: (id: string) => void;
  clearAll: () => void;
}

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

export const useFinance = create<FinanceState>()(
  persist(
    (set) => ({
      incomes: [],
      expenses: [],
      sales: [],
      addIncome: (i) =>
        set((s) => ({
          incomes: [{ ...i, id: newId(), createdAt: new Date().toISOString() }, ...s.incomes],
        })),
      updateIncome: (id, patch) =>
        set((s) => ({
          incomes: s.incomes.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      removeIncome: (id) =>
        set((s) => ({ incomes: s.incomes.filter((x) => x.id !== id) })),
      addExpense: (e) =>
        set((s) => ({
          expenses: [{ ...e, id: newId(), createdAt: new Date().toISOString() }, ...s.expenses],
        })),
      updateExpense: (id, patch) =>
        set((s) => ({
          expenses: s.expenses.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      removeExpense: (id) =>
        set((s) => ({ expenses: s.expenses.filter((x) => x.id !== id) })),
      addSale: (sale) =>
        set((s) => ({
          sales: [{ ...sale, id: newId(), createdAt: new Date().toISOString() }, ...s.sales],
        })),
      updateSale: (id, patch) =>
        set((s) => ({
          sales: s.sales.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      removeSale: (id) =>
        set((s) => ({ sales: s.sales.filter((x) => x.id !== id) })),
      clearAll: () => set({ incomes: [], expenses: [], sales: [] }),
    }),
    {
      name: "finova-finance-store",
      version: 1,
    }
  )
);
