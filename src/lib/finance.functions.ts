import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { runAgent } from "./agent.server";
import { fetchMarket } from "./market.server";

const CATEGORIAS = [
  "alimentação",
  "transporte",
  "moradia",
  "contas fixas",
  "saúde",
  "lazer",
  "educação",
  "vestuário",
  "outros",
] as const;

export const CATEGORIAS_ENTRADA = [
  "salário",
  "aposentadoria",
  "pensão",
  "trabalho extra",
  "aluguel recebido",
  "venda",
  "presente",
  "outros",
] as const;

function inicioDoMes(offset = 0) {
  const agora = new Date();
  return new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth() + offset, 1))
    .toISOString()
    .slice(0, 10);
}

export const getMarket = createServerFn({ method: "GET" }).handler(async () => fetchMarket());

export const getOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: gastos }, { data: entradas }, { data: metas }] = await Promise.all([
      supabase
        .from("expenses")
        .select("id, valor, categoria, descricao, data, created_at")
        .eq("user_id", userId)
        .gte("data", inicioDoMes(-3))
        .order("data", { ascending: false }),
      supabase
        .from("incomes")
        .select("id, valor, categoria, descricao, data, created_at")
        .eq("user_id", userId)
        .gte("data", inicioDoMes(-3))
        .order("data", { ascending: false }),
      supabase
        .from("goals")
        .select("id, titulo, valor_alvo, valor_atual, prazo")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    ]);

    const linhas = (gastos ?? []).map((g) => ({ ...g, valor: Number(g.valor) }));
    const mesAtual = inicioDoMes(0);
    const mesAnterior = inicioDoMes(-1);

    const doMes = linhas.filter((l) => l.data >= mesAtual);
    const doAnterior = linhas.filter((l) => l.data >= mesAnterior && l.data < mesAtual);

    const porCategoria: Record<string, number> = {};
    for (const l of doMes) porCategoria[l.categoria] = (porCategoria[l.categoria] ?? 0) + l.valor;

    const porCategoriaAnterior: Record<string, number> = {};
    for (const l of doAnterior)
      porCategoriaAnterior[l.categoria] = (porCategoriaAnterior[l.categoria] ?? 0) + l.valor;

    const totalMes = doMes.reduce((s, l) => s + l.valor, 0);
    const totalAnterior = doAnterior.reduce((s, l) => s + l.valor, 0);

    const linhasEntrada = (entradas ?? []).map((e) => ({ ...e, valor: Number(e.valor) }));
    const entradasMes = linhasEntrada.filter((l) => l.data >= mesAtual);
    const entradasAnterior = linhasEntrada.filter((l) => l.data >= mesAnterior && l.data < mesAtual);
    const totalEntradas = entradasMes.reduce((s, l) => s + l.valor, 0);
    const totalEntradasAnterior = entradasAnterior.reduce((s, l) => s + l.valor, 0);

    return {
      totalMes,
      totalAnterior,
      totalEntradas,
      totalEntradasAnterior,
      saldo: totalEntradas - totalMes,
      entradasRecentes: linhasEntrada.slice(0, 12),
      porCategoria,
      porCategoriaAnterior,
      recentes: linhas.slice(0, 12),
      metas: (metas ?? []).map((m) => ({
        ...m,
        valor_alvo: Number(m.valor_alvo),
        valor_atual: Number(m.valor_atual),
      })),
    };
  });

export const getMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("chat_messages")
      .select("id, role, content, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: true })
      .limit(200);
    return data ?? [];
  });

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z
      .object({
        message: z.string().min(1).max(2000),
        idioma: z.enum(["pt", "en"]).optional(),
      })
      .parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: historyRows } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(40);

    await supabase
      .from("chat_messages")
      .insert({ user_id: userId, role: "user", content: data.message });

    const resposta = await runAgent({
      supabase,
      userId,
      history: (historyRows ?? []).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      message: data.message,
      ...(data.idioma ? { idioma: data.idioma } : {}),
    });

    await supabase
      .from("chat_messages")
      .insert({ user_id: userId, role: "assistant", content: resposta });

    return { resposta };
  });

export const clearMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await context.supabase.from("chat_messages").delete().eq("user_id", context.userId);
    return { ok: true };
  });

export const addExpense = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        valor: z.number().positive(),
        categoria: z.enum(CATEGORIAS),
        descricao: z.string().max(120),
        data: z.string(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("expenses")
      .insert({ ...data, user_id: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteExpense = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await context.supabase
      .from("expenses")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    return { ok: true };
  });

export const createGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        titulo: z.string().min(2).max(80),
        valor_alvo: z.number().positive(),
        prazo: z.string().nullable(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("goals")
      .insert({ ...data, user_id: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addToGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), valor: z.number() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: meta } = await context.supabase
      .from("goals")
      .select("valor_atual")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!meta) throw new Error("Meta não encontrada");
    const novo = Math.max(0, Number(meta.valor_atual) + data.valor);
    await context.supabase
      .from("goals")
      .update({ valor_atual: novo })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    return { ok: true };
  });

export const deleteGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await context.supabase.from("goals").delete().eq("id", data.id).eq("user_id", context.userId);
    return { ok: true };
  });

export const addIncome = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        valor: z.number().positive(),
        categoria: z.enum(CATEGORIAS_ENTRADA),
        descricao: z.string().max(120),
        data: z.string(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("incomes")
      .insert({ ...data, user_id: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteIncome = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await context.supabase.from("incomes").delete().eq("id", data.id).eq("user_id", context.userId);
    return { ok: true };
  });
