import { History } from "lucide-react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { TipoAlerta } from "@/lib/alerts.functions";
import { brl, dataCurta } from "@/lib/format";

import type { Traduzir } from "./DashboardReport";

export type FiltroPeriodoAlerta = "todos" | "semana" | "mes";

export type HistoricoAlerta = {
  id: string;
  tipo: TipoAlerta;
  tom: "perigo" | "atencao" | "bom";
  periodo: "mes" | "semana";
  inicio: string;
  fim: string;
  entradas: number;
  gastos: number;
  saldo: number;
  extra: number | null;
  criadoEm: string;
};

export type EstatisticasAlertas = {
  total: number;
  maisComum: TipoAlerta;
  saldoMedio: number;
  entradasMedia: number;
  gastosMedia: number;
  pior: HistoricoAlerta;
  porMes: Array<{
    chave: string;
    rotulo: string;
    quantidade: number;
    saldoMedio: number;
  }>;
} | null;

type AlertHistorySectionProps = {
  historico: HistoricoAlerta[] | undefined;
  historicoFiltrado: HistoricoAlerta[];
  estatisticas: EstatisticasAlertas;
  filtroPeriodo: FiltroPeriodoAlerta;
  filtroInicio: string;
  filtroFim: string;
  filtrosAtivos: boolean;
  t: Traduzir;
  tituloAlerta: (tipo: TipoAlerta) => string;
  onFiltroPeriodoChange: (periodo: FiltroPeriodoAlerta) => void;
  onFiltroInicioChange: (inicio: string) => void;
  onFiltroFimChange: (fim: string) => void;
  onLimparFiltros: () => void;
};

