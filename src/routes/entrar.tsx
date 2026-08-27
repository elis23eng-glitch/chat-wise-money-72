import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useIdioma } from "@/lib/i18n";

export const Route = createFileRoute("/entrar")({
  head: () => ({
    meta: [
      { title: "Entrar no Wise Money — assistente financeiro" },
      {
        name: "description",
        content:
          "Acesse sua conta para conversar com o agente financeiro e acompanhar seus gastos.",
      },
      { property: "og:title", content: "Entrar no Wise Money" },
      {
        property: "og:description",
        content: "Acesse sua conta e continue organizando seu dinheiro por conversa.",
      },
    ],
  }),
  component: Entrar,
});

function Entrar() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const { t } = useIdioma();
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/conversa" });
  }, [loading, session, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    try {
      if (modo === "criar") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: {
            data: { nome },
            emailRedirectTo: `${window.location.origin}/conversa`,
          },
        });
        if (error) throw error;
        if (!data.session) {
          // Sem sessão imediata: tenta entrar direto com as mesmas credenciais.
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password: senha,
          });
          if (signInError) {
            toast.success(
              t(
                "Conta criada! Confirme pelo e-mail e depois entre.",
                "Account created! Confirm via email, then sign in.",
              ),
            );
            setModo("entrar");
            return;
          }
        }
        toast.success(t("Conta criada! Bem-vinda.", "Account created! Welcome."));
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) {
          if (/invalid login credentials/i.test(error.message)) {
            throw new Error(
              t(
                "E-mail ou senha não conferem. Se acabou de criar a conta, confirme pelo e-mail.",
                "Email or password doesn't match. If you just signed up, confirm via email.",
              ),
            );
          }
          throw error;
        }
      }

    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : t("Não consegui concluir. Tente de novo.", "I couldn't finish. Please try again."),
      );
    } finally {
      setEnviando(false);
    }
  }

  async function entrarComGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(
        t("Não consegui entrar com o Google agora.", "I couldn't sign in with Google right now."),
      );
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/conversa" });
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-12">
      <div className="pointer-events-none absolute inset-0">
        <div
          className="floaty absolute -top-24 right-[-6rem] size-[26rem] bg-primary/10"
          style={{ borderRadius: "42% 58% 63% 37%/45% 42% 58% 55%" }}
        />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="size-11 overflow-hidden rounded-2xl shadow-sm">
              <img src="/icons/icon-192.png" alt="Wise Money" className="size-full object-cover" />
            </div>
            <div>
              <p className="font-display text-xl leading-none">Wise Money</p>
              <p className="text-[11px] uppercase tracking-[0.22em] text-primary/70">
                {t("assessor financeiro", "financial advisor")}
              </p>
            </div>
          </Link>
          <LanguageSwitcher />
        </div>

        <div className="surface-card p-7 shadow-soft">
          <h1 className="font-display text-3xl">
            {modo === "entrar"
              ? t("Que bom te ver de novo", "Great to see you again")
              : t("Vamos começar juntos", "Let's get started together")}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {modo === "entrar"
              ? t("Entre para continuar sua conversa.", "Sign in to continue your conversation.")
              : t(
                  "Crie sua conta com e-mail e senha. É rapidinho.",
                  "Create your account with email and password. It's quick.",
                )}
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {modo === "criar" && (
              <label className="block">
                <span className="text-sm font-semibold">
                  {t("Como posso te chamar?", "What should I call you?")}
                </span>
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="mt-1.5 w-full rounded-2xl border border-input bg-card px-4 py-3 text-base outline-none focus:border-primary"
                  placeholder={t("Maria", "Mary")}
                />
              </label>
            )}
            <label className="block">
              <span className="text-sm font-semibold">{t("E-mail", "Email")}</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-input bg-card px-4 py-3 text-base outline-none focus:border-primary"
                placeholder={t("voce@email.com", "you@email.com")}
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">{t("Senha", "Password")}</span>
              <input
                type="password"
                required
                minLength={6}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-input bg-card px-4 py-3 text-base outline-none focus:border-primary"
                placeholder={t("pelo menos 6 letras ou números", "at least 6 letters or numbers")}
              />
            </label>

            <button
              type="submit"
              disabled={enviando}
              className="w-full rounded-full bg-primary px-6 py-4 text-lg font-semibold text-primary-foreground transition-colors hover:bg-primary-deep disabled:opacity-60"
            >
              {enviando
                ? t("Um instante…", "One moment…")
                : modo === "entrar"
                  ? t("Entrar", "Sign in")
                  : t("Criar minha conta", "Create my account")}
            </button>
          </form>

          <button
            onClick={entrarComGoogle}
            className="mt-3 w-full rounded-full border border-input bg-card px-6 py-3.5 text-base font-semibold transition-colors hover:bg-secondary"
          >
            {t("Continuar com o Google", "Continue with Google")}
          </button>

          <button
            onClick={() => setModo(modo === "entrar" ? "criar" : "entrar")}
            className="mt-5 w-full text-sm font-semibold text-primary"
          >
            {modo === "entrar"
              ? t("Ainda não tenho conta", "I don't have an account yet")
              : t("Já tenho conta, quero entrar", "I already have an account, sign me in")}
          </button>
        </div>
      </div>
    </main>
  );
}
