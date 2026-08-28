import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\d+/g, "")
    .replace(/[^a-z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function mesDe(dia: string) {
  return dia.slice(0, 7);
}

function proximaData(diaDoMes: number, base = new Date()) {
  const d = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 1));
  const ultimo = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(diaDoMes, ultimo));
  return d.toISOString().slice(0, 10);
}

/** Procura gastos que se repetem mês a mês (contas fixas) e sugere regras. */
export const detectarRecorrentes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const desde = new Date();
    desde.setUTCMonth(desde.getUTCMonth() - 6);
    const { data: linhas, error } = await context.supabase
      .from("expenses")
      .select("descricao, valor, categoria, data, estabelecimento")
      .eq("user_id", context.userId)
      .gte("data", desde.toISOString().slice(0, 10))
      .order("data", { ascending: true });
    if (error) throw new Error(error.message);

    const grupos = new Map<
      string,
      {
        chave: string;
        descricao: string;
        estabelecimento: string | null;
        categoria: string;
        valores: number[];
        dias: number[];
        meses: Set<string>;
        ultima: string;
      }
    >();

    for (const l of linhas ?? []) {
      const rotulo = (l.estabelecimento ?? l.descricao ?? "").trim();
      const chave = normalizar(rotulo);
      if (chave.length < 3) continue;
      const atual = grupos.get(chave) ?? {
        chave,
        descricao: rotulo,
        estabelecimento: l.estabelecimento ?? null,
        categoria: l.categoria,
        valores: [],
        dias: [],
        meses: new Set<string>(),
        ultima: l.data,
      };
      atual.valores.push(Number(l.valor));
      atual.dias.push(Number(l.data.slice(8, 10)));
      atual.meses.add(mesDe(l.data));
      atual.ultima = l.data;
      atual.categoria = l.categoria;
      grupos.set(chave, atual);
    }

    const { data: regras } = await context.supabase
      .from("recurring_rules")
      .select("chave")
      .eq("user_id", context.userId);
    const jaTem = new Set((regras ?? []).map((r) => r.chave));

    const sugestoes = [...grupos.values()]
      .filter((g) => g.meses.size >= 2 && !jaTem.has(g.chave))
      .map((g) => {
        const media = g.valores.reduce((s, v) => s + v, 0) / g.valores.length;
        const dia = Math.round(g.dias.reduce((s, v) => s + v, 0) / g.dias.length);
        const variacao =
          Math.max(...g.valores) - Math.min(...g.valores) < Math.max(1, media * 0.15)
            ? "estável"
            : "varia";
        return {
          chave: g.chave,
          descricao: g.descricao,
          estabelecimento: g.estabelecimento,
          categoria: g.categoria,
          valorMedio: Math.round(media * 100) / 100,
          diaDoMes: Math.min(28, Math.max(1, dia)),
          ocorrencias: g.valores.length,
          meses: g.meses.size,
          ultima: g.ultima,
          variacao,
        };
      })
      .sort((a, b) => b.meses - a.meses || b.valorMedio - a.valorMedio)
      .slice(0, 12);

    return { sugestoes };
  });

export const listarRegrasRecorrentes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("recurring_rules")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return {
      regras: (data ?? []).map((r) => ({
        id: r.id,
        chave: r.chave,
        descricao: r.descricao,
        estabelecimento: r.estabelecimento,
        categoria: r.categoria,
        valorMedio: Number(r.valor_medio),
        diaDoMes: r.dia_do_mes,
        ativa: r.ativa,
        ultimoRegistro: r.ultimo_registro,
        proximaData: r.proxima_data,
      })),
    };
  });

export const criarRegraRecorrente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        chave: z.string().min(2).max(120),
        descricao: z.string().min(1).max(160),
        estabelecimento: z.string().max(160).nullable().optional(),
        categoria: z.string().max(60),
        valorMedio: z.number().positive(),
        diaDoMes: z.number().int().min(1).max(28),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("recurring_rules").upsert(
      {
        user_id: context.userId,
        chave: data.chave,
        descricao: data.descricao,
        estabelecimento: data.estabelecimento ?? null,
        categoria: data.categoria,
        valor_medio: data.valorMedio,
        dia_do_mes: data.diaDoMes,
        ativa: true,
        proxima_data: proximaData(data.diaDoMes),
      },
      { onConflict: "user_id,chave" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const alternarRegraRecorrente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z.object({ id: z.string().uuid(), ativa: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("recurring_rules")
      .update({ ativa: data.ativa })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const apagarRegraRecorrente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("recurring_rules")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Registra a conta fixa do próximo ciclo — só depois da pessoa confirmar. */
export const registrarCicloRecorrente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        valor: z.number().positive(),
        data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: regra, error: erroRegra } = await context.supabase
      .from("recurring_rules")
      .select("*")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (erroRegra) throw new Error(erroRegra.message);
    if (!regra) throw new Error("Regra não encontrada");

    const { error } = await context.supabase.from("expenses").insert({
      user_id: context.userId,
      descricao: regra.descricao,
      valor: data.valor,
      categoria: regra.categoria,
      data: data.data,
      estabelecimento: regra.estabelecimento,
    });
    if (error) throw new Error(error.message);

    await context.supabase
      .from("recurring_rules")
      .update({
        ultimo_registro: data.data,
        proxima_data: proximaData(regra.dia_do_mes, new Date(`${data.data}T00:00:00Z`)),
      })
      .eq("id", regra.id)
      .eq("user_id", context.userId);

    return { ok: true };
  });
