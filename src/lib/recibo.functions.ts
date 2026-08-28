import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CATEGORIAS_GASTO } from "./categorias";
import { lerReciboDaImagem } from "./recibo.server";

const entradaSchema = z.object({
  imagem: z.string().min(100).max(9_000_000),
  idioma: z.enum(["pt", "en"]).optional(),
  ajuste: z.string().max(500).optional(),
});

const itemSchema = z.object({
  descricao: z.string().min(1).max(120),
  valor: z.number().positive(),
  categoria: z.enum(CATEGORIAS_GASTO),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  estabelecimento: z.string().max(120).nullable().optional(),
  hora: z.string().max(10).nullable().optional(),
  local: z.string().max(160).nullable().optional(),
});

export const lerRecibo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => entradaSchema.parse(data))
  .handler(async ({ data }) => {
    const hoje = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const leitura = await lerReciboDaImagem({
      imagem: data.imagem,
      hoje,
      idioma: data.idioma ?? "pt",
      ...(data.ajuste ? { ajuste: data.ajuste } : {}),
    });
    return {
      ...leitura,
      itens: leitura.itens.map((i) => ({
        ...i,
        data: /^\d{4}-\d{2}-\d{2}$/.test(i.data) ? i.data : (leitura.data ?? hoje),
        estabelecimento: i.estabelecimento ?? leitura.estabelecimento,
        hora: i.hora ?? leitura.hora,
        local: i.local ?? leitura.local,
      })),
    };
  });

export const registrarDespesasDoRecibo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ itens: z.array(itemSchema).min(1).max(40) }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("expenses").insert(
      data.itens.map((i) => ({
        descricao: i.descricao,
        valor: i.valor,
        categoria: i.categoria,
        data: i.data,
        estabelecimento: i.estabelecimento ?? null,
        hora: i.hora ?? null,
        local: i.local ?? null,
        user_id: context.userId,
      })),
    );
    if (error) throw new Error(error.message);
    return { ok: true, total: data.itens.length };
  });
