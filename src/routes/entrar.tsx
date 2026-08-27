import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/entrar")({
  head: () => ({
    meta: [
      { title: "Entrar no mergulho — assistente financeiro" },
      {
        name: "description",
        content: "Acesse sua conta para conversar com o agente financeiro e acompanhar seus gastos.",
      },
      { property: "og:title", content: "Entrar no mergulho" },
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
        const { error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: {
            data: { nome },
            emailRedirectTo: `${window.location.origin}/conversa`,
          },
        });
        if (error) throw error;
        toast.success("Conta criada! Se pedirmos confirmação, olhe seu e-mail.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não consegui concluir. Tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  async function entrarComGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Não consegui entrar com o Google agora.");
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
        <Link to="/" className="mb-8 flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <span className="font-display text-xl">m</span>
          </div>
          <div>
            <p className="font-display text-xl leading-none">mergulho</p>
            <p className="text-[11px] uppercase tracking-[0.22em] text-primary/70">
              assessor financeiro
            </p>
          </div>
        </Link>

        <div className="surface-card p-7 shadow-soft">
          <h1 className="font-display text-3xl">
            {modo === "entrar" ? "Que bom te ver de novo" : "Vamos começar juntos"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {modo === "entrar"
              ? "Entre para continuar sua conversa."
              : "Crie sua conta com e-mail e senha. É rapidinho."}
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {modo === "criar" && (
              <label className="block">
                <span className="text-sm font-semibold">Como posso te chamar?</span>
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="mt-1.5 w-full rounded-2xl border border-input bg-card px-4 py-3 text-base outline-none focus:border-primary"
                  placeholder="Maria"
                />
              </label>
            )}
            <label className="block">
              <span className="text-sm font-semibold">E-mail</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-input bg-card px-4 py-3 text-base outline-none focus:border-primary"
                placeholder="voce@email.com"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Senha</span>
              <input
                type="password"
                required
                minLength={6}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-input bg-card px-4 py-3 text-base outline-none focus:border-primary"
                placeholder="pelo menos 6 letras ou números"
              />
            </label>

            <button
              type="submit"
              disabled={enviando}
              className="w-full rounded-full bg-primary px-6 py-4 text-lg font-semibold text-primary-foreground transition-colors hover:bg-primary-deep disabled:opacity-60"
            >
              {enviando ? "Um instante…" : modo === "entrar" ? "Entrar" : "Criar minha conta"}
            </button>
          </form>

          <button
            onClick={entrarComGoogle}
            className="mt-3 w-full rounded-full border border-input bg-card px-6 py-3.5 text-base font-semibold transition-colors hover:bg-secondary"
          >
            Continuar com o Google
          </button>

          <button
            onClick={() => setModo(modo === "entrar" ? "criar" : "entrar")}
            className="mt-5 w-full text-sm font-semibold text-primary"
          >
            {modo === "entrar" ? "Ainda não tenho conta" : "Já tenho conta, quero entrar"}
          </button>
        </div>
      </div>
    </main>
  );
}
