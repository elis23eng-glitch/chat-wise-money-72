import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { HeartPulse, ThumbsDown, ThumbsUp } from "lucide-react";

import { getSaudeFinanceira } from "@/lib/saude.functions";
import { brl, notaConversao, preencherTokens } from "@/lib/format";
import { useIdioma } from "@/lib/i18n";
import { LembretesInteligentes } from "@/components/LembretesInteligentes";

export const Route = createFileRoute("/_autenticado/saude")({
  head: () => ({
    meta: [
      { title: "Saúde financeira — Wise Money" },
      {
        name: "description",
        content:
          "Uma pontuação simples da sua saúde financeira, com o que está ajudando e o que está atrapalhando.",
      },
      { property: "og:title", content: "Mapa de saúde financeira — Wise Money" },
      {
        property: "og:description",
        content: "Pontuação geral e explicações fáceis sobre suas finanças do mês.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Mapa de saúde financeira — Wise Money" },
      {
        name: "twitter:description",
        content: "Pontuação geral e explicações fáceis sobre suas finanças do mês.",
      },
    ],
  }),
  component: Saude,
});

function Saude() {
  const { t, idioma } = useIdioma();
  const buscar = useServerFn(getSaudeFinanceira);
  const { data, isLoading } = useQuery({ queryKey: ["saude"], queryFn: () => buscar() });

  if (isLoading || !data) {
    return <p className="text-muted-foreground">{t("Calculando…", "Calculating…")}</p>;
  }

  const cor =
    data.nivel === "otimo" || data.nivel === "bom"
      ? "text-primary"
      : data.nivel === "atencao"
        ? "text-amber-600"
        : "text-destructive";

  const rotuloNivel =
    data.nivel === "otimo"
      ? t("Ótima", "Great")
      : data.nivel === "bom"
        ? t("Boa", "Good")
        : data.nivel === "atencao"
          ? t("Atenção", "Watch out")
          : t("Precisa de cuidado", "Needs care");

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <div className="flex items-center gap-2">
          <HeartPulse className="size-5 text-primary" />
          <h1 className="font-display text-2xl">
            {t("Mapa de saúde financeira", "Financial health map")}
          </h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(
            "Uma nota de 0 a 100 com base no seu mês. Quanto maior, mais tranquila está a sua vida financeira.",
            "A 0 to 100 score based on your month. The higher it is, the calmer your finances are.",
          )}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-6">
          <div>
            <p className={`font-display text-6xl leading-none ${cor}`}>{data.pontuacao}</p>
            <p className={`mt-1 text-sm font-semibold ${cor}`}>{rotuloNivel}</p>
          </div>
          <div className="grid flex-1 gap-2 text-sm sm:grid-cols-3">
            <div className="rounded-2xl bg-secondary/60 p-3">
              <p className="text-muted-foreground">{t("Entradas do mês", "Income this month")}</p>
              <p className="text-base font-semibold">{brl(data.entradaMes, idioma)}</p>
            </div>
            <div className="rounded-2xl bg-secondary/60 p-3">
              <p className="text-muted-foreground">{t("Gastos do mês", "Expenses this month")}</p>
              <p className="text-base font-semibold">{brl(data.gastoMes, idioma)}</p>
            </div>
            <div className="rounded-2xl bg-secondary/60 p-3">
              <p className="text-muted-foreground">{t("Saldo", "Balance")}</p>
              <p
                className={`text-base font-semibold ${data.saldo >= 0 ? "text-primary" : "text-destructive"}`}
              >
                {brl(data.saldo, idioma)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 h-3 overflow-hidden rounded-full bg-secondary">
          <div
            className={`h-full rounded-full ${data.pontuacao >= 55 ? "bg-primary" : "bg-destructive"}`}
            style={{ width: `${Math.max(3, Math.min(100, data.pontuacao))}%` }}
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface-card p-5">
          <div className="flex items-center gap-2">
            <ThumbsUp className="size-5 text-primary" />
            <p className="font-display text-lg">{t("O que está ajudando", "What is helping")}</p>
          </div>
          {data.ajudando.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {t(
                "Ainda não encontrei pontos fortes neste mês — registre mais alguns dias e volte aqui.",
                "No strong points found this month yet — record a few more days and come back.",
              )}
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {data.ajudando.map((f) => (
                <li key={f.chave} className="rounded-2xl bg-primary/10 p-4">
                  <p className="text-base font-semibold">
                    {idioma === "en" ? f.rotulo_en : f.rotulo_pt}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {preencherTokens(idioma === "en" ? f.detalhe_en : f.detalhe_pt, idioma)}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-primary">
                    +{f.pontos} / {f.maximo} {t("pontos", "points")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="surface-card p-5">
          <div className="flex items-center gap-2">
            <ThumbsDown className="size-5 text-destructive" />
            <p className="font-display text-lg">
              {t("O que está atrapalhando", "What is holding you back")}
            </p>
          </div>
          {data.atrapalhando.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {t("Está tudo em ordem por aqui!", "Everything is in order here!")}
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {data.atrapalhando.map((f) => (
                <li key={f.chave} className="rounded-2xl bg-destructive/10 p-4">
                  <p className="text-base font-semibold">
                    {idioma === "en" ? f.rotulo_en : f.rotulo_pt}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {preencherTokens(idioma === "en" ? f.detalhe_en : f.detalhe_pt, idioma)}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-destructive">
                    {f.pontos} / {f.maximo} {t("pontos", "points")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {notaConversao(idioma) ? (
        <p className="text-xs text-muted-foreground">{notaConversao(idioma)}</p>
      ) : null}

      <LembretesInteligentes />
    </div>
  );
}
