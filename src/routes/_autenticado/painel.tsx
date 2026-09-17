import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  PiggyBank,
  Target,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Legend,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getDashboard } from "@/lib/dashboard.functions";
import {
  listarAlertas,
  registrarAlertas,
  type AlertaRegistro,
  type TipoAlerta,
} from "@/lib/alerts.functions";
import {
  brl,
  dataCurta,
  dataLonga,
  categoriaLabel,
  diaSemanaCurto,
  mesCurto,
  notaConversao,
} from "@/lib/format";
import {
  calcularEstatisticasAlertas,
  filtrarHistoricoAlertas,
  gerarAlertasPainel,
  type AlertaPainel,
} from "@/lib/dashboard-alerts";
import { temSecaoRelatorio, type OpcaoSecaoRelatorio } from "@/lib/dashboard-report";
import { useIdioma } from "@/lib/i18n";
import type { DadosRelatorio, SecoesRelatorio } from "@/lib/pdf-report";
import {
  DashboardReportControls,
  DashboardReportPreview,
  type AcaoRelatorio,
} from "@/components/dashboard/DashboardReport";
import { AlertHistorySection } from "@/components/dashboard/AlertHistorySection";
import { LembretesInteligentes } from "@/components/LembretesInteligentes";

export const Route = createFileRoute("/_autenticado/painel")({
  head: () => ({
    meta: [
      { title: "Painel financeiro — Wise Money" },
      {
        name: "description",
        content:
          "Visão geral dos seus gastos: total do mês, evolução, categorias, metas e média diária.",
      },
      { property: "og:title", content: "Painel financeiro — Wise Money" },
      {
        property: "og:description",
        content: "Gráficos simples com a evolução dos seus gastos, categorias e metas.",
      },
      { name: "twitter:title", content: "Painel financeiro — Wise Money" },
      {
        name: "twitter:description",
        content: "Gráficos simples com a evolução dos seus gastos, categorias e metas.",
      },
    ],
  }),
  component: Painel,
});

const CORES = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function Caixa({ children }: { children: React.ReactNode }) {
  return <div className="surface-card p-6">{children}</div>;
}

type DicaProps = {
  active?: boolean;
  payload?: Array<{ value?: number | string; dataKey?: string | number }>;
  label?: string;
};

function DicaGrafico({ active, payload, label }: DicaProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-primary/20 bg-card px-3 py-2 text-sm shadow-soft">
      <p className="font-semibold capitalize">{label}</p>
      <p className="text-muted-foreground">{brl(Number(payload[0]?.value ?? 0))}</p>
    </div>
  );
}

function DicaComparativo({ active, payload, label }: DicaProps) {
  const { t } = useIdioma();
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-primary/20 bg-card px-3 py-2 text-sm shadow-soft">
      <p className="font-semibold capitalize">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-muted-foreground">
          {p.dataKey === "entrada" ? t("Entrou", "In") : t("Saiu", "Out")}: {brl(Number(p.value))}
        </p>
      ))}
    </div>
  );
}

function CartaoAlerta({ alerta }: { alerta: AlertaPainel }) {
  const estilo =
    alerta.tom === "perigo"
      ? "border-destructive/40 bg-destructive/10 text-destructive"
      : alerta.tom === "atencao"
        ? "border-accent/50 bg-accent/15 text-foreground"
        : "border-primary/30 bg-primary/10 text-foreground";
  return (
    <div className={`flex items-start gap-3 rounded-2xl border p-4 ${estilo}`} role="status">
      {alerta.tom === "bom" ? (
        <PiggyBank className="mt-0.5 size-5 shrink-0" />
      ) : (
        <TriangleAlert className="mt-0.5 size-5 shrink-0" />
      )}
      <div>
        <p className="font-display text-lg leading-tight">{alerta.titulo}</p>
        <p className="mt-1 text-sm leading-relaxed opacity-90">{alerta.texto}</p>
      </div>
    </div>
  );
}

