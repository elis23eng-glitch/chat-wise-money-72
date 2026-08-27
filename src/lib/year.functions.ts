import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { montarAno } from "./year.server";

export const getYearOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z.object({ ano: z.number().int().min(2000).max(2100) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const inicio = `${data.ano}-01-01`;
    const fim = `${data.ano}-12-31`;

    const [{ data: gastos }, { data: entradas }] = await Promise.all([
      supabase
        .from("expenses")
        .select("valor, categoria, data")
        .eq("user_id", userId)
        .gte("data", inicio)
        .lte("data", fim),
      supabase
        .from("incomes")
        .select("valor, categoria, data")
        .eq("user_id", userId)
        .gte("data", inicio)
        .lte("data", fim),
    ]);

    return montarAno(
      data.ano,
      (gastos ?? []).map((g) => ({ ...g, valor: Number(g.valor) })),
      (entradas ?? []).map((e) => ({ ...e, valor: Number(e.valor) })),
    );
  });
