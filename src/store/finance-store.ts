import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import type {
  Expense,
  ExpenseStatus,
  ExpenseType,
  Income,
  IncomeStatus,
  PaymentMethod,
  Person,
  Sale,
  SaleStatus,
} from "@/lib/finance-types";

interface FinanceState {
  incomes: Income[];
  expenses: Expense[];
  sales: Sale[];
  loaded: boolean;
  userId: string | null;

  // lifecycle
  loadAll: (userId: string) => Promise<void>;
  reset: () => void;

  // CRUD (assinaturas idênticas às anteriores - retornos são síncronos void)
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

// ===== Mappers DB <-> App =====
type DbIncome = {
  id: string;
  user_id: string;
  date: string;
  description: string;
  category: string;
  amount: number | string;
  status: string;
  person: string;
  created_at: string;
};

function mapIncomeFromDb(r: DbIncome): Income {
  return {
    id: r.id,
    date: r.date,
    description: r.description,
    category: r.category,
    amount: Number(r.amount),
    status: r.status as IncomeStatus,
    person: r.person as Person,
    createdAt: r.created_at,
  };
}

type DbExpense = {
  id: string;
  user_id: string;
  date: string;
  type: string;
  category: string;
  description: string;
  payment_method: string;
  planned_amount: number | string;
  actual_amount: number | string;
  status: string;
  person: string;
  created_at: string;
};

function mapExpenseFromDb(r: DbExpense): Expense {
  return {
    id: r.id,
    date: r.date,
    type: r.type as ExpenseType,
    category: r.category,
    description: r.description,
    paymentMethod: r.payment_method as PaymentMethod,
    plannedAmount: Number(r.planned_amount),
    actualAmount: Number(r.actual_amount),
    status: r.status as ExpenseStatus,
    person: r.person as Person,
    createdAt: r.created_at,
  };
}

type DbSale = {
  id: string;
  user_id: string;
  date: string;
  client: string;
  city: string;
  product: string;
  cost: number | string;
  quantity: number | string;
  margin_percent: number | string;
  commission_percent: number | string;
  status: string;
  person: string;
  created_at: string;
};

function mapSaleFromDb(r: DbSale): Sale {
  return {
    id: r.id,
    date: r.date,
    client: r.client,
    city: r.city,
    product: r.product,
    cost: Number(r.cost),
    quantity: Number(r.quantity),
    marginPercent: Number(r.margin_percent),
    commissionPercent: Number(r.commission_percent),
    status: r.status as SaleStatus,
    person: r.person as Person,
    createdAt: r.created_at,
  };
}

// ===== Migração one-shot do LocalStorage antigo =====
const LEGACY_KEY = "finova-finance-store";
const MIGRATED_FLAG = "finova-migrated-to-supabase-v1";

async function migrateLegacyIfNeeded(userId: string) {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(MIGRATED_FLAG)) return;
  const raw = localStorage.getItem(LEGACY_KEY);
  if (!raw) {
    localStorage.setItem(MIGRATED_FLAG, "1");
    return;
  }
  try {
    const parsed = JSON.parse(raw);
    const state = parsed?.state ?? parsed;
    const incomes: Income[] = state?.incomes ?? [];
    const expenses: Expense[] = state?.expenses ?? [];
    const sales: Sale[] = state?.sales ?? [];

    if (incomes.length) {
      const rows = incomes.map((i) => ({
        user_id: userId,
        date: i.date,
        description: i.description,
        category: i.category,
        amount: i.amount,
        status: i.status,
        person: i.person,
      }));
      await (supabase.from("incomes" as any).insert(rows as any) as any);
    }
    if (expenses.length) {
      const rows = expenses.map((e) => ({
        user_id: userId,
        date: e.date,
        type: e.type,
        category: e.category,
        description: e.description,
        payment_method: e.paymentMethod,
        planned_amount: e.plannedAmount,
        actual_amount: e.actualAmount,
        status: e.status,
        person: e.person,
      }));
      await (supabase.from("expenses" as any).insert(rows as any) as any);
    }
    if (sales.length) {
      const rows = sales.map((s) => ({
        user_id: userId,
        date: s.date,
        client: s.client,
        city: s.city,
        product: s.product,
        cost: s.cost,
        quantity: s.quantity,
        margin_percent: s.marginPercent,
        commission_percent: s.commissionPercent,
        status: s.status,
        person: s.person,
      }));
      await (supabase.from("sales" as any).insert(rows as any) as any);
    }
    localStorage.setItem(MIGRATED_FLAG, "1");
  } catch (err) {
    console.error("Falha migrando dados do LocalStorage:", err);
  }
}

