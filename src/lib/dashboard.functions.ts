import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function primeiroDia(offset = 0) {
  const agora = new Date();
  return new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth() + offset, 1))
    .toISOString()
    .slice(0, 10);
}

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const desde = primeiroDia(-5);

    const [{ data: gastos }, { data: metas }] = await Promise.all([
      supabase
        .from("expenses")
        .select("id, valor, categoria, descricao, data")
        .eq("user_id", userId)
        .gte("data", desde)
        .order("data", { ascending: false }),
      supabase
        .from("goals")
        .select("id, titulo, valor_alvo, valor_atual, prazo")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    ]);

    const linhas = (gastos ?? []).map((g) => ({ ...g, valor: Number(g.valor) }));

    // Série dos últimos 6 meses
    const meses: { chave: string; rotulo: string; total: number }[] = [];
    for (let i = -5; i <= 0; i++) {
      const inicio = primeiroDia(i);
      const fim = primeiroDia(i + 1);
      const total = linhas
        .filter((l) => l.data >= inicio && l.data < fim)
        .reduce((s, l) => s + l.valor, 0);
      const d = new Date(`${inicio}T00:00:00Z`);
      meses.push({
        chave: inicio,
        rotulo: d.toLocaleDateString("pt-BR", { month: "short", timeZone: "UTC" }).replace(".", ""),
        total: Math.round(total * 100) / 100,
      });
    }

    const mesAtual = primeiroDia(0);
    const mesAnterior = primeiroDia(-1);
    const doMes = linhas.filter((l) => l.data >= mesAtual);
    const doAnterior = linhas.filter((l) => l.data >= mesAnterior && l.data < mesAtual);

    const porCategoria: Record<string, number> = {};
    for (const l of doMes) porCategoria[l.categoria] = (porCategoria[l.categoria] ?? 0) + l.valor;

    // Série diária do mês atual
    const hoje = new Date();
    const diasNoMes = new Date(
      Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() + 1, 0),
    ).getUTCDate();
    const diario: { dia: string; total: number; acumulado: number }[] = [];
    let acumulado = 0;
    for (let d = 1; d <= diasNoMes; d++) {
      const iso = `${mesAtual.slice(0, 8)}${String(d).padStart(2, "0")}`;
      const total = doMes.filter((l) => l.data === iso).reduce((s, l) => s + l.valor, 0);
      acumulado += total;
      if (d <= hoje.getUTCDate()) {
        diario.push({
          dia: String(d),
          total: Math.round(total * 100) / 100,
          acumulado: Math.round(acumulado * 100) / 100,
        });
      }
    }

    const totalMes = doMes.reduce((s, l) => s + l.valor, 0);
    const totalAnterior = doAnterior.reduce((s, l) => s + l.valor, 0);
    const diaDoMes = hoje.getUTCDate();
    const mediaDiaria = diaDoMes > 0 ? totalMes / diaDoMes : 0;

    return {
      totalMes,
      totalAnterior,
      mediaDiaria,
      projecaoMes: mediaDiaria * diasNoMes,
      quantidadeLancamentos: doMes.length,
      meses,
      diario,
      porCategoria,
      recentes: linhas.slice(0, 6),
      metas: (metas ?? []).map((m) => ({
        ...m,
        valor_alvo: Number(m.valor_alvo),
        valor_atual: Number(m.valor_atual),
      })),
    };
  });
