import { brl, categoriaLabel, dataCurta, notaConversao } from "@/lib/format";
import type { DadosRelatorio } from "@/lib/pdf-report";

const TXT = {
  pt: {
    titulo: "Relatório financeiro",
    app: "Wise Money — assistente financeiro",
    periodo: "Período",
    mes: "Este mês",
    semana: "Últimos 7 dias",
    resumo: "Resumo",
    entradas: "Entradas",
    gastos: "Saídas",
    saldo: "Saldo",
    positivo: "positivo",
    negativo: "negativo",
    hoje: "Hoje",
    semanaLabel: "Semana",
    mesLabel: "Mês",
    destaqueSaldo: "Seu saldo",
    mediaDiaria: "Média diária de gastos",
    projecao: "Projeção do mês",
    categorias: "Gastos por categoria",
    semCategorias: "Nenhum gasto registrado no período.",
    metas: "Metas",
    semMetas: "Nenhuma meta cadastrada.",
    prazo: "prazo",
    alertas: "Histórico de alertas",
    semAlertas: "Nenhum alerta registrado.",
  },
  en: {
    titulo: "Financial report",
    app: "Wise Money — financial assistant",
    periodo: "Period",
    mes: "This month",
    semana: "Last 7 days",
    resumo: "Summary",
    entradas: "Income",
    gastos: "Expenses",
    saldo: "Balance",
    positivo: "positive",
    negativo: "negative",
    hoje: "Today",
    semanaLabel: "Week",
    mesLabel: "Month",
    destaqueSaldo: "Your balance",
    mediaDiaria: "Daily spending average",
    projecao: "Month projection",
    categorias: "Spending by category",
    semCategorias: "No expenses recorded in this period.",
    metas: "Goals",
    semMetas: "No goals yet.",
    prazo: "due",
    alertas: "Alert history",
    semAlertas: "No alerts recorded.",
  },
};

const TITULOS_ALERTA: Record<"pt" | "en", Record<string, string>> = {
  pt: {
    saldo_negativo: "Saldo negativo",
    saldo_apertado: "Saldo apertado",
    sobra: "Sobrou dinheiro",
    projecao_vermelho: "Projeção no vermelho",
    gasto_acima_semana: "Semana mais cara que a anterior",
  },
  en: {
    saldo_negativo: "Negative balance",
    saldo_apertado: "Tight balance",
    sobra: "Money left over",
    projecao_vermelho: "Projected to end in the red",
    gasto_acima_semana: "Pricier week than the previous one",
  },
};

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h3 className="border-b border-primary/20 pb-2 font-display text-lg text-primary-deep">
        {titulo}
      </h3>
      <div className="mt-3 space-y-2 text-base">{children}</div>
    </section>
  );
}

function Linha({ esquerda, direita }: { esquerda: string; direita?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span>{esquerda}</span>
      {direita && <span className="font-semibold">{direita}</span>}
    </div>
  );
}

function CartaoSaldo({
  label,
  valor,
  idioma,
}: {
  label: string;
  valor: number;
  idioma: "pt" | "en";
}) {
  const positivo = valor >= 0;
  return (
    <div
      className={`rounded-2xl border p-4 ${
        positivo
          ? "border-primary/30 bg-primary/10 text-primary-deep"
          : "border-destructive/40 bg-destructive/10 text-destructive"
      }`}
    >
      <p className="text-sm font-semibold opacity-90">{label}</p>
      <p className="mt-1 font-display text-2xl">{brl(valor, idioma)}</p>
      <p className="mt-1 text-sm font-medium opacity-90">
        {positivo ? TXT[idioma].positivo : TXT[idioma].negativo}
      </p>
    </div>
  );
}

