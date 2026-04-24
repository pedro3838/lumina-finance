import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase as typedSupabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

// Tipos das novas tabelas ainda não regenerados — usamos cliente untyped
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = typedSupabase as any;

// ============ Types ============
export interface BankAccount {
  id: string;
  user_id: string;
  name: string;
  balance: number;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Partner {
  id: string;
  user_id: string;
  name: string;
  percentage: number;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface ProfitDistribution {
  id: string;
  user_id: string;
  partner_id: string;
  amount: number;
  distribution_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ============ BANK ACCOUNTS ============
export function useBankAccounts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["bank_accounts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_accounts" as never)
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as BankAccount[];
    },
  });
}

export function useUpsertBankAccount() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Partial<BankAccount> & { name: string; balance: number; color: string }) => {
      if (!user) throw new Error("Não autenticado");
      const payload = { ...input, user_id: user.id };
      if (input.id) {
        const { data, error } = await supabase
          .from("bank_accounts" as never)
          .update(payload)
          .eq("id", input.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from("bank_accounts" as never)
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bank_accounts"] }),
  });
}

export function useDeleteBankAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bank_accounts" as never).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bank_accounts"] }),
  });
}

// ============ PARTNERS ============
export function usePartners() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["partners", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partners" as never)
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Partner[];
    },
  });
}

export function useUpsertPartner() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Partial<Partner> & { name: string; percentage: number; color: string }) => {
      if (!user) throw new Error("Não autenticado");
      const payload = { ...input, user_id: user.id };
      if (input.id) {
        const { data, error } = await supabase
          .from("partners" as never)
          .update(payload)
          .eq("id", input.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from("partners" as never)
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["partners"] }),
  });
}

export function useDeletePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("partners" as never).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partners"] });
      qc.invalidateQueries({ queryKey: ["profit_distributions"] });
    },
  });
}

// ============ PROFIT DISTRIBUTIONS ============
export function useProfitDistributions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profit_distributions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profit_distributions" as never)
        .select("*")
        .order("distribution_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ProfitDistribution[];
    },
  });
}

export function useCreateDistribution() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { partner_id: string; amount: number; distribution_date: string; notes?: string }) => {
      if (!user) throw new Error("Não autenticado");
      const { data, error } = await supabase
        .from("profit_distributions" as never)
        .insert({ ...input, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profit_distributions"] }),
  });
}

export function useDeleteDistribution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("profit_distributions" as never).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profit_distributions"] }),
  });
}
