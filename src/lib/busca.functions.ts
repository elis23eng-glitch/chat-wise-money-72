import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const filtroSchema = z.object({
  inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  texto: z.string().max(120).optional(),
  estabelecimento: z.string().max(120).optional(),
  categoria: z.string().max(60).optional(),
  valorMin: z.number().min(0).optional(),
  valorMax: z.number().min(0).optional(),
  somenteComComprovante: z.boolean().optional(),
  somenteDuplicados: z.boolean().optional(),
  somenteRevisados: z.boolean().optional(),
});

/**
 * Busca avançada de gastos: período, texto, estabelecimento, categoria e valor.
 * Marca o que veio de um comprovante já revisado e o que parece duplicado.
 */
export const buscarLancamentos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => filtroSchema.parse(data))
  .handler(async ({ data, context }) => {
    let consulta = context.supabase
      .from("expenses")
      .select("id, descricao, valor, categoria, data, estabelecimento, hora, local, comprovante")
      .eq("user_id", context.userId)
      .gte("data", data.inicio)
      .lte("data", data.fim)
      .order("data", { ascending: false })
      .limit(400);

    if (data.categoria) consulta = consulta.eq("categoria", data.categoria);
    if (data.estabelecimento)
      consulta = consulta.ilike("estabelecimento", `%${data.estabelecimento}%`);
    if (data.texto) consulta = consulta.ilike("descricao", `%${data.texto}%`);
    if (typeof data.valorMin === "number") consulta = consulta.gte("valor", data.valorMin);
    if (typeof data.valorMax === "number") consulta = consulta.lte("valor", data.valorMax);
    if (data.somenteComComprovante) consulta = consulta.not("comprovante", "is", null);

    const { data: linhas, error } = await consulta;
    if (error) throw new Error(error.message);

    const caminhos = [...new Set((linhas ?? []).map((l) => l.comprovante).filter(Boolean))];
    const revisados = new Set<string>();
    if (caminhos.length > 0) {
      const { data: auditorias } = await context.supabase
        .from("receipt_audits")
        .select("comprovante, edicoes")
        .eq("user_id", context.userId)
        .in("comprovante", caminhos as string[]);
      for (const a of auditorias ?? []) {
        if (a.comprovante && Array.isArray(a.edicoes) && a.edicoes.length > 0)
          revisados.add(a.comprovante);
      }
    }

    const contagem = new Map<string, number>();
    for (const l of linhas ?? []) {
      const chave = `${l.data}|${Math.round(Number(l.valor) * 100)}|${(l.estabelecimento ?? "").trim().toLowerCase()}`;
      contagem.set(chave, (contagem.get(chave) ?? 0) + 1);
    }

    let itens = (linhas ?? []).map((l) => {
      const chave = `${l.data}|${Math.round(Number(l.valor) * 100)}|${(l.estabelecimento ?? "").trim().toLowerCase()}`;
      return {
        id: l.id,
        descricao: l.descricao ?? "",
        valor: Number(l.valor),
        categoria: l.categoria,
        data: l.data,
        estabelecimento: l.estabelecimento,
        hora: l.hora,
        comprovante: l.comprovante,
        revisado: l.comprovante ? revisados.has(l.comprovante) : false,
        duplicado: (contagem.get(chave) ?? 0) > 1,
      };
    });

    if (data.somenteDuplicados) itens = itens.filter((i) => i.duplicado);
    if (data.somenteRevisados) itens = itens.filter((i) => i.revisado);

    return {
      itens,
      total: itens.reduce((s, i) => s + i.valor, 0),
      quantidade: itens.length,
      duplicados: itens.filter((i) => i.duplicado).length,
      revisados: itens.filter((i) => i.revisado).length,
    };
  });
