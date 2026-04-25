import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useFinance } from "@/store/finance-store";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let lastUserId: string | null = null;

    const syncFinance = (uid: string | null) => {
      if (uid && uid !== lastUserId) {
        lastUserId = uid;
        // Carrega dados do Supabase para esse usuário
        useFinance.getState().loadAll(uid);
      } else if (!uid && lastUserId) {
        lastUserId = null;
        useFinance.getState().reset();
      }
    };

    // 1) Listener PRIMEIRO (evita race condition)
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      // Defer chamada async pra não bloquear listener
      setTimeout(() => syncFinance(newSession?.user?.id ?? null), 0);
    });

    // 2) Depois consulta sessão atual
    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      setSession(existing);
      setUser(existing?.user ?? null);
      setLoading(false);
      setTimeout(() => syncFinance(existing?.user?.id ?? null), 0);
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    useFinance.getState().reset();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
