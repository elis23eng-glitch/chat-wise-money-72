import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  gerarCodigos,
  hashCodigo,
  ipAproximado,
  listarConfiaveis,
  listarHistorico,
  nomeDoDispositivo,
} from "./seguranca.server";

/** Registra um novo acesso e avisa se o aparelho é desconhecido. */
export const registrarAcesso = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { deviceId: string }) => ({
    deviceId: String(data.deviceId).slice(0, 80),
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const ua = getRequestHeader("user-agent") ?? null;
    const ip = ipAproximado(
      getRequestHeader("x-forwarded-for") ?? getRequestIP({ xForwardedFor: true }) ?? null,
    );

    const { data: anteriores } = await supabase
      .from("login_events")
      .select("id")
      .eq("user_id", userId)
      .eq("device_id", data.deviceId)
      .limit(1);

    const { data: confiavelRow } = await supabase
      .from("trusted_devices")
      .select("confiavel_ate, sessao_max_horas")
      .eq("user_id", userId)
      .eq("device_id", data.deviceId)
      .maybeSingle();

    const confiavel = !!confiavelRow && new Date(confiavelRow.confiavel_ate).getTime() > Date.now();
    const novoDispositivo = (anteriores ?? []).length === 0;

    await supabase.from("login_events").insert({
      user_id: userId,
      device_id: data.deviceId,
      device_name: nomeDoDispositivo(ua),
      user_agent: ua,
      ip,
      status: "sucesso",
      novo_dispositivo: novoDispositivo,
      confiavel,
      notificado: novoDispositivo,
    });

    return {
      novoDispositivo,
      confiavel,
      sessaoMaxHoras: confiavelRow?.sessao_max_horas ?? null,
      confiavelAte: confiavelRow?.confiavel_ate ?? null,
      dispositivo: nomeDoDispositivo(ua),
      ip,
    };
  });

/** Histórico detalhado de acessos. */
export const getHistoricoAcessos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => listarHistorico(context.supabase, context.userId));

/** Dispositivos marcados como confiáveis. */
export const getDispositivosConfiaveis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => listarConfiaveis(context.supabase, context.userId));

export const salvarDispositivoConfiavel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { deviceId: string; apelido?: string; dias: number; sessaoMaxHoras: number }) => ({
      deviceId: String(data.deviceId).slice(0, 80),
      apelido: String(data.apelido ?? "").slice(0, 60),
      dias: Math.min(Math.max(Number(data.dias) || 30, 1), 365),
      sessaoMaxHoras: Math.min(Math.max(Number(data.sessaoMaxHoras) || 24, 1), 8760),
    }),
  )
  .handler(async ({ data, context }) => {
    const ua = getRequestHeader("user-agent") ?? null;
    const ate = new Date(Date.now() + data.dias * 86400000).toISOString();
    const { error } = await context.supabase.from("trusted_devices").upsert(
      {
        user_id: context.userId,
        device_id: data.deviceId,
        apelido: data.apelido || nomeDoDispositivo(ua),
        user_agent: ua,
        confiavel_ate: ate,
        sessao_max_horas: data.sessaoMaxHoras,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,device_id" },
    );
    if (error) throw error;
    return { ok: true, confiavelAte: ate };
  });

export const removerDispositivoConfiavel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => ({ id: String(data.id) }))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("trusted_devices")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

/** Quantos códigos de recuperação ainda estão disponíveis. */
export const getStatusCodigosRecuperacao = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("mfa_recovery_codes")
      .select("id, used_at, created_at")
      .eq("user_id", context.userId);
    if (error) throw error;
    const linhas = data ?? [];
    return {
      total: linhas.length,
      disponiveis: linhas.filter((l) => !l.used_at).length,
      geradoEm: linhas[0]?.created_at ?? null,
    };
  });

/** Gera (ou regenera) 10 códigos de recuperação. Só são exibidos uma vez. */
export const gerarCodigosRecuperacao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const codigos = gerarCodigos(10);
    await supabaseAdmin.from("mfa_recovery_codes").delete().eq("user_id", context.userId);
    const { error } = await supabaseAdmin.from("mfa_recovery_codes").insert(
      codigos.map((c) => ({
        user_id: context.userId,
        code_hash: hashCodigo(c),
      })),
    );
    if (error) throw error;
    return { codigos };
  });

/** Usa um código de recuperação: valida, marca como usado e remove o 2FA da conta. */
export const usarCodigoRecuperacao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { codigo: string }) => ({ codigo: String(data.codigo).slice(0, 40) }))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const hash = hashCodigo(data.codigo);
    const { data: linha } = await supabaseAdmin
      .from("mfa_recovery_codes")
      .select("id")
      .eq("user_id", context.userId)
      .eq("code_hash", hash)
      .is("used_at", null)
      .maybeSingle();

    if (!linha) return { ok: false as const };

    await supabaseAdmin
      .from("mfa_recovery_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("id", linha.id);

    const { data: fatores } = await supabaseAdmin.auth.admin.mfa.listFactors({
      userId: context.userId,
    });
    for (const f of fatores?.factors ?? []) {
      await supabaseAdmin.auth.admin.mfa.deleteFactor({ userId: context.userId, id: f.id });
    }

    return { ok: true as const };
  });
