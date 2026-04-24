import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Loader2, TrendingUp, Mail, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const emailSchema = z.string().trim().email("Email inválido").max(255);
const passwordSchema = z.string().min(6, "Mínimo de 6 caracteres").max(72);

export default function Auth() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"login" | "signup">("login");

  // login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPwd, setLoginPwd] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);

  // signup state
  const [signEmail, setSignEmail] = useState("");
  const [signPwd, setSignPwd] = useState("");
  const [signBusy, setSignBusy] = useState(false);

  // forgot
  const [forgotBusy, setForgotBusy] = useState(false);

  useEffect(() => {
    document.title = "Entrar — Finova";
  }, []);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(loginEmail);
      passwordSchema.parse(loginPwd);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }

    setLoginBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPwd,
    });
    setLoginBusy(false);

    if (error) {
      const msg =
        error.message === "Invalid login credentials"
          ? "Email ou senha incorretos"
          : error.message;
      toast.error(msg);
      return;
    }

    toast.success("Bem-vindo de volta!");
    navigate("/", { replace: true });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(signEmail);
      passwordSchema.parse(signPwd);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }

    setSignBusy(true);
    const { error } = await supabase.auth.signUp({
      email: signEmail,
      password: signPwd,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    setSignBusy(false);

    if (error) {
      const msg = error.message.includes("already")
        ? "Esse email já está cadastrado"
        : error.message;
      toast.error(msg);
      return;
    }

    toast.success("Conta criada com sucesso!");
    navigate("/", { replace: true });
  };

  const handleForgot = async () => {
    try {
      emailSchema.parse(loginEmail);
    } catch {
      toast.error("Informe um email válido para recuperar a senha");
      return;
    }
    setForgotBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(loginEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setForgotBusy(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Enviamos um link de recuperação para seu email");
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Lado visual */}
      <div className="hidden lg:flex relative overflow-hidden bg-gradient-primary">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,white,transparent_55%)]" />
        <div className="relative z-10 m-auto px-12 max-w-md text-primary-foreground">
          <div className="flex items-center gap-3 mb-10">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/15 backdrop-blur">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-semibold tracking-tight">Finova</div>
              <div className="text-sm opacity-80">Inteligência financeira</div>
            </div>
          </div>
          <h2 className="text-3xl font-semibold leading-tight mb-4">
            Controle total das suas finanças, em qualquer dispositivo.
          </h2>
          <p className="opacity-90">
            Dashboard, fluxo de caixa, contas, vendas e insights automáticos —
            tudo sincronizado e seguro.
          </p>
        </div>
      </div>

      {/* Lado formulário */}
      <div className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-primary shadow-glow">
              <TrendingUp className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <div className="font-semibold tracking-tight">Finova</div>
              <div className="text-[11px] text-muted-foreground">Controle financeiro</div>
            </div>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">Acesse sua conta</h1>
          <p className="text-sm text-muted-foreground mt-1 mb-6">
            Entre ou crie uma conta para sincronizar seus dados.
          </p>

          <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "signup")}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      placeholder="voce@empresa.com"
                      className="pl-9"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-pwd">Senha</Label>
                    <button
                      type="button"
                      onClick={handleForgot}
                      disabled={forgotBusy}
                      className="text-xs text-primary hover:underline disabled:opacity-50"
                    >
                      {forgotBusy ? "Enviando..." : "Esqueci a senha"}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-pwd"
                      type="password"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="pl-9"
                      value={loginPwd}
                      onChange={(e) => setLoginPwd(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loginBusy}>
                  {loginBusy && <Loader2 className="h-4 w-4 animate-spin" />}
                  Entrar
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sign-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="sign-email"
                      type="email"
                      autoComplete="email"
                      placeholder="voce@empresa.com"
                      className="pl-9"
                      value={signEmail}
                      onChange={(e) => setSignEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sign-pwd">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="sign-pwd"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Mínimo 6 caracteres"
                      className="pl-9"
                      value={signPwd}
                      onChange={(e) => setSignPwd(e.target.value)}
                      required
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Use pelo menos 6 caracteres.
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={signBusy}>
                  {signBusy && <Loader2 className="h-4 w-4 animate-spin" />}
                  Criar conta
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="text-[11px] text-muted-foreground mt-6 text-center">
            Ao continuar, você concorda em manter seus dados financeiros
            sincronizados de forma segura.
          </p>
        </div>
      </div>
    </div>
  );
}
