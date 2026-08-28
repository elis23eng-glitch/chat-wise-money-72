import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { montarLinhasCsv, resumirCategorias } from "./exportar.server";

/** Dados de gastos, entradas e categorias de um período para gerar o CSV. */
export const getDadosCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { inicio: string; fim: string }) =>
    z.object({ inicio: z.string().min(10).max(10), fim: z.string().min(10).max(10) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const linhas = await montarLinhasCsv(context.supabase, context.userId, data.inicio, data.fim);
    return { linhas, categorias: resumirCategorias(linhas) };
  });
