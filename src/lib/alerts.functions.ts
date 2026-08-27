import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type TipoAlerta =
  | "saldo_negativo"
  | "saldo_apertado"
  | "sobra"
  | "projecao_vermelho"
  | "gasto_acima_semana";

export type AlertaRegistro = {
  tipo: TipoAlerta;
  tom: "perigo" | "atencao" | "bom";
  periodo: "mes" | "semana";
  periodoInicio: string;
  periodoFim: string;
  entradas: number;
  gastos: number;
  saldo: number;
  extra?: number | null;
};

/** Grava os alertas disparados (um por tipo/período), sem duplicar. */
export const registrarAlertas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { alertas: AlertaRegistro[] }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (!data.alertas.length) return { gravados: 0 };

    const linhas = data.alertas.slice(0, 20).map((a) => ({
      user_id: userId,
      tipo: a.tipo,
      tom: a.tom,
      periodo: a.periodo,
      periodo_inicio: a.periodoInicio,
      periodo_fim: a.periodoFim,
      entradas: a.entradas,
      gastos: a.gastos,
      saldo: a.saldo,
      extra: a.extra ?? null,
    }));

    const { error } = await supabase
      .from("balance_alerts")
      .upsert(linhas, { onConflict: "user_id,tipo,periodo,periodo_inicio" });
    if (error) throw error;
    return { gravados: linhas.length };
  });

/** Histórico dos alertas, do mais recente para o mais antigo. */
export const listarAlertas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("balance_alerts")
      .select("id, tipo, tom, periodo, periodo_inicio, periodo_fim, entradas, gastos, saldo, extra, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(60);
    if (error) throw error;

    return (data ?? []).map((a) => ({
      id: a.id,
      tipo: a.tipo as TipoAlerta,
      tom: a.tom as "perigo" | "atencao" | "bom",
      periodo: a.periodo as "mes" | "semana",
      inicio: a.periodo_inicio as string,
      fim: a.periodo_fim as string,
      entradas: Number(a.entradas),
      gastos: Number(a.gastos),
      saldo: Number(a.saldo),
      extra: a.extra === null ? null : Number(a.extra),
      criadoEm: a.created_at as string,
    }));
  });
