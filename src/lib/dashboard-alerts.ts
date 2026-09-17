import type { TipoAlerta } from "@/lib/alerts.functions";

export type AlertaPainel = {
  tipo: TipoAlerta;
  tom: "perigo" | "atencao" | "bom";
  titulo: string;
  texto: string;
};

export type TraduzirAlerta = (portugues: string, ingles: string) => string;

export type EntradaAlertasPainel = {
  carregando: boolean;
  dadosDisponiveis: boolean;
  semanal: boolean;
  entradasPeriodo: number;
  saldoPeriodo: number;
  entradasMes: number;
  projecaoMes: number;
  gastoSemana: number;
  gastoSemanaAnterior: number;
  traduzir: TraduzirAlerta;
  formatarMoeda: (valor: number) => string;
};

/** Gera os alertas financeiros sem depender da tela ou de estado React. */
export function gerarAlertasPainel(entrada: EntradaAlertasPainel): AlertaPainel[] {
  const {
    carregando,
    dadosDisponiveis,
    semanal,
    entradasPeriodo,
    saldoPeriodo,
    entradasMes,
    projecaoMes,
    gastoSemana,
    gastoSemanaAnterior,
    traduzir: t,
    formatarMoeda: moeda,
  } = entrada;
  if (carregando || !dadosDisponiveis) return [];

  const alertas: AlertaPainel[] = [];
  const rotuloPeriodo = semanal ? t("nesta semana", "this week") : t("neste mês", "this month");

  if (saldoPeriodo < 0) {
    alertas.push({
      tipo: "saldo_negativo",
      tom: "perigo",
      titulo: t("Atenção: saldo negativo", "Heads up: negative balance"),
      texto: t(
        `Você gastou ${moeda(Math.abs(saldoPeriodo))} a mais do que recebeu ${rotuloPeriodo}. Vale revisar os gastos maiores e segurar o que der.`,
        `You spent ${moeda(Math.abs(saldoPeriodo))} more than you received ${rotuloPeriodo}. It's worth reviewing the biggest expenses and holding back where you can.`,
      ),
    });
  } else if (entradasPeriodo > 0 && saldoPeriodo < entradasPeriodo * 0.1) {
    alertas.push({
      tipo: "saldo_apertado",
      tom: "atencao",
      titulo: t("Seu saldo está apertado", "Your balance is tight"),
      texto: t(
        `Sobrou só ${moeda(saldoPeriodo)} de tudo que você recebeu ${rotuloPeriodo}. Um cuidado a mais agora evita susto depois.`,
        `Only ${moeda(saldoPeriodo)} is left from everything you received ${rotuloPeriodo}. A little extra care now avoids a surprise later.`,
      ),
    });
  } else if (saldoPeriodo > 0 && entradasPeriodo > 0) {
    alertas.push({
      tipo: "sobra",
      tom: "bom",
      titulo: t("Está sobrando dinheiro", "You have money left over"),
      texto: t(
        `Sobraram ${moeda(saldoPeriodo)} ${rotuloPeriodo}. Que tal guardar uma partezinha numa meta?`,
        `You have ${moeda(saldoPeriodo)} left ${rotuloPeriodo}. How about saving a little in a goal?`,
      ),
    });
  }

  if (!semanal && entradasMes > 0 && projecaoMes > entradasMes) {
    alertas.push({
      tipo: "projecao_vermelho",
      tom: "atencao",
      titulo: t(
        "No ritmo de hoje, o mês fecha no vermelho",
        "At today's pace, the month ends in the red",
      ),
      texto: t(
        `Se continuar assim, você vai gastar cerca de ${moeda(projecaoMes)} e recebeu ${moeda(entradasMes)}. Dá tempo de ajustar.`,
        `If this keeps up, you'll spend about ${moeda(projecaoMes)} while you received ${moeda(entradasMes)}. There's still time to adjust.`,
      ),
    });
  }

  if (semanal && gastoSemanaAnterior > 0) {
    const diferenca = ((gastoSemana - gastoSemanaAnterior) / gastoSemanaAnterior) * 100;
    if (diferenca >= 25) {
      alertas.push({
        tipo: "gasto_acima_semana",
        tom: "atencao",
        titulo: t("Você gastou mais que na semana passada", "You spent more than last week"),
        texto: t(
          `Seus gastos subiram ${Math.round(diferenca)}% em relação aos 7 dias anteriores (${moeda(gastoSemanaAnterior)}).`,
          `Your spending went up ${Math.round(diferenca)}% compared with the previous 7 days (${moeda(gastoSemanaAnterior)}).`,
        ),
      });
    }
  }

  return alertas;
}

export type RegistroHistoricoAlerta = {
  tipo: TipoAlerta;
  periodo: "mes" | "semana";
  inicio: string;
  entradas: number;
  gastos: number;
  saldo: number;
  criadoEm: string;
};

export type FiltrosHistoricoAlerta = {
  periodo: "todos" | "semana" | "mes";
  inicio: string;
  fim: string;
};

export function filtrarHistoricoAlertas<T extends RegistroHistoricoAlerta>(
  historico: T[],
  filtros: FiltrosHistoricoAlerta,
): T[] {
  return historico.filter((registro) => {
    if (filtros.periodo !== "todos" && registro.periodo !== filtros.periodo) return false;
    if (filtros.inicio && registro.inicio < filtros.inicio) return false;
    if (filtros.fim && registro.inicio > filtros.fim) return false;
    return true;
  });
}

export function calcularEstatisticasAlertas<T extends RegistroHistoricoAlerta>(
  itens: T[],
  rotuloMes: (chave: string) => string,
) {
  if (itens.length === 0) return null;

  const media = (numeros: number[]) =>
    numeros.reduce((soma, numero) => soma + numero, 0) / numeros.length;
  const pior = itens.reduce((atual, item) => (item.saldo < atual.saldo ? item : atual), itens[0]!);

  const contagem = new Map<TipoAlerta, number>();
  for (const item of itens) contagem.set(item.tipo, (contagem.get(item.tipo) ?? 0) + 1);
  const maisComum = [...contagem.entries()].sort((a, b) => b[1] - a[1])[0]![0];

  const meses = new Map<string, { quantidade: number; saldos: number[] }>();
  for (const item of itens) {
    const chave = item.criadoEm.slice(0, 7);
    const atual = meses.get(chave) ?? { quantidade: 0, saldos: [] };
    atual.quantidade += 1;
    atual.saldos.push(item.saldo);
    meses.set(chave, atual);
  }
  const porMes = [...meses.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12)
    .map(([chave, valores]) => ({
      chave,
      rotulo: rotuloMes(chave),
      quantidade: valores.quantidade,
      saldoMedio: Math.round(media(valores.saldos) * 100) / 100,
    }));

  return {
    total: itens.length,
    maisComum,
    saldoMedio: media(itens.map((item) => item.saldo)),
    entradasMedia: media(itens.map((item) => item.entradas)),
    gastosMedia: media(itens.map((item) => item.gastos)),
    pior,
    porMes,
  };
}
