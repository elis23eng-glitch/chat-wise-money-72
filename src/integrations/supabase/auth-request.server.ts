import { createClient } from "@supabase/supabase-js";

import type { Database } from "./types";

export type RequestAuthResult =
  { authenticated: true; userId: string } | { authenticated: false; status: 401 | 503 };

export function extractBearerToken(authorization: string | null): string | null {
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = authorization.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

/** Valida a sessão do Supabase em rotas HTTP que não usam createServerFn. */
export async function authenticateRequest(request: Request): Promise<RequestAuthResult> {
  const supabaseUrl = process.env["SUPABASE_URL"];
  const publishableKey = process.env["SUPABASE_PUBLISHABLE_KEY"];

  if (!supabaseUrl || !publishableKey) {
    console.error("[Auth] Configuração do Supabase ausente no servidor.");
    return { authenticated: false, status: 503 };
  }

  const token = extractBearerToken(request.headers.get("authorization"));
  if (!token) return { authenticated: false, status: 401 };

  const supabase = createClient<Database>(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await supabase.auth.getClaims(token);
  const userId = data?.claims?.sub;
  if (error || typeof userId !== "string" || userId.length === 0) {
    return { authenticated: false, status: 401 };
  }

  return { authenticated: true, userId };
}
