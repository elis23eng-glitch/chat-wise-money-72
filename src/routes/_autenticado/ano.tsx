import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getYearOverview } from "@/lib/year.functions";
import { brl, categoriaLabel, notaConversao } from "@/lib/format";
import { useIdioma } from "@/lib/i18n";

export const Route = createFileRoute("/_autenticado/ano")({
  head: () => ({
    meta: [
      { title: "Painel do ano — Wise Money" },
      {
        name: "description",
        content: "Veja suas entradas, gastos e saldo mês a mês ao longo do ano inteiro.",
      },
      { property: "og:title", content: "Painel do ano — Wise Money" },
      {
        property: "og:description",
        content: "Entradas, gastos e saldo detalhados mês a mês, de janeiro a dezembro.",
      }
      { name: "twitter:title", content: "Painel do ano — Wise Money" },
      { name: "twitter:description", content: "Entradas, gastos e saldo detalhados mês a mês, de janeiro a dezembro." },,
    ],
  }),
  component: PainelAno,
});

const MESES_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];
const MESES_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function PainelAno() {
  const { t, idioma } = useIdioma();
  const buscar = useServerFn(getYearOverview);
  const anoAtual = new Date().getFullYear();
  const [ano, setAno] = useState(anoAtual);

  const { data, isLoading } = useQuery({
    queryKey: ["ano", ano],
    queryFn: () => buscar({ data: { ano } }),
  });

  const nomes = idioma === "en" ? MESES_EN : MESES_PT;
  const meses = data?.meses ?? [];
  const grafico = meses.map((m) => ({
    mes: nomes[m.mes - 1]?.slice(0, 3) ?? String(m.mes),
    entradas: m.entradas,
    gastos: m.gastos,
  }));
  const categorias = Object.entries(data?.porCategoria ?? {}).sort((a, b) => b[1] - a[1]);
  const maiorCategoria = categorias[0]?.[1] ?? 1;
  const saldo = data?.saldo ?? 0;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
            {t("Ano", "Year")}
          </p>
          <h1 className="mt-2 font-display text-4xl tracking-tight">
            {t("Seu ano mês a mês", "Your year month by month")}
          </h1>
          {notaConversao(idioma) && (
            <p className="mt-2 text-sm text-muted-foreground">{notaConversao(idioma)}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAno((a) => a - 1)}
            className="rounded-full border border-input bg-card px-4 py-2 text-base font-semibold hover:bg-secondary"
          >
            ←
          </button>
          <span className="font-display text-2xl tabular-nums">{ano}</span>
          <button
            type="button"
            disabled={ano >= anoAtual}
            onClick={() => setAno((a) => Math.min(anoAtual, a + 1))}
            className="rounded-full border border-input bg-card px-4 py-2 text-base font-semibold hover:bg-secondary disabled:opacity-40"
          >
            →
          </button>
        </div>
      </header>

      {isLoading ? (
        <p className="text-muted-foreground">{t("Carregando…", "Loading…")}</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="surface-card p-5">
              <p className="text-sm text-muted-foreground">
                {t("Entradas no ano", "Income this year")}
              </p>
              <p className="mt-1 font-display text-3xl text-primary">
                {brl(data?.totalEntradas ?? 0)}
              </p>
            </div>
            <div className="surface-card p-5">
              <p className="text-sm text-muted-foreground">
                {t("Gastos no ano", "Expenses this year")}
              </p>
              <p className="mt-1 font-display text-3xl">{brl(data?.totalGastos ?? 0)}</p>
            </div>
            <div
              className={`rounded-3xl p-5 ${
                saldo >= 0
                  ? "bg-primary-deep text-primary-deep-foreground"
                  : "bg-destructive text-destructive-foreground"
              }`}
            >
              <p className="text-sm opacity-90">{t("Saldo do ano", "Year balance")}</p>
              <p className="mt-1 font-display text-3xl">{brl(saldo)}</p>
            </div>
          </div>

          <section className="surface-card p-5">
            <h2 className="font-display text-2xl">
              {t("Entradas e gastos por mês", "Income and expenses by month")}
            </h2>
            <div className="mt-4 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={grafico}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="mes" fontSize={12} />
                  <YAxis fontSize={12} width={60} />
                  <Tooltip formatter={(v: number) => brl(Number(v))} />
                  <Legend />
                  <Bar
                    dataKey="entradas"
                    name={t("Entradas", "Income")}
                    fill="hsl(var(--primary))"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="gastos"
                    name={t("Gastos", "Expenses")}
                    fill="hsl(var(--accent))"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="surface-card overflow-hidden">
            <h2 className="p-5 pb-3 font-display text-2xl">
              {t("Detalhe mês a mês", "Month-by-month detail")}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-base">
                <thead className="bg-secondary/60 text-sm uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3">{t("Mês", "Month")}</th>
                    <th className="px-5 py-3 text-right">{t("Entradas", "Income")}</th>
                    <th className="px-5 py-3 text-right">{t("Gastos", "Expenses")}</th>
                    <th className="px-5 py-3 text-right">{t("Saldo", "Balance")}</th>
                  </tr>
                </thead>
                <tbody>
                  {meses.map((m) => (
                    <tr key={m.iso} className="border-t border-border/60">
                      <td className="px-5 py-3 font-semibold">{nomes[m.mes - 1]}</td>
                      <td className="px-5 py-3 text-right tabular-nums">{brl(m.entradas)}</td>
                      <td className="px-5 py-3 text-right tabular-nums">{brl(m.gastos)}</td>
                      <td
                        className={`px-5 py-3 text-right font-semibold tabular-nums ${
                          m.lancamentos === 0
                            ? "text-muted-foreground"
                            : m.saldo >= 0
                              ? "text-primary"
                              : "text-destructive"
                        }`}
                      >
                        {m.lancamentos === 0 ? "—" : brl(m.saldo)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {categorias.length > 0 && (
            <section className="surface-card p-5">
              <h2 className="font-display text-2xl">
                {t("Gastos do ano por categoria", "Yearly expenses by category")}
              </h2>
              <ul className="mt-4 space-y-3">
                {categorias.map(([nome, valor]) => (
                  <li key={nome}>
                    <div className="flex justify-between text-base">
                      <span className="font-semibold">{categoriaLabel(nome, idioma)}</span>
                      <span className="tabular-nums">{brl(valor)}</span>
                    </div>
                    <div className="mt-1.5 h-2.5 w-full rounded-full bg-secondary">
                      <div
                        className="h-2.5 rounded-full bg-primary"
                        style={{ width: `${Math.max(4, (valor / maiorCategoria) * 100)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="text-sm text-muted-foreground">
            {t(
              "Dica: você pode registrar gastos e entradas de meses passados na tela Resumo, escolhendo a data do lançamento.",
              "Tip: you can record past-month expenses and income on the Summary page by choosing the entry date.",
            )}
          </p>
        </>
      )}
    </div>
  );
}