export const useFinance = create<FinanceState>()((set, get) => ({
  incomes: [],
  expenses: [],
  sales: [],
  loaded: false,
  userId: null,

  reset: () => set({ incomes: [], expenses: [], sales: [], loaded: false, userId: null }),

  loadAll: async (userId: string) => {
    set({ userId });
    await migrateLegacyIfNeeded(userId);

    const [incRes, expRes, salesRes] = await Promise.all([
      (supabase.from("incomes" as any).select("*").order("date", { ascending: false }) as any),
      (supabase.from("expenses" as any).select("*").order("date", { ascending: false }) as any),
      (supabase.from("sales" as any).select("*").order("date", { ascending: false }) as any),
    ]);

    if (incRes.error) console.error(incRes.error);
    if (expRes.error) console.error(expRes.error);
    if (salesRes.error) console.error(salesRes.error);

    set({
      incomes: (incRes.data ?? []).map((r: DbIncome) => mapIncomeFromDb(r)),
      expenses: (expRes.data ?? []).map((r: DbExpense) => mapExpenseFromDb(r)),
      sales: (salesRes.data ?? []).map((r: DbSale) => mapSaleFromDb(r)),
      loaded: true,
    });
  },

  // ===== Incomes =====
  addIncome: (i) => {
    const userId = get().userId;
    if (!userId) return;
    (async () => {
      const { data, error } = await (supabase
        .from("incomes" as any)
        .insert({
          user_id: userId,
          date: i.date,
          description: i.description,
          category: i.category,
          amount: i.amount,
          status: i.status,
          person: i.person,
        } as any)
        .select()
        .single() as any);
      if (error) {
        console.error(error);
        return;
      }
      set((s) => ({ incomes: [mapIncomeFromDb(data as DbIncome), ...s.incomes] }));
    })();
  },
  updateIncome: (id, patch) => {
    const dbPatch: Record<string, unknown> = {};
    if (patch.date !== undefined) dbPatch.date = patch.date;
    if (patch.description !== undefined) dbPatch.description = patch.description;
    if (patch.category !== undefined) dbPatch.category = patch.category;
    if (patch.amount !== undefined) dbPatch.amount = patch.amount;
    if (patch.status !== undefined) dbPatch.status = patch.status;
    if (patch.person !== undefined) dbPatch.person = patch.person;
    set((s) => ({ incomes: s.incomes.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
    (async () => {
      const { error } = await (supabase.from("incomes" as any).update(dbPatch as any).eq("id", id) as any);
      if (error) console.error(error);
    })();
  },
  removeIncome: (id) => {
    set((s) => ({ incomes: s.incomes.filter((x) => x.id !== id) }));
    (async () => {
      const { error } = await (supabase.from("incomes" as any).delete().eq("id", id) as any);
      if (error) console.error(error);
    })();
  },

  // ===== Expenses =====
  addExpense: (e) => {
    const userId = get().userId;
    if (!userId) return;
    (async () => {
      const { data, error } = await (supabase
        .from("expenses" as any)
        .insert({
          user_id: userId,
          date: e.date,
          type: e.type,
          category: e.category,
          description: e.description,
          payment_method: e.paymentMethod,
          planned_amount: e.plannedAmount,
          actual_amount: e.actualAmount,
          status: e.status,
          person: e.person,
        } as any)
        .select()
        .single() as any);
      if (error) {
        console.error(error);
        return;
      }
      set((s) => ({ expenses: [mapExpenseFromDb(data as DbExpense), ...s.expenses] }));
    })();
  },
  updateExpense: (id, patch) => {
    const dbPatch: Record<string, unknown> = {};
    if (patch.date !== undefined) dbPatch.date = patch.date;
    if (patch.type !== undefined) dbPatch.type = patch.type;
    if (patch.category !== undefined) dbPatch.category = patch.category;
    if (patch.description !== undefined) dbPatch.description = patch.description;
    if (patch.paymentMethod !== undefined) dbPatch.payment_method = patch.paymentMethod;
    if (patch.plannedAmount !== undefined) dbPatch.planned_amount = patch.plannedAmount;
    if (patch.actualAmount !== undefined) dbPatch.actual_amount = patch.actualAmount;
    if (patch.status !== undefined) dbPatch.status = patch.status;
    if (patch.person !== undefined) dbPatch.person = patch.person;
    set((s) => ({ expenses: s.expenses.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
    (async () => {
      const { error } = await (supabase.from("expenses" as any).update(dbPatch as any).eq("id", id) as any);
      if (error) console.error(error);
    })();
  },
  removeExpense: (id) => {
    set((s) => ({ expenses: s.expenses.filter((x) => x.id !== id) }));
    (async () => {
      const { error } = await (supabase.from("expenses" as any).delete().eq("id", id) as any);
      if (error) console.error(error);
    })();
  },

  // ===== Sales =====
  addSale: (s) => {
    const userId = get().userId;
    if (!userId) return;
    (async () => {
      const { data, error } = await (supabase
        .from("sales" as any)
        .insert({
          user_id: userId,
          date: s.date,
          client: s.client,
          city: s.city,
          product: s.product,
          cost: s.cost,
          quantity: s.quantity,
          margin_percent: s.marginPercent,
          commission_percent: s.commissionPercent,
          status: s.status,
          person: s.person,
        } as any)
        .select()
        .single() as any);
      if (error) {
        console.error(error);
        return;
      }
      set((st) => ({ sales: [mapSaleFromDb(data as DbSale), ...st.sales] }));
    })();
  },
  updateSale: (id, patch) => {
    const dbPatch: Record<string, unknown> = {};
    if (patch.date !== undefined) dbPatch.date = patch.date;
    if (patch.client !== undefined) dbPatch.client = patch.client;
    if (patch.city !== undefined) dbPatch.city = patch.city;
    if (patch.product !== undefined) dbPatch.product = patch.product;
    if (patch.cost !== undefined) dbPatch.cost = patch.cost;
    if (patch.quantity !== undefined) dbPatch.quantity = patch.quantity;
    if (patch.marginPercent !== undefined) dbPatch.margin_percent = patch.marginPercent;
    if (patch.commissionPercent !== undefined) dbPatch.commission_percent = patch.commissionPercent;
    if (patch.status !== undefined) dbPatch.status = patch.status;
    if (patch.person !== undefined) dbPatch.person = patch.person;
    set((st) => ({ sales: st.sales.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
    (async () => {
      const { error } = await (supabase.from("sales" as any).update(dbPatch as any).eq("id", id) as any);
      if (error) console.error(error);
    })();
  },
  removeSale: (id) => {
    set((st) => ({ sales: st.sales.filter((x) => x.id !== id) }));
    (async () => {
      const { error } = await (supabase.from("sales" as any).delete().eq("id", id) as any);
      if (error) console.error(error);
    })();
  },

  clearAll: () => set({ incomes: [], expenses: [], sales: [] }),
}));
