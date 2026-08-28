import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CATEGORIAS_GASTO } from "./categorias";
import { CAMPOS_RECIBO, lerReciboDaImagem } from "./recibo.server";

const entradaSchema = z.object({
  imagem: z.string().min(100).max(9_000_000),
  idioma: z.enum(["pt", "en"]).optional(),
  ajuste: z.string().max(500).optional(),
  mime: z.string().max(120).optional(),
  nomeArquivo: z.string().max(160).optional(),
});

const itemSchema = z.object({
  descricao: z.string().min(1).max(120),
  valor: z.number().positive(),
  categoria: z.enum(CATEGORIAS_GASTO),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  estabelecimento: z.string().max(120).nullable().optional(),
  hora: z.string().max(10).nullable().optional(),
  local: z.string().max(160).nullable().optional(),
  confianca: z.number().min(0).max(1).optional(),
  campos_incertos: z.array(z.enum(CAMPOS_RECIBO)).optional(),
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
      ...(data.mime ? { mime: data.mime } : {}),
      ...(data.nomeArquivo ? { nomeArquivo: data.nomeArquivo } : {}),
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

/** Procura despesas já registradas que combinem com o comprovante lido. */
export const verificarDuplicidadeRecibo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        estabelecimento: z.string().max(120).nullable().optional(),
        hora: z.string().max(10).nullable().optional(),
        valores: z.array(z.number().positive()).min(1).max(40),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: linhas, error } = await context.supabase
      .from("expenses")
      .select("id, descricao, valor, data, estabelecimento, hora")
      .eq("user_id", context.userId)
      .eq("data", data.data);
    if (error) throw new Error(error.message);

    const nome = (data.estabelecimento ?? "").trim().toLowerCase();
    const centavos = (v: number) => Math.round(v * 100);
    const alvos = new Set(data.valores.map(centavos));

    const iguais = (linhas ?? []).filter((l) => {
      if (!alvos.has(centavos(Number(l.valor)))) return false;
      if (nome && (l.estabelecimento ?? "").trim().toLowerCase() !== nome) return false;
      if (data.hora && l.hora && l.hora !== data.hora) return false;
      return true;
    });

    return {
      duplicado: iguais.length > 0,
      total: iguais.length,
      exemplos: iguais.slice(0, 6).map((l) => ({
        id: l.id,
        descricao: l.descricao ?? "",
        valor: Number(l.valor),
        hora: l.hora,
        estabelecimento: l.estabelecimento,
      })),
    };
  });

export const registrarDespesasDoRecibo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        itens: z.array(itemSchema).min(1).max(40),
        imagem: z.string().min(100).max(9_000_000).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    let comprovante: string | null = null;

    if (data.imagem) {
      const base64 = data.imagem.split(",").pop() ?? "";
      const binario = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const caminho = `${context.userId}/${crypto.randomUUID()}.jpg`;
      const { error: erroUpload } = await context.supabase.storage
        .from("comprovantes")
        .upload(caminho, binario, { contentType: "image/jpeg", upsert: false });
      if (!erroUpload) comprovante = caminho;
    }

    const { error } = await context.supabase.from("expenses").insert(
      data.itens.map((i) => ({
        descricao: i.descricao,
        valor: i.valor,
        categoria: i.categoria,
        data: i.data,
        estabelecimento: i.estabelecimento ?? null,
        hora: i.hora ?? null,
        local: i.local ?? null,
        comprovante,
        user_id: context.userId,
      })),
    );
    if (error) throw new Error(error.message);
    return { ok: true, total: data.itens.length, comprovante };
  });

/** Link temporário para ver a foto da nota guardada. */
export const urlComprovante = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ caminho: z.string().min(3).max(300) }).parse(data))
  .handler(async ({ data, context }) => {
    if (!data.caminho.startsWith(`${context.userId}/`)) throw new Error("Comprovante inválido");
    const { data: assinado, error } = await context.supabase.storage
      .from("comprovantes")
      .createSignedUrl(data.caminho, 60 * 30);
    if (error || !assinado) throw new Error(error?.message ?? "Não consegui abrir o comprovante");
    return { url: assinado.signedUrl };
  });
