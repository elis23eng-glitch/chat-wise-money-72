import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const LIMIARES_PADRAO = {
  limiar_geral: 0.7,
  limiar_valor: 0.8,
  limiar_data: 0.7,
  limiar_estabelecimento: 0.6,
  limiar_categoria: 0.6,
  alerta_medio: 0.7,
};

export type Limiares = typeof LIMIARES_PADRAO;

const limiaresSchema = z.object({
  limiar_geral: z.number().min(0).max(1),
  limiar_valor: z.number().min(0).max(1),
  limiar_data: z.number().min(0).max(1),
  limiar_estabelecimento: z.number().min(0).max(1),
  limiar_categoria: z.number().min(0).max(1),
  alerta_medio: z.number().min(0).max(1),
});

/** Limiares de confiança que a pessoa escolheu para disparar revisão e alertas. */
export const obterLimiares = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("ocr_settings")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!data) return LIMIARES_PADRAO;
    return {
      limiar_geral: Number(data.limiar_geral),
      limiar_valor: Number(data.limiar_valor),
      limiar_data: Number(data.limiar_data),
      limiar_estabelecimento: Number(data.limiar_estabelecimento),
      limiar_categoria: Number(data.limiar_categoria),
      alerta_medio: Number(data.alerta_medio),
    } satisfies Limiares;
  });

export const salvarLimiares = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => limiaresSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("ocr_settings")
      .upsert({ ...data, user_id: context.userId, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const edicaoSchema = z.object({
  item: z.string().max(160),
  campo: z.string().max(40),
  antes: z.string().max(200),
  depois: z.string().max(200),
});

/** Guarda o "raio-x" de uma leitura: OCR, confiança, duplicidade e correções manuais. */
export const registrarAuditoria = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        comprovante: z.string().max(300).nullable().optional(),
        estabelecimento: z.string().max(160).nullable().optional(),
        data: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .nullable()
          .optional(),
        arquivoTipo: z.string().max(120).optional(),
        totalItens: z.number().int().min(0).max(200),
        itensBaixaConfianca: z.number().int().min(0).max(200),
        confiancaMedia: z.number().min(0).max(1),
        tentativasOcr: z.number().int().min(1).max(50),
        duplicidadeTotal: z.number().int().min(0).max(500),
        duplicidadeIgnorada: z.boolean(),
        observacao: z.string().max(400).optional(),
        edicoes: z.array(edicaoSchema).max(200),
        itens: z
          .array(
            z.object({
              descricao: z.string().max(160),
              valor: z.number(),
              categoria: z.string().max(60),
              data: z.string().max(20),
              confianca: z.number().min(0).max(1).optional(),
            }),
          )
          .max(60),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("receipt_audits").insert({
      user_id: context.userId,
      comprovante: data.comprovante ?? null,
      estabelecimento: data.estabelecimento ?? null,
      data: data.data ?? null,
      arquivo_tipo: data.arquivoTipo ?? null,
      total_itens: data.totalItens,
      itens_baixa_confianca: data.itensBaixaConfianca,
      confianca_media: data.confiancaMedia,
      tentativas_ocr: data.tentativasOcr,
      duplicidade_total: data.duplicidadeTotal,
      duplicidade_ignorada: data.duplicidadeIgnorada,
      observacao: data.observacao ?? "",
      edicoes: data.edicoes,
      itens: data.itens,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listarAuditorias = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({ limite: z.number().int().min(1).max(100).optional() })
      .optional()
      .parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { data: linhas, error } = await context.supabase
      .from("receipt_audits")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(data?.limite ?? 30);
    if (error) throw new Error(error.message);
    return {
      itens: (linhas ?? []).map((l) => ({
        id: l.id,
        criadoEm: l.created_at,
        comprovante: l.comprovante,
        estabelecimento: l.estabelecimento,
        data: l.data,
        arquivoTipo: l.arquivo_tipo,
        totalItens: l.total_itens,
        itensBaixaConfianca: l.itens_baixa_confianca,
        confiancaMedia: Number(l.confianca_media),
        tentativasOcr: l.tentativas_ocr,
        duplicidadeTotal: l.duplicidade_total,
        duplicidadeIgnorada: l.duplicidade_ignorada,
        observacao: l.observacao,
        edicoes: (l.edicoes ?? []) as { item: string; campo: string; antes: string; depois: string }[],
        itens: (l.itens ?? []) as {
          descricao: string;
          valor: number;
          categoria: string;
          data: string;
          confianca?: number;
        }[],
      })),
    };
  });
