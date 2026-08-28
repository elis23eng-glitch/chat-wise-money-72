import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { montarLembretes } from "./lembretes.server";

/** Lembretes inteligentes: dias sem registrar, itens duvidosos e contas fixas. */
export const getLembretes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => montarLembretes(context.supabase, context.userId));
