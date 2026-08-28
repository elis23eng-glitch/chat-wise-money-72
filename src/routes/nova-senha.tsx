import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useIdioma } from "@/lib/i18n";

export const Route = createFileRoute("/nova-senha")({
  head: () => ({
    meta: [
      { title: "Criar uma nova senha — Wise Money" },
      {
        name: "description",
        content: "Defina uma nova senha para voltar a acessar sua conta do Wise Money.",
      },
      { property: "og:title", content: "Criar uma nova senha — Wise Money" },
      {
        property: "og:description",
        content: "Defina uma nova senha e volte a conversar com o seu assistente financeiro.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Criar uma nova senha — Wise Money" },
      {
        name: "twitter:description",
        content: "Defina uma nova senha e volte a conversar com o seu assistente financeiro.",
      },
    ],
  }),
  component: NovaSenha,
});

function NovaSenha() {
  const { t } = useIdioma();
  const [pronto, setPronto] = useState(false);
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    // O link do e-mail cria uma sessão de recuperação ao abrir esta página.
    supabase.auth.getSession().then(({ data }) => setPronto(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setPronto(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: senha });
      if (error) throw error;
      toast.success(t("Senha atualizada!", "Password updated!"));
      window.location.replace("/conversa");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : t("Não consegui trocar a senha agora.", "I couldn't change the password right now."),
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-between">
          <Link to="/entrar" className="font-display text-xl">
            Wise Money
          </Link>
          <LanguageSwitcher />
        </div>

        <div className="surface-card p-7 shadow-soft">
          <h1 className="font-display text-3xl">{t("Criar uma nova senha", "Create a new password")}</h1>

          {!pronto ? (
            <p className="mt-3 text-muted-foreground">
              {t(
                "Abra esta página pelo link que enviamos para o seu e-mail. Assim conseguimos confirmar que é você.",
                "Open this page using the link we sent to your email so we can confirm it's you.",
              )}
            </p>
          ) : (
            <form onSubmit={onSubmit} className="mt-5 space-y-4">
              <label className="block">
                <span className="text-sm font-semibold">{t("Nova senha", "New password")}</span>
                <input
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
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
                {enviando ? t("Um instante…", "One moment…") : t("Salvar nova senha", "Save new password")}
              </button>
            </form>
          )}

          <Link to="/entrar" className="mt-5 block text-center text-sm font-semibold text-primary">
            {t("Voltar para o login", "Back to sign in")}
          </Link>
        </div>
      </div>
    </main>
  );
}
