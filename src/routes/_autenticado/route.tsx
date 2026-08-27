import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIdioma } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { TutorialPrimeiroAcesso, useTutorial } from "@/components/TutorialPrimeiroAcesso";
import { AutoAtualizacao } from "@/components/AutoAtualizacao";

export const Route = createFileRoute("/_autenticado")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/entrar" });
    return { user: data.user };
  },
  component: AppLayout,
});

function AppLayout() {
  const { session, user, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useIdioma();
  const tutorial = useTutorial();

  const NAV = [
    { to: "/conversa", label: t("Conversa", "Chat") },
    { to: "/painel", label: t("Painel", "Dashboard") },
    { to: "/resumo", label: t("Resumo", "Summary") },

    { to: "/metas", label: t("Metas", "Goals") },
    { to: "/mercado", label: t("Mercado", "Market") },
    { to: "/insights", label: t("Insights", "Insights") },
  ] as const;

  if (loading || !session) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-muted-foreground">
        {t("Um instante…", "Just a moment…")}
      </div>
    );
  }

  const inicial = (user?.user_metadata?.["nome"] ?? user?.email ?? "?")
    .toString()
    .charAt(0)
    .toUpperCase();

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="floaty absolute -top-24 right-[-6rem] size-[26rem] bg-primary/10"
          style={{ borderRadius: "42% 58% 63% 37%/45% 42% 58% 55%" }}
        />
        <div
          className="floaty absolute bottom-[-8rem] left-[-6rem] size-[24rem] bg-accent/15"
          style={{ borderRadius: "55% 45% 40% 60%/60% 40% 55% 40%", animationDelay: "-3s" }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link to="/conversa" className="flex items-center gap-3">
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

          <nav className="order-3 flex w-full items-center gap-6 overflow-x-auto text-sm font-medium text-muted-foreground md:order-2 md:w-auto md:gap-8">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="whitespace-nowrap py-1 transition-colors hover:text-primary"
                activeProps={{ className: "text-primary border-b-2 border-primary" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="order-2 flex items-center gap-3 md:order-3">
            <LanguageSwitcher />
            <button
              onClick={tutorial.abrir}
              className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-primary-deep transition-colors hover:bg-primary/15"
            >
              {t("Como usar", "How to use")}
            </button>
            <button
              onClick={async () => {
                window.localStorage.removeItem("wise-money-senha");
                window.localStorage.setItem("wise-money-lembrar", "0");
                await supabase.auth.signOut();
                navigate({ to: "/" });
              }}

              className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/15"
            >
              {t("Sair", "Sign out")}
            </button>
            <div className="grid size-10 place-items-center rounded-full bg-secondary font-display text-primary-deep">
              {inicial}
            </div>
          </div>
        </header>

        <div className="mt-10">
          <Outlet />
        </div>
      </div>

      <AutoAtualizacao />
      <TutorialPrimeiroAcesso aberto={tutorial.aberto} aoFechar={tutorial.fechar} />
    </div>
  );
}