function Painel() {
  const { t, idioma } = useIdioma();
  const [modo, setModo] = useState<"mes" | "semana">("mes");
  const carregar = useServerFn(getDashboard);
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: () => carregar() });

  const total = data?.totalMes ?? 0;
  const entradas = data?.totalEntradas ?? 0;
  const saldo = data?.saldo ?? 0;
  const anterior = data?.totalAnterior ?? 0;
  const variacao = anterior > 0 ? ((total - anterior) / anterior) * 100 : 0;
  const subiu = total >= anterior;

  const categorias = Object.entries(data?.porCategoria ?? {})
    .map(([nome, valor]) => ({ nome, valor: Math.round(valor * 100) / 100 }))
    .sort((a, b) => b.valor - a.valor);

  const semDados =
    !isLoading && (data?.quantidadeLancamentos ?? 0) === 0 && (data?.quantidadeEntradas ?? 0) === 0;

  const semana = data?.semana;
  const semanal = modo === "semana";

  const mesesGrafico = (data?.meses ?? []).map((m) => ({ ...m, rotulo: mesCurto(m.chave) }));

  const diasSemana = (semana?.dias ?? []).map((d) => ({
    ...d,
    rotulo: diaSemanaCurto(d.iso),
  }));

  const categoriasSemana = Object.entries(semana?.porCategoria ?? {})
    .map(([nome, valor]) => ({ nome, valor: Math.round(valor * 100) / 100 }))
    .sort((a, b) => b.valor - a.valor);

  // Valores do período escolhido (mês ou semana)
  const periodoEntradas = semanal ? (semana?.entrada ?? 0) : entradas;
  const periodoGastos = semanal ? (semana?.gasto ?? 0) : total;
  const periodoSaldo = semanal ? (semana?.saldo ?? 0) : saldo;

  // ---- Alertas de saldo ----
  const alertas = useMemo(
    () =>
      gerarAlertasPainel({
        carregando: isLoading,
        dadosDisponiveis: Boolean(data),
        semanal,
        entradasPeriodo: periodoEntradas,
        saldoPeriodo: periodoSaldo,
        entradasMes: entradas,
        projecaoMes: data?.projecaoMes ?? 0,
        gastoSemana: semana?.gasto ?? 0,
        gastoSemanaAnterior: semana?.gastoAnterior ?? 0,
        traduzir: t,
        formatarMoeda: brl,
      }),
    [data, entradas, isLoading, periodoEntradas, periodoSaldo, semanal, semana, t],
  );

  // ---- Histórico de alertas ----
  const qc = useQueryClient();
  const carregarHistorico = useServerFn(listarAlertas);
  const gravarAlertas = useServerFn(registrarAlertas);
  const { data: historico } = useQuery({
    queryKey: ["alertas-historico"],
    queryFn: () => carregarHistorico(),
  });

  // ---- Filtros do histórico (período + intervalo de datas) ----
  const [filtroPeriodo, setFiltroPeriodo] = useState<"todos" | "semana" | "mes">("todos");
  const [filtroInicio, setFiltroInicio] = useState("");
  const [filtroFim, setFiltroFim] = useState("");
  const { mutate: gravarAlertasHistorico } = useMutation({
    mutationFn: (alertas: AlertaRegistro[]) => gravarAlertas({ data: { alertas } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alertas-historico"] }),
  });

  const hoje = new Date().toISOString().slice(0, 10);
  const inicioMes = `${hoje.slice(0, 7)}-01`;
  const registros = useMemo<AlertaRegistro[]>(
    () =>
      alertas.map((a) => ({
        tipo: a.tipo,
        tom: a.tom,
        periodo: semanal ? ("semana" as const) : ("mes" as const),
        periodoInicio: semanal ? (semana?.inicio ?? hoje) : inicioMes,
        periodoFim: semanal ? (semana?.fim ?? hoje) : hoje,
        entradas: periodoEntradas,
        gastos: periodoGastos,
        saldo: periodoSaldo,
        extra: a.tipo === "projecao_vermelho" ? (data?.projecaoMes ?? null) : null,
      })),
    [
      alertas,
      data?.projecaoMes,
      hoje,
      inicioMes,
      periodoEntradas,
      periodoGastos,
      periodoSaldo,
      semanal,
      semana?.fim,
      semana?.inicio,
    ],
  );

  useEffect(() => {
    if (isLoading || registros.length === 0) return;
    gravarAlertasHistorico(registros);
  }, [gravarAlertasHistorico, isLoading, registros]);

  const tituloAlerta = (tipo: TipoAlerta) =>
    tipo === "saldo_negativo"
      ? t("Saldo negativo", "Negative balance")
      : tipo === "saldo_apertado"
        ? t("Saldo apertado", "Tight balance")
        : tipo === "sobra"
          ? t("Sobrou dinheiro", "Money left over")
          : tipo === "projecao_vermelho"
            ? t("Projeção no vermelho", "Projected to end in the red")
            : t("Semana mais cara que a anterior", "Pricier week than the previous one");

  const historicoFiltrado = useMemo(
    () =>
      filtrarHistoricoAlertas(historico ?? [], {
        periodo: filtroPeriodo,
        inicio: filtroInicio,
        fim: filtroFim,
      }),
    [historico, filtroPeriodo, filtroInicio, filtroFim],
  );

  const filtrosAtivos = filtroPeriodo !== "todos" || filtroInicio !== "" || filtroFim !== "";

  const estatAlertas = useMemo(
    () =>
      calcularEstatisticasAlertas(historicoFiltrado, (chave) => mesCurto(`${chave}-01`, idioma)),
    [historicoFiltrado, idioma],
  );

  // ---- Exportar o painel em PDF ----
  const [painelPdfAberto, setPainelPdfAberto] = useState(false);
  const [exportando, setExportando] = useState<AcaoRelatorio | null>(null);
  const [avisoPdf, setAvisoPdf] = useState("");
  const [idiomaPdf, setIdiomaPdf] = useState<"pt" | "en">(idioma);
  const [secoesPdf, setSecoesPdf] = useState<SecoesRelatorio>({
    resumo: true,
    categorias: true,
    metas: true,
    alertas: true,
  });

  const dadosPdf = (): DadosRelatorio | null =>
    data
      ? {
          idioma: idiomaPdf,
          secoes: secoesPdf,
          modo: (semanal ? "semana" : "mes") as "semana" | "mes",
          periodoInicio: semanal ? (semana?.inicio ?? hoje) : inicioMes,
          periodoFim: semanal ? (semana?.fim ?? hoje) : hoje,
          entradas: periodoEntradas,
          gastos: periodoGastos,
          saldo: periodoSaldo,
          saldos: {
            dia: data.dia?.saldo ?? 0,
            semana: semana?.saldo ?? 0,
            mes: data.saldo ?? 0,
          },
          mediaDiaria: semanal ? (semana?.mediaDiaria ?? 0) : (data.mediaDiaria ?? 0),
          projecaoMes: data.projecaoMes,
          porCategoria: semanal ? (semana?.porCategoria ?? {}) : (data.porCategoria ?? {}),
          metas: data.metas ?? [],
          historico: historicoFiltrado,
        }
      : null;

  const nenhumaSecao = !temSecaoRelatorio(secoesPdf);

  // Prévia do relatório
  const [previaAberta, setPreviaAberta] = useState(false);
  const [linkRelatorio, setLinkRelatorio] = useState("");
  const [linkCopiado, setLinkCopiado] = useState(false);
  const [conferido, setConferido] = useState(false);

  useEffect(() => {
    setConferido(false);
  }, [idiomaPdf, secoesPdf]);

  const fecharPrevia = () => setPreviaAberta(false);

  function abrirPrevia() {
    if (!dadosPdf() || nenhumaSecao) return;
    setAvisoPdf("");
    setLinkRelatorio("");
    setConferido(false);
    setPreviaAberta(true);
  }

  async function copiarLinkRelatorio() {
    try {
      await navigator.clipboard.writeText(linkRelatorio);
      setLinkCopiado(true);
    } catch {
      /* sem permissão de área de transferência */
    }
  }

  async function exportarPdf(acao: AcaoRelatorio) {
    const dados = dadosPdf();
    if (!dados || nenhumaSecao) return;
    setAvisoPdf("");
    setExportando(acao);
    try {
      const mod = await import("@/lib/pdf-report");
      if (acao === "baixar") {
        await mod.baixarRelatorioPdf(dados);
      } else if (acao === "link") {
        try {
          const url = await mod.gerarLinkRelatorioPdf(dados);
          setLinkRelatorio(url);
          setLinkCopiado(false);
          try {
            await navigator.clipboard.writeText(url);
            setLinkCopiado(true);
          } catch {
            /* sem permissão de área de transferência */
          }
        } catch {
          setAvisoPdf(
            t(
              "Não consegui criar o link agora. Tente de novo em instantes.",
              "I couldn't create the link right now. Please try again shortly.",
            ),
          );
        }
      } else {
        const ok = await mod.compartilharRelatorioPdf(
          dados,
          idiomaPdf === "pt" ? "Relatório financeiro" : "Financial report",
        );
        if (!ok) {
          await mod.baixarRelatorioPdf(dados);
          setAvisoPdf(
            t(
              "Este aparelho não permite compartilhar direto — o arquivo foi baixado para você enviar.",
              "This device can't share directly — the file was downloaded so you can send it.",
            ),
          );
        }
      }
    } finally {
      setExportando(null);
    }
  }

  const secoesPdfOpcoes: OpcaoSecaoRelatorio[] = [
    { chave: "resumo" as const, rotulo: t("Saldo e resumo", "Balance and summary") },
    { chave: "categorias" as const, rotulo: t("Gastos por categoria", "Spending by category") },
    { chave: "metas" as const, rotulo: t("Metas", "Goals") },
    { chave: "alertas" as const, rotulo: t("Histórico de alertas", "Alert history") },
  ];

  const dadosRelatorio = dadosPdf();

  return (
    <div className="space-y-8">
      <LembretesInteligentes />
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
          {t("Painel", "Dashboard")}
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">
          {t("Sua vida financeira num olhar", "Your finances at a glance")}
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          {t(
            "Aqui você vê tudo junto: quanto gastou, com o quê, como está evoluindo e quanto falta para suas metas.",
            "Here you see everything together: how much you spent, on what, how it's evolving, and how much is left for your goals.",
          )}
        </p>
        {notaConversao(idioma) && (
          <p className="mt-2 text-sm text-muted-foreground">{notaConversao(idioma)}</p>
        )}

        <div
          className="mt-5 inline-flex items-center gap-1 rounded-full bg-secondary p-1"
          role="group"
          aria-label={t("Escolher período", "Choose period")}
        >
          {[
            { valor: "mes" as const, rotulo: t("Este mês", "This month") },
            { valor: "semana" as const, rotulo: t("Resumo da semana", "Weekly summary") },
          ].map((op) => (
            <button
              key={op.valor}
              type="button"
              onClick={() => setModo(op.valor)}
              aria-pressed={modo === op.valor}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                modo === op.valor
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              {op.rotulo}
            </button>
          ))}
        </div>

        <DashboardReportControls
          aberto={painelPdfAberto}
          desabilitado={isLoading}
          exportando={exportando}
          idioma={idiomaPdf}
          secoes={secoesPdf}
          opcoesSecoes={secoesPdfOpcoes}
          nenhumaSecao={nenhumaSecao}
          linkRelatorio={linkRelatorio}
          linkCopiado={linkCopiado}
          aviso={avisoPdf}
          t={t}
          onAlternar={() => setPainelPdfAberto((aberto) => !aberto)}
          onIdiomaChange={setIdiomaPdf}
          onSecaoChange={(chave, selecionada) =>
            setSecoesPdf((atual) => ({ ...atual, [chave]: selecionada }))
          }
          onAbrirPrevia={abrirPrevia}
          onExportar={exportarPdf}
          onCopiarLink={copiarLinkRelatorio}
        />
      </header>

      <DashboardReportPreview
        aberta={previaAberta}
        dados={dadosRelatorio}
        idioma={idiomaPdf}
        secoes={secoesPdf}
        opcoesSecoes={secoesPdfOpcoes}
        conferido={conferido}
        exportando={exportando}
        linkRelatorio={linkRelatorio}
        linkCopiado={linkCopiado}
        aviso={avisoPdf}
        t={t}
        onConferidoChange={setConferido}
        onFechar={fecharPrevia}
        onExportar={exportarPdf}
      />

      {isLoading && (
        <p className="text-muted-foreground">
          {t("Carregando seus números…", "Loading your numbers…")}
        </p>
      )}

      {semDados && (
        <Caixa>
          <h2 className="font-display text-2xl">
            {t("Ainda não há gastos neste mês", "There are no expenses this month yet")}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {t(
              "Assim que você anotar o primeiro gasto, os gráficos aparecem aqui automaticamente.",
              "As soon as you record your first expense, the charts will appear here automatically.",
            )}
          </p>
          <Link
            to="/conversa"
            className="mt-5 inline-block rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground hover:bg-primary-deep"
          >
            {t("Anotar conversando", "Add by chatting")}
          </Link>
        </Caixa>
      )}

      {!isLoading && (
        <>
          <div
            className={`rounded-3xl p-6 sm:p-8 ${
              periodoSaldo >= 0
                ? "bg-primary-deep text-primary-deep-foreground"
                : "bg-destructive text-destructive-foreground"
            }`}
          >
            <div className="flex items-center gap-2 text-sm opacity-90">
              {periodoSaldo >= 0 ? (
                <TrendingUp className="size-4" />
              ) : (
                <TrendingDown className="size-4" />
              )}
              {semanal
                ? t("Saldo dos últimos 7 dias", "Balance of the last 7 days")
                : t("Saldo deste mês", "This month's balance")}
            </div>
            <p className="mt-3 font-display text-4xl sm:text-5xl">{brl(periodoSaldo)}</p>
            <p className="mt-2 max-w-xl text-base opacity-90">
              {periodoEntradas === 0 && periodoGastos === 0
                ? semanal
                  ? t(
                      "Ainda não há entradas nem gastos anotados nesta semana.",
                      "There is no income or spending recorded this week yet.",
                    )
                  : t(
                      "Ainda não há entradas nem gastos anotados neste mês.",
                      "There are no income or expenses recorded this month yet.",
                    )
                : t(
                    `Você recebeu ${brl(periodoEntradas)} e gastou ${brl(periodoGastos)}${
                      semanal && semana
                        ? ` entre ${dataLonga(semana.inicio)} e ${dataLonga(semana.fim)}`
                        : ""
                    }.`,
                    `You received ${brl(periodoEntradas)} and spent ${brl(periodoGastos)}${
                      semanal && semana
                        ? ` between ${dataLonga(semana.inicio)} and ${dataLonga(semana.fim)}`
                        : ""
                    }.`,
                  )}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                chave: "dia",
                rotulo: t("Hoje", "Today"),
                detalhe: dataLonga(data?.dia?.iso ?? hoje),
                entrada: data?.dia?.entrada ?? 0,
                gasto: data?.dia?.gasto ?? 0,
                saldo: data?.dia?.saldo ?? 0,
              },
              {
                chave: "semana",
                rotulo: t("Últimos 7 dias", "Last 7 days"),
                detalhe: semana && `${dataCurta(semana.inicio)} – ${dataCurta(semana.fim)}`,
                entrada: semana?.entrada ?? 0,
                gasto: semana?.gasto ?? 0,
                saldo: semana?.saldo ?? 0,
              },
              {
                chave: "mes",
                rotulo: t("Este mês", "This month"),
                detalhe: `${dataCurta(inicioMes)} – ${dataCurta(hoje)}`,
                entrada: entradas,
                gasto: total,
                saldo: saldo,
              },
            ].map((p) => {
              const positivo = p.saldo >= 0;
              return (
                <div
                  key={p.chave}
                  className={`rounded-2xl border p-5 ${
                    positivo
                      ? "border-primary/25 bg-primary/5"
                      : "border-destructive/30 bg-destructive/10"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-base font-semibold">{p.rotulo}</p>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        positivo
                          ? "bg-primary/15 text-primary-deep"
                          : "bg-destructive/20 text-destructive"
                      }`}
                    >
                      {positivo ? (
                        <TrendingUp className="size-3.5" />
                      ) : (
                        <TrendingDown className="size-3.5" />
                      )}
                      {positivo ? t("positivo", "positive") : t("negativo", "negative")}
                    </span>
                  </div>
                  <p
                    className={`mt-2 font-display text-3xl ${
                      positivo ? "text-primary-deep" : "text-destructive"
                    }`}
                  >
                    {brl(p.saldo)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("Entradas", "Income")} {brl(p.entrada)} · {t("Saídas", "Expenses")}{" "}
                    {brl(p.gasto)}
                  </p>
                  {p.detalhe && <p className="mt-1 text-xs text-muted-foreground">{p.detalhe}</p>}
                </div>
              );
            })}
          </div>

          {alertas.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2">
              {alertas.map((a) => (
                <CartaoAlerta key={a.titulo} alerta={a} />
              ))}
            </div>
          )}

          {semanal && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Caixa>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <PiggyBank className="size-4" /> {t("Entradas da semana", "Income this week")}
                  </div>
                  <p className="mt-3 font-display text-3xl text-primary-deep">
                    {brl(semana?.entrada ?? 0)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t(
                      `${semana?.quantidadeEntradas ?? 0} entrada(s) em 7 dias`,
                      `${semana?.quantidadeEntradas ?? 0} income entry(ies) in 7 days`,
                    )}
                  </p>
                </Caixa>

                <div className="rounded-3xl bg-primary-deep p-6 text-primary-deep-foreground">
                  <div className="flex items-center gap-2 text-sm opacity-80">
                    <Wallet className="size-4" /> {t("Gastos da semana", "Spending this week")}
                  </div>
                  <p className="mt-3 font-display text-3xl">{brl(semana?.gasto ?? 0)}</p>
                  <p className="mt-1 text-sm opacity-80">
                    {(semana?.gastoAnterior ?? 0) === 0
                      ? t("Primeira semana registrada", "First week recorded")
                      : t(
                          `${Math.abs(
                            Math.round(
                              (((semana?.gasto ?? 0) - (semana?.gastoAnterior ?? 0)) /
                                (semana?.gastoAnterior || 1)) *
                                100,
                            ),
                          )}% ${
                            (semana?.gasto ?? 0) >= (semana?.gastoAnterior ?? 0)
                              ? "a mais"
                              : "a menos"
                          } que os 7 dias anteriores`,
                          `${Math.abs(
                            Math.round(
                              (((semana?.gasto ?? 0) - (semana?.gastoAnterior ?? 0)) /
                                (semana?.gastoAnterior || 1)) *
                                100,
                            ),
                          )}% ${
                            (semana?.gasto ?? 0) >= (semana?.gastoAnterior ?? 0) ? "more" : "less"
                          } than the previous 7 days`,
                        )}
                  </p>
                </div>

                <Caixa>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="size-4" /> {t("Média por dia", "Average per day")}
                  </div>
                  <p className="mt-3 font-display text-3xl">{brl(semana?.mediaDiaria ?? 0)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t(
                      `${semana?.quantidadeGastos ?? 0} gastos em 7 dias`,
                      `${semana?.quantidadeGastos ?? 0} expenses in 7 days`,
                    )}
                  </p>
                </Caixa>

                <Caixa>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="size-4" /> {t("Dia mais caro", "Priciest day")}
                  </div>
                  <p className="mt-3 font-display text-3xl">
                    {brl(semana?.diaMaisCaro.total ?? 0)}
                  </p>
                  <p className="mt-1 text-sm capitalize text-muted-foreground">
                    {semana ? dataLonga(semana.diaMaisCaro.iso) : "—"}
                  </p>
                </Caixa>
              </div>

              <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                <Caixa>
                  <h2 className="font-display text-2xl">
                    {t("Dia a dia dos últimos 7 dias", "Day by day over the last 7 days")}
                  </h2>
                  <div className="mt-4 h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={diasSemana}>
                        <XAxis
                          dataKey="rotulo"
                          tickLine={false}
                          axisLine={false}
                          className="text-xs"
                          stroke="var(--muted-foreground)"
                        />
                        <YAxis hide />
                        <Tooltip
                          content={<DicaComparativo />}
                          cursor={{ fill: "var(--secondary)" }}
                        />
                        <Legend
                          verticalAlign="top"
                          height={28}
                          iconType="circle"
                          formatter={(v) => (
                            <span className="text-sm text-muted-foreground">
                              {v === "entrada" ? t("Entrou", "In") : t("Saiu", "Out")}
                            </span>
                          )}
                        />
                        <Bar dataKey="entrada" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="total" fill="var(--accent)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Caixa>

                <Caixa>
                  <h2 className="font-display text-2xl">
                    {t("Onde o dinheiro foi na semana", "Where the money went this week")}
                  </h2>
                  {categoriasSemana.length === 0 ? (
                    <p className="mt-4 text-muted-foreground">
                      {t("Sem gastos nos últimos 7 dias.", "No expenses in the last 7 days.")}
                    </p>
                  ) : (
                    <ul className="mt-4 space-y-3 text-sm">
                      {categoriasSemana.slice(0, 6).map((c, i) => (
                        <li key={c.nome}>
                          <div className="flex items-center gap-2">
                            <span
                              className="size-3 shrink-0 rounded-full"
                              style={{ background: CORES[i % CORES.length] }}
                            />
                            <span className="capitalize">{categoriaLabel(c.nome, idioma)}</span>
                            <span className="ml-auto text-muted-foreground">{brl(c.valor)}</span>
                          </div>
                          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{
                                width: `${Math.max(
                                  4,
                                  (c.valor / Math.max(1, semana?.gasto ?? 1)) * 100,
                                )}%`,
                              }}
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  <h3 className="mt-8 font-display text-xl">
                    {t("Lançamentos da semana", "This week's entries")}
                  </h3>
                  <ul className="mt-2 divide-y divide-primary/10 text-sm">
                    {(semana?.entradasRecentes ?? []).map((e) => (
                      <li key={e.id} className="flex items-center gap-3 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{e.descricao}</p>
                          <p className="text-xs capitalize text-muted-foreground">
                            {categoriaLabel(e.categoria, idioma)} · {dataCurta(e.data)}
                          </p>
                        </div>
                        <span className="ml-auto font-display text-base text-primary-deep">
                          + {brl(e.valor)}
                        </span>
                      </li>
                    ))}
                    {(semana?.recentes ?? []).map((g) => (
                      <li key={g.id} className="flex items-center gap-3 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{g.descricao}</p>
                          <p className="text-xs capitalize text-muted-foreground">
                            {categoriaLabel(g.categoria, idioma)} · {dataCurta(g.data)}
                          </p>
                        </div>
                        <span className="ml-auto font-display text-base">- {brl(g.valor)}</span>
                      </li>
                    ))}
                    {(semana?.recentes ?? []).length === 0 &&
                      (semana?.entradasRecentes ?? []).length === 0 && (
                        <li className="py-2.5 text-muted-foreground">
                          {t(
                            "Nada anotado nos últimos 7 dias.",
                            "Nothing recorded in the last 7 days.",
                          )}
                        </li>
                      )}
                  </ul>
                </Caixa>
              </section>
            </>
          )}
        </>
      )}

      {!isLoading && !semanal && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Caixa>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <PiggyBank className="size-4" /> {t("Entradas do mês", "This month's income")}
              </div>
              <p className="mt-3 font-display text-3xl text-primary-deep">{brl(entradas)}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t(
                  `${data?.quantidadeEntradas ?? 0} entrada(s) registrada(s)`,
                  `${data?.quantidadeEntradas ?? 0} income entry(ies) recorded`,
                )}
              </p>
            </Caixa>

            <div className="rounded-3xl bg-primary-deep p-6 text-primary-deep-foreground">
              <div className="flex items-center gap-2 text-sm opacity-80">
                <Wallet className="size-4" /> {t("Gasto do mês", "This month's spending")}
              </div>
              <p className="mt-3 font-display text-3xl">{brl(total)}</p>
              <p className="mt-1 flex items-center gap-1 text-sm opacity-80">
                {anterior === 0 ? (
                  t("Primeiro mês registrado", "First month recorded")
                ) : (
                  <>
                    {subiu ? (
                      <ArrowUpRight className="size-4" />
                    ) : (
                      <ArrowDownRight className="size-4" />
                    )}
                    {t(
                      `${Math.abs(variacao).toFixed(0)}% ${subiu ? "a mais" : "a menos"} que o mês passado`,
                      `${Math.abs(variacao).toFixed(0)}% ${subiu ? "more" : "less"} than last month`,
                    )}
                  </>
                )}
              </p>
            </div>

            <Caixa>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="size-4" /> {t("Média por dia", "Average per day")}
              </div>
              <p className="mt-3 font-display text-3xl">{brl(data?.mediaDiaria ?? 0)}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t(
                  `${data?.quantidadeLancamentos ?? 0} lançamentos no mês`,
                  `${data?.quantidadeLancamentos ?? 0} entries this month`,
                )}
              </p>
            </Caixa>

            <Caixa>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ArrowUpRight className="size-4" /> {t("Projeção do mês", "Month projection")}
              </div>
              <p className="mt-3 font-display text-3xl">{brl(data?.projecaoMes ?? 0)}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t(
                  "Se continuar no ritmo de hoje até o fim do mês",
                  "If you keep today's pace until the end of the month",
                )}
              </p>
            </Caixa>

            <Caixa>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="size-4" /> {t("Guardado nas metas", "Saved in your goals")}
              </div>
              <p className="mt-3 font-display text-3xl">
                {brl((data?.metas ?? []).reduce((s, m) => s + m.valor_atual, 0))}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t(
                  `${(data?.metas ?? []).length} meta(s) ativa(s)`,
                  `${(data?.metas ?? []).length} active goal(s)`,
                )}
              </p>
            </Caixa>
          </div>

          <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <Caixa>
              <h2 className="font-display text-2xl">
                {t(
                  "Entradas e saídas nos últimos 6 meses",
                  "Income and expenses over the last 6 months",
                )}
              </h2>
              <div className="mt-4 h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mesesGrafico}>
                    <defs>
                      <linearGradient id="areaGasto" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.55} />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="areaEntrada" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="rotulo"
                      tickLine={false}
                      axisLine={false}
                      className="text-xs"
                      stroke="var(--muted-foreground)"
                    />
                    <YAxis hide />
                    <Tooltip content={<DicaComparativo />} />
                    <Legend
                      verticalAlign="top"
                      height={28}
                      iconType="circle"
                      formatter={(v) => (
                        <span className="text-sm text-muted-foreground">
                          {v === "entrada" ? t("Entrou", "In") : t("Saiu", "Out")}
                        </span>
                      )}
                    />
                    <Area
                      type="monotone"
                      dataKey="entrada"
                      stroke="var(--chart-2)"
                      strokeWidth={3}
                      fill="url(#areaEntrada)"
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="var(--primary-deep)"
                      strokeWidth={3}
                      fill="url(#areaGasto)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Caixa>

            <Caixa>
              <h2 className="font-display text-2xl">
                {t("Onde o dinheiro foi", "Where the money went")}
              </h2>
              {categorias.length === 0 ? (
                <p className="mt-4 text-muted-foreground">
                  {t("Sem gastos neste mês.", "No expenses this month.")}
                </p>
              ) : (
                <>
                  <div className="mt-2 h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categorias}
                          dataKey="valor"
                          nameKey="nome"
                          innerRadius={52}
                          outerRadius={82}
                          paddingAngle={2}
                        >
                          {categorias.map((c, i) => (
                            <Cell key={c.nome} fill={CORES[i % CORES.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<DicaGrafico />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="mt-3 space-y-2 text-sm">
                    {categorias.slice(0, 5).map((c, i) => (
                      <li key={c.nome} className="flex items-center gap-2">
                        <span
                          className="size-3 shrink-0 rounded-full"
                          style={{ background: CORES[i % CORES.length] }}
                        />
                        <span className="capitalize">{categoriaLabel(c.nome, idioma)}</span>
                        <span className="ml-auto text-muted-foreground">{brl(c.valor)}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Caixa>
          </section>

          <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <Caixa>
              <h2 className="font-display text-2xl">
                {t("Gastos dia a dia deste mês", "Daily spending this month")}
              </h2>
              <div className="mt-4 h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.diario ?? []}>
                    <XAxis
                      dataKey="dia"
                      tickLine={false}
                      axisLine={false}
                      className="text-xs"
                      stroke="var(--muted-foreground)"
                    />
                    <YAxis hide />
                    <Tooltip content={<DicaGrafico />} cursor={{ fill: "var(--secondary)" }} />
                    <Bar dataKey="total" fill="var(--accent)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Caixa>

            <Caixa>
              <h2 className="font-display text-2xl">{t("Suas metas", "Your goals")}</h2>
              {(data?.metas ?? []).length === 0 ? (
                <p className="mt-4 text-muted-foreground">
                  {t("Você ainda não criou metas.", "You haven't created any goals yet.")}{" "}
                  <Link to="/metas" className="font-semibold text-primary underline">
                    {t("Criar agora", "Create now")}
                  </Link>
                </p>
              ) : (
                <div className="mt-4 space-y-4">
                  {(data?.metas ?? []).slice(0, 4).map((m) => {
                    const pct = Math.min(100, (m.valor_atual / Math.max(1, m.valor_alvo)) * 100);
                    return (
                      <div key={m.id}>
                        <div className="flex items-baseline justify-between text-sm">
                          <span className="font-medium">{m.titulo}</span>
                          <span className="text-muted-foreground">
                            {t(
                              `${brl(m.valor_atual)} de ${brl(m.valor_alvo)}`,
                              `${brl(m.valor_atual)} of ${brl(m.valor_alvo)}`,
                            )}
                          </span>
                        </div>
                        <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${Math.max(4, pct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <h3 className="mt-8 font-display text-xl">
                {t("Últimas entradas", "Latest income")}
              </h3>
              {(data?.entradasRecentes ?? []).length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("Nenhuma entrada anotada ainda.", "No income recorded yet.")}{" "}
                  <Link to="/resumo" className="font-semibold text-primary underline">
                    {t("Anotar entrada", "Add income")}
                  </Link>
                </p>
              ) : (
                <ul className="mt-2 divide-y divide-primary/10 text-sm">
                  {(data?.entradasRecentes ?? []).map((e) => (
                    <li key={e.id} className="flex items-center gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{e.descricao}</p>
                        <p className="text-xs capitalize text-muted-foreground">
                          {categoriaLabel(e.categoria, idioma)} · {dataCurta(e.data)}
                        </p>
                      </div>
                      <span className="ml-auto font-display text-base text-primary-deep">
                        + {brl(e.valor)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <h3 className="mt-8 font-display text-xl">
                {t("Últimas saídas", "Latest expenses")}
              </h3>
              <ul className="mt-2 divide-y divide-primary/10 text-sm">
                {(data?.recentes ?? []).map((g) => (
                  <li key={g.id} className="flex items-center gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{g.descricao}</p>
                      <p className="text-xs capitalize text-muted-foreground">
                        {categoriaLabel(g.categoria, idioma)} · {dataCurta(g.data)}
                      </p>
                    </div>
                    <span className="ml-auto font-display text-base">{brl(g.valor)}</span>
                  </li>
                ))}
              </ul>
            </Caixa>
          </section>
        </>
      )}

      {!isLoading && (
        <AlertHistorySection
          historico={historico}
          historicoFiltrado={historicoFiltrado}
          estatisticas={estatAlertas}
          filtroPeriodo={filtroPeriodo}
          filtroInicio={filtroInicio}
          filtroFim={filtroFim}
          filtrosAtivos={filtrosAtivos}
          t={t}
          tituloAlerta={tituloAlerta}
          onFiltroPeriodoChange={setFiltroPeriodo}
          onFiltroInicioChange={setFiltroInicio}
          onFiltroFimChange={setFiltroFim}
          onLimparFiltros={() => {
            setFiltroPeriodo("todos");
            setFiltroInicio("");
            setFiltroFim("");
          }}
        />
      )}
    </div>
  );
}
