import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { calcularSaude } from "./saude.server";

/** Mapa de saúde financeira: pontuação geral e explicações simples. */
export const getSaudeFinanceira = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => calcularSaude(context.supabase, context.userId));
