import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CATEGORIAS } from "./agent.server";
import { lerReciboDaImagem } from "./recibo.server";

const entradaSchema = z.object({
  imagem: z.string().min(100).max(9_000_000),
  idioma: z.enum(["pt", "en"]).optional(),
});

const itemSchema = z.object({
  descricao: z.string().min(1).max(120),
  valor: z.number().positive(),
  categoria: z.enum(CATEGORIAS),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
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
    });
    return {
      ...leitura,
      itens: leitura.itens.map((i) => ({
        ...i,
        data: /^\d{4}-\d{2}-\d{2}$/.test(i.data) ? i.data : hoje,
      })),
    };
  });

export const registrarDespesasDoRecibo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ itens: z.array(itemSchema).min(1).max(30) }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("expenses")
      .insert(data.itens.map((i) => ({ ...i, user_id: context.userId })));
    if (error) throw new Error(error.message);
    return { ok: true, total: data.itens.length };
  });
