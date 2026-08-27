import { createFileRoute, Link } from "@tanstack/react-router";
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
  const { session, loading } = useAuth();
  const { t } = useIdioma();
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Lembra o e-mail para facilitar o próximo acesso no celular.
  useEffect(() => {
    const salvo = window.localStorage.getItem("wise-money-email");
    if (salvo) setEmail(salvo);
  }, []);

  useEffect(() => {
    if (!loading && session) window.location.replace("/conversa");
  }, [loading, session]);

  function abrirConversa() {
    window.location.replace("/conversa");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    window.localStorage.setItem("wise-money-email", email);
    try {
      if (modo === "criar") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: {
            data: { nome },
            emailRedirectTo: `${window.location.origin}/entrar`,
          },
        });
        if (error) throw error;
        if (data.session) {
          toast.success(t("Conta criada! Bem-vinda.", "Account created! Welcome."));
          abrirConversa();
          return;
        }

        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: senha,
        });
        if (signInError || !signInData.session) {
          throw new Error(
            t(
              "A conta foi criada, mas o acesso não foi iniciado. Tente entrar com o Google usando o mesmo e-mail.",
              "The account was created, but sign-in did not start. Try Google with the same email.",
            ),
          );
        }
        toast.success(t("Conta criada! Bem-vinda.", "Account created! Welcome."));
        abrirConversa();
        return;
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
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
        if (!data.session)
          throw new Error(t("A sessão não foi iniciada.", "Session did not start."));
        abrirConversa();
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
      redirect_uri: `${window.location.origin}/entrar`,
    });
    if (result.error) {
      toast.error(
        t("Não consegui entrar com o Google agora.", "I couldn't sign in with Google right now."),
      );
      return;
    }
    if (result.redirected) return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      toast.error(
        t(
          "O Google não concluiu o acesso. Tente novamente.",
          "Google did not complete sign-in. Try again.",
        ),
      );
      return;
    }
    abrirConversa();
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

          {modo === "entrar" && (
            <>
              <button
                onClick={entrarComGoogle}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 text-lg font-semibold text-primary-foreground transition-colors hover:bg-primary-deep"
              >
                {t("Entrar com o Google (1 toque)", "Sign in with Google (1 tap)")}
              </button>
              <div className="my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                {t("ou use e-mail e senha", "or use email and password")}
                <span className="h-px flex-1 bg-border" />
              </div>
            </>
          )}

          <form onSubmit={onSubmit} className={modo === "criar" ? "mt-6 space-y-4" : "space-y-4"}>
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

          {modo === "criar" && (
            <button
              onClick={entrarComGoogle}
              className="mt-3 w-full rounded-full border border-input bg-card px-6 py-3.5 text-base font-semibold transition-colors hover:bg-secondary"
            >
              {t("Continuar com o Google", "Continue with Google")}
            </button>
          )}

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