export function PreviaRelatorio({ dados }: { dados: DadosRelatorio }) {
  const L = TXT[dados.idioma];
  const cats = Object.entries(dados.porCategoria).sort((a, b) => b[1] - a[1]);
  const totalCats = cats.reduce((s, [, v]) => s + v, 0);

  return (
    <article className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-sm">
      <header className="rounded-xl bg-primary-deep px-5 py-4 text-primary-deep-foreground">
        <h2 className="font-display text-2xl">{L.titulo}</h2>
        <p className="text-sm opacity-90">{L.app}</p>
      </header>

      <p className="mt-4 text-sm font-semibold">
        {L.periodo}: {dados.modo === "semana" ? L.semana : L.mes} (
        {dataCurta(dados.periodoInicio, dados.idioma)} – {dataCurta(dados.periodoFim, dados.idioma)}
        )
      </p>

      {notaConversao(dados.idioma) && (
        <p className="mt-1 text-xs text-muted-foreground">{notaConversao(dados.idioma)}</p>
      )}

      {dados.secoes.resumo && (
        <Secao titulo={L.resumo}>
          <div className="grid gap-3 sm:grid-cols-3">
            <CartaoSaldo label={L.hoje} valor={dados.saldos.dia} idioma={dados.idioma} />
            <CartaoSaldo label={L.semanaLabel} valor={dados.saldos.semana} idioma={dados.idioma} />
            <CartaoSaldo label={L.mesLabel} valor={dados.saldos.mes} idioma={dados.idioma} />
          </div>

          <div className="mt-4 space-y-2">
            <Linha esquerda={L.entradas} direita={brl(dados.entradas, dados.idioma)} />
            <Linha esquerda={L.gastos} direita={brl(dados.gastos, dados.idioma)} />
            <Linha
              esquerda={`${L.saldo} (${dados.saldo >= 0 ? L.positivo : L.negativo})`}
              direita={brl(dados.saldo, dados.idioma)}
            />
            <Linha esquerda={L.mediaDiaria} direita={brl(dados.mediaDiaria, dados.idioma)} />
            {dados.modo === "mes" && typeof dados.projecaoMes === "number" && (
              <Linha esquerda={L.projecao} direita={brl(dados.projecaoMes, dados.idioma)} />
            )}
          </div>
        </Secao>
      )}

      {dados.secoes.categorias && (
        <Secao titulo={L.categorias}>
          {cats.length === 0 ? (
            <p className="text-muted-foreground">{L.semCategorias}</p>
          ) : (
            cats.map(([nome, valor]) => (
              <Linha
                key={nome}
                esquerda={`${categoriaLabel(nome, dados.idioma)} — ${
                  totalCats > 0 ? Math.round((valor / totalCats) * 100) : 0
                }%`}
                direita={brl(valor, dados.idioma)}
              />
            ))
          )}
        </Secao>
      )}

      {dados.secoes.metas && (
        <Secao titulo={L.metas}>
          {dados.metas.length === 0 ? (
            <p className="text-muted-foreground">{L.semMetas}</p>
          ) : (
            dados.metas.map((meta) => (
              <Linha
                key={meta.titulo}
                esquerda={`${meta.titulo}${
                  meta.prazo ? ` (${L.prazo} ${dataCurta(meta.prazo, dados.idioma)})` : ""
                } — ${
                  meta.valor_alvo > 0 ? Math.round((meta.valor_atual / meta.valor_alvo) * 100) : 0
                }%`}
                direita={`${brl(meta.valor_atual, dados.idioma)} / ${brl(meta.valor_alvo, dados.idioma)}`}
              />
            ))
          )}
        </Secao>
      )}

      {dados.secoes.alertas && (
        <Secao titulo={L.alertas}>
          {dados.historico.length === 0 ? (
            <p className="text-muted-foreground">{L.semAlertas}</p>
          ) : (
            dados.historico.slice(0, 30).map((a, i) => (
              <div key={`${a.criadoEm}-${i}`} className="rounded-xl bg-secondary px-4 py-3">
                <p className="font-semibold">
                  {dataCurta(a.criadoEm.slice(0, 10), dados.idioma)} —{" "}
                  {TITULOS_ALERTA[dados.idioma][a.tipo] ?? a.tipo}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {(a.periodo === "semana" ? L.semana : L.mes) +
                    `: ${dataCurta(a.inicio, dados.idioma)} – ${dataCurta(a.fim, dados.idioma)}`}{" "}
                  · {L.entradas} {brl(a.entradas, dados.idioma)} · {L.gastos}{" "}
                  {brl(a.gastos, dados.idioma)} · {L.saldo} {brl(a.saldo, dados.idioma)}
                </p>
              </div>
            ))
          )}
        </Secao>
      )}
    </article>
  );
}