export function AlertHistorySection({
  historico,
  historicoFiltrado,
  estatisticas,
  filtroPeriodo,
  filtroInicio,
  filtroFim,
  filtrosAtivos,
  t,
  tituloAlerta,
  onFiltroPeriodoChange,
  onFiltroInicioChange,
  onFiltroFimChange,
  onLimparFiltros,
}: AlertHistorySectionProps) {
  return (
    <div className="surface-card p-6">
      <div className="flex items-center gap-2">
        <History className="size-5 text-primary" />
        <h2 className="font-display text-2xl">{t("Histórico de alertas", "Alert history")}</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {t(
          "Cada alerta de saldo que apareceu para você, com a data, o período e os valores daquele momento.",
          "Every balance alert you saw, with the date, the period and the numbers at that moment.",
        )}
      </p>

      {historico && historico.length > 0 && (
        <div className="mt-5 flex flex-wrap items-end gap-x-4 gap-y-3">
          <div
            className="inline-flex items-center gap-1 rounded-full bg-secondary p-1"
            role="group"
            aria-label={t("Filtrar por tipo de período", "Filter by period type")}
          >
            {[
              { valor: "todos" as const, rotulo: t("Todos", "All") },
              { valor: "semana" as const, rotulo: t("Semana", "Week") },
              { valor: "mes" as const, rotulo: t("Mês", "Month") },
            ].map((opcao) => (
              <button
                key={opcao.valor}
                type="button"
                onClick={() => onFiltroPeriodoChange(opcao.valor)}
                aria-pressed={filtroPeriodo === opcao.valor}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  filtroPeriodo === opcao.valor
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                {opcao.rotulo}
              </button>
            ))}
          </div>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("De", "From")}
            </span>
            <input
              type="date"
              value={filtroInicio}
              max={filtroFim || undefined}
              onChange={(evento) => onFiltroInicioChange(evento.target.value)}
              className="mt-1 block rounded-2xl border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("Até", "To")}
            </span>
            <input
              type="date"
              value={filtroFim}
              min={filtroInicio || undefined}
              onChange={(evento) => onFiltroFimChange(evento.target.value)}
              className="mt-1 block rounded-2xl border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>

          {filtrosAtivos && (
            <button
              type="button"
              onClick={onLimparFiltros}
              className="rounded-full border border-primary/30 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
            >
              {t("Limpar filtros", "Clear filters")}
            </button>
          )}
        </div>
      )}

      {historico && historico.length > 0 && filtrosAtivos && (
        <p className="mt-3 text-sm text-muted-foreground" role="status">
          {t(
            `Mostrando ${historicoFiltrado.length} de ${historico.length} alertas`,
            `Showing ${historicoFiltrado.length} of ${historico.length} alerts`,
          )}
        </p>
      )}

      {estatisticas && (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-primary/5 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("Alertas registrados", "Alerts recorded")}
              </p>
              <p className="mt-1 font-display text-2xl">{estatisticas.total}</p>
              <p className="text-xs text-muted-foreground">
                {t("Tipo mais comum:", "Most common:")} {tituloAlerta(estatisticas.maisComum)}
              </p>
            </div>
            <div className="rounded-2xl bg-primary/5 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("Saldo médio nos alertas", "Average balance on alerts")}
              </p>
              <p
                className={`mt-1 font-display text-2xl ${
                  estatisticas.saldoMedio < 0 ? "text-destructive" : "text-primary-deep"
                }`}
              >
                {brl(estatisticas.saldoMedio)}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("Entradas", "Income")} {brl(estatisticas.entradasMedia)} ·{" "}
                {t("Gastos", "Spending")} {brl(estatisticas.gastosMedia)}
              </p>
            </div>
            <div className="rounded-2xl bg-primary/5 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("Pior saldo", "Worst balance")}
              </p>
              <p className="mt-1 font-display text-2xl text-destructive">
                {brl(estatisticas.pior.saldo)}
              </p>
              <p className="text-xs text-muted-foreground">
                {dataCurta(estatisticas.pior.inicio)} – {dataCurta(estatisticas.pior.fim)}
              </p>
            </div>
          </div>

          <h3 className="mt-8 font-display text-xl">{t("Alertas por mês", "Alerts per month")}</h3>
          <div className="mt-3 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={estatisticas.porMes}>
                <XAxis dataKey="rotulo" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip
                  cursor={{ fill: "var(--color-primary)", fillOpacity: 0.06 }}
                  formatter={(valor: number) => [
                    `${valor}`,
                    t("Alertas no mês", "Alerts in the month"),
                  ]}
                />
                <Bar
                  dataKey="quantidade"
                  fill="var(--color-accent)"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={44}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <h3 className="mt-8 font-display text-xl">
            {t("Saldo médio por mês", "Average balance per month")}
          </h3>
          <div className="mt-3 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={estatisticas.porMes}>
                <XAxis dataKey="rotulo" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickFormatter={(valor) => brl(Number(valor))} width={80} fontSize={11} />
                <Tooltip
                  cursor={{ fill: "var(--color-primary)", fillOpacity: 0.06 }}
                  formatter={(valor: number) => [
                    brl(Number(valor)),
                    t("Saldo médio", "Average balance"),
                  ]}
                />
                <Bar dataKey="saldoMedio" radius={[8, 8, 0, 0]} maxBarSize={44}>
                  {estatisticas.porMes.map((mes) => (
                    <Cell
                      key={mes.chave}
                      fill={
                        mes.saldoMedio < 0 ? "var(--color-destructive)" : "var(--color-primary)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {!historico || historico.length === 0 ? (
        <p className="mt-4 text-muted-foreground">
          {t(
            "Nenhum alerta registrado ainda. Eles aparecem aqui assim que forem disparados.",
            "No alerts recorded yet. They show up here as soon as they are triggered.",
          )}
        </p>
      ) : historicoFiltrado.length === 0 ? (
        <p className="mt-4 text-muted-foreground">
          {t(
            "Nenhum alerta encontrado com esses filtros. Tente outro período ou intervalo de datas.",
            "No alerts found with these filters. Try another period or date range.",
          )}
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-primary/10">
          {historicoFiltrado.map((alerta) => (
            <li key={alerta.id} className="flex flex-wrap items-start gap-x-4 gap-y-2 py-4">
              <span
                className={`mt-1 size-2.5 shrink-0 rounded-full ${
                  alerta.tom === "perigo"
                    ? "bg-destructive"
                    : alerta.tom === "atencao"
                      ? "bg-accent"
                      : "bg-primary"
                }`}
                aria-hidden
              />
              <div className="min-w-[12rem] flex-1">
                <p className="font-medium">{tituloAlerta(alerta.tipo)}</p>
                <p className="text-xs text-muted-foreground">
                  {alerta.periodo === "semana" ? t("Semana", "Week") : t("Mês", "Month")}:{" "}
                  {dataCurta(alerta.inicio)} – {dataCurta(alerta.fim)} ·{" "}
                  {t("registrado em", "recorded on")} {dataCurta(alerta.criadoEm.slice(0, 10))}
                </p>
              </div>
              <div className="flex gap-4 text-sm">
                <span className="text-primary-deep">
                  <span className="block text-xs text-muted-foreground">
                    {t("Entradas", "Income")}
                  </span>
                  {brl(alerta.entradas)}
                </span>
                <span>
                  <span className="block text-xs text-muted-foreground">
                    {t("Gastos", "Spending")}
                  </span>
                  {brl(alerta.gastos)}
                </span>
                <span className={alerta.saldo < 0 ? "text-destructive" : "text-primary-deep"}>
                  <span className="block text-xs text-muted-foreground">
                    {t("Saldo", "Balance")}
                  </span>
                  {brl(alerta.saldo)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
