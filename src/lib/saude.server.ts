import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

type Db = SupabaseClient<Database>;

export type FatorSaude = {
  chave: string;
  rotulo_pt: string;
  rotulo_en: string;
  pontos: number;
  maximo: number;
  bom: boolean;
  detalhe_pt: string;
  detalhe_en: string;
};

function primeiroDia(offset = 0) {
  const agora = new Date();
  return new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth() + offset, 1))
    .toISOString()
    .slice(0, 10);
}

function moedaPt(v: number) {
  return `R$ ${v.toFixed(2).replace(".", ",")}`;
}

function moedaEn(v: number) {
  return `R$ ${v.toFixed(2)}`;
}

/** Calcula a pontuação de saúde financeira (0 a 100) e explica cada fator. */
export async function calcularSaude(supabase: Db, userId: string) {
  const desde = primeiroDia(-2);
  const [{ data: gastos }, { data: entradas }, { data: metas }] = await Promise.all([
    supabase
      .from("expenses")
      .select("valor, categoria, data")
      .eq("user_id", userId)
      .gte("data", desde),
    supabase.from("incomes").select("valor, data").eq("user_id", userId).gte("data", desde),
    supabase.from("goals").select("valor_alvo, valor_atual").eq("user_id", userId),
  ]);

  const g = (gastos ?? []).map((x) => ({ ...x, valor: Number(x.valor) }));
  const e = (entradas ?? []).map((x) => ({ ...x, valor: Number(x.valor) }));

  const mesAtual = primeiroDia(0);
  const mesAnterior = primeiroDia(-1);

  const gastoMes = g.filter((x) => x.data >= mesAtual).reduce((s, x) => s + x.valor, 0);
  const entradaMes = e.filter((x) => x.data >= mesAtual).reduce((s, x) => s + x.valor, 0);
  const gastoAnterior = g
    .filter((x) => x.data >= mesAnterior && x.data < mesAtual)
    .reduce((s, x) => s + x.valor, 0);

  const fatores: FatorSaude[] = [];

  // 1. Saldo do mês (35 pontos)
  const saldo = entradaMes - gastoMes;
  const sobra = entradaMes > 0 ? saldo / entradaMes : 0;
  const pontosSaldo =
    entradaMes === 0 ? 10 : sobra >= 0.2 ? 35 : sobra >= 0.1 ? 28 : sobra >= 0 ? 20 : 5;
  fatores.push({
    chave: "saldo",
    rotulo_pt: "Sobra no fim do mês",
    rotulo_en: "Money left at month end",
    pontos: pontosSaldo,
    maximo: 35,
    bom: pontosSaldo >= 20,
    detalhe_pt:
      entradaMes === 0
        ? "Você ainda não registrou entradas neste mês, então não dá para saber se sobra dinheiro."
        : saldo >= 0
          ? `Das suas entradas (${moedaPt(entradaMes)}) sobraram ${moedaPt(saldo)} depois dos gastos.`
          : `Seus gastos passaram das entradas em ${moedaPt(Math.abs(saldo))} neste mês.`,
    detalhe_en:
      entradaMes === 0
        ? "You have not recorded any income this month, so we cannot tell if money is left over."
        : saldo >= 0
          ? `Out of your income (${moedaEn(entradaMes)}), ${moedaEn(saldo)} was left after expenses.`
          : `Your spending went over your income by ${moedaEn(Math.abs(saldo))} this month.`,
  });

  // 2. Comparação com o mês anterior (20 pontos)
  const variacao = gastoAnterior > 0 ? (gastoMes - gastoAnterior) / gastoAnterior : 0;
  const pontosVar =
    gastoAnterior === 0 ? 12 : variacao <= -0.1 ? 20 : variacao <= 0.05 ? 16 : variacao <= 0.2 ? 9 : 3;
  fatores.push({
    chave: "tendencia",
    rotulo_pt: "Comparado ao mês passado",
    rotulo_en: "Compared to last month",
    pontos: pontosVar,
    maximo: 20,
    bom: pontosVar >= 12,
    detalhe_pt:
      gastoAnterior === 0
        ? "Ainda não há um mês anterior completo para comparar."
        : `Você gastou ${moedaPt(gastoMes)} neste mês contra ${moedaPt(gastoAnterior)} no mês passado.`,
    detalhe_en:
      gastoAnterior === 0
        ? "There is no full previous month to compare yet."
        : `You spent ${moedaEn(gastoMes)} this month versus ${moedaEn(gastoAnterior)} last month.`,
  });

  // 3. Concentração em uma categoria (15 pontos)
  const porCategoria = new Map<string, number>();
  for (const x of g.filter((i) => i.data >= mesAtual)) {
    porCategoria.set(x.categoria, (porCategoria.get(x.categoria) ?? 0) + x.valor);
  }
  const maior = [...porCategoria.entries()].sort((a, b) => b[1] - a[1])[0];
  const fatia = maior && gastoMes > 0 ? maior[1] / gastoMes : 0;
  const pontosConc = !maior ? 8 : fatia <= 0.35 ? 15 : fatia <= 0.5 ? 10 : 4;
  fatores.push({
    chave: "concentracao",
    rotulo_pt: "Equilíbrio entre categorias",
    rotulo_en: "Balance across categories",
    pontos: pontosConc,
    maximo: 15,
    bom: pontosConc >= 10,
    detalhe_pt: maior
      ? `A categoria "${maior[0]}" representa ${Math.round(fatia * 100)}% dos seus gastos do mês.`
      : "Ainda não há gastos suficientes neste mês para avaliar o equilíbrio.",
    detalhe_en: maior
      ? `The "${maior[0]}" category is ${Math.round(fatia * 100)}% of this month's spending.`
      : "Not enough expenses this month to evaluate the balance.",
  });

  // 4. Constância dos registros (15 pontos)
  const diasComRegistro = new Set(g.filter((x) => x.data >= mesAtual).map((x) => x.data)).size;
  const hoje = new Date();
  const diaDoMes = hoje.getUTCDate();
  const proporcao = diaDoMes > 0 ? diasComRegistro / diaDoMes : 0;
  const pontosHabito = proporcao >= 0.5 ? 15 : proporcao >= 0.25 ? 10 : proporcao > 0 ? 5 : 0;
  fatores.push({
    chave: "habito",
    rotulo_pt: "Hábito de registrar",
    rotulo_en: "Recording habit",
    pontos: pontosHabito,
    maximo: 15,
    bom: pontosHabito >= 10,
    detalhe_pt: `Você registrou gastos em ${diasComRegistro} de ${diaDoMes} dias deste mês.`,
    detalhe_en: `You recorded expenses on ${diasComRegistro} of ${diaDoMes} days this month.`,
  });

  // 5. Metas (15 pontos)
  const listaMetas = (metas ?? []).map((m) => ({
    alvo: Number(m.valor_alvo),
    atual: Number(m.valor_atual),
  }));
  const progresso =
    listaMetas.length > 0
      ? listaMetas.reduce((s, m) => s + (m.alvo > 0 ? Math.min(1, m.atual / m.alvo) : 0), 0) /
        listaMetas.length
      : 0;
  const pontosMetas =
    listaMetas.length === 0 ? 0 : progresso >= 0.5 ? 15 : progresso >= 0.2 ? 11 : 7;
  fatores.push({
    chave: "metas",
    rotulo_pt: "Metas em andamento",
    rotulo_en: "Goals in progress",
    pontos: pontosMetas,
    maximo: 15,
    bom: pontosMetas >= 11,
    detalhe_pt:
      listaMetas.length === 0
        ? "Você ainda não criou nenhuma meta. Criar uma meta pequena já ajuda muito."
        : `Você tem ${listaMetas.length} meta(s) com ${Math.round(progresso * 100)}% de progresso médio.`,
    detalhe_en:
      listaMetas.length === 0
        ? "You have no goals yet. Even a small goal helps a lot."
        : `You have ${listaMetas.length} goal(s) at ${Math.round(progresso * 100)}% average progress.`,
  });

  const pontuacao = fatores.reduce((s, f) => s + f.pontos, 0);
  const nivel = pontuacao >= 75 ? "otimo" : pontuacao >= 55 ? "bom" : pontuacao >= 35 ? "atencao" : "cuidado";

  return {
    pontuacao,
    nivel,
    gastoMes: Math.round(gastoMes * 100) / 100,
    entradaMes: Math.round(entradaMes * 100) / 100,
    saldo: Math.round(saldo * 100) / 100,
    fatores,
    ajudando: fatores.filter((f) => f.bom),
    atrapalhando: fatores.filter((f) => !f.bom),
  };
}
