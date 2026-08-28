import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

type Db = SupabaseClient<Database>;

export type LinhaCsv = {
  tipo: "gasto" | "entrada";
  data: string;
  descricao: string;
  categoria: string;
  valor: number;
  estabelecimento: string;
  hora: string;
  comprovante: "sim" | "nao";
};

/** Busca gastos e entradas de um período para exportação em CSV. */
export async function montarLinhasCsv(
  supabase: Db,
  userId: string,
  inicio: string,
  fim: string,
): Promise<LinhaCsv[]> {
  const [{ data: gastos, error: e1 }, { data: entradas, error: e2 }] = await Promise.all([
    supabase
      .from("expenses")
      .select("data, descricao, categoria, valor, estabelecimento, hora, comprovante")
      .eq("user_id", userId)
      .gte("data", inicio)
      .lte("data", fim)
      .order("data", { ascending: true }),
    supabase
      .from("incomes")
      .select("data, descricao, categoria, valor")
      .eq("user_id", userId)
      .gte("data", inicio)
      .lte("data", fim)
      .order("data", { ascending: true }),
  ]);
  if (e1) throw new Error(e1.message);
  if (e2) throw new Error(e2.message);

  const linhas: LinhaCsv[] = [];
  for (const g of gastos ?? []) {
    linhas.push({
      tipo: "gasto",
      data: g.data,
      descricao: g.descricao ?? "",
      categoria: g.categoria ?? "outros",
      valor: Number(g.valor),
      estabelecimento: g.estabelecimento ?? "",
      hora: g.hora ?? "",
      comprovante: g.comprovante ? "sim" : "nao",
    });
  }
  for (const e of entradas ?? []) {
    linhas.push({
      tipo: "entrada",
      data: e.data,
      descricao: e.descricao ?? "",
      categoria: e.categoria ?? "outros",
      valor: Number(e.valor),
      estabelecimento: "",
      hora: "",
      comprovante: "nao",
    });
  }
  linhas.sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0));
  return linhas;
}

/** Total por categoria, separando gastos e entradas. */
export function resumirCategorias(linhas: LinhaCsv[]) {
  const mapa = new Map<string, { tipo: string; categoria: string; total: number; itens: number }>();
  for (const l of linhas) {
    const chave = `${l.tipo}|${l.categoria}`;
    const atual = mapa.get(chave) ?? { tipo: l.tipo, categoria: l.categoria, total: 0, itens: 0 };
    atual.total += l.valor;
    atual.itens += 1;
    mapa.set(chave, atual);
  }
  return [...mapa.values()]
    .map((c) => ({ ...c, total: Math.round(c.total * 100) / 100 }))
    .sort((a, b) => b.total - a.total);
}
