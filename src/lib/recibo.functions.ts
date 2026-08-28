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

/** Junta data + hora num instante comparável (meia-noite quando não há hora). */
function instante(dia: string, hora: string | null | undefined) {
  const [h, m] = (hora ?? "00:00").split(":");
  return new Date(
    `${dia}T${(h ?? "00").padStart(2, "0")}:${(m ?? "00").padStart(2, "0")}:00Z`,
  ).getTime();
}

function somarDias(dia: string, dias: number) {
  const d = new Date(`${dia}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/**
 * Procura despesas já registradas que combinem com o comprovante lido.
 * As regras são escolhidas pela pessoa: janela de horas e o que comparar.
 */
export const verificarDuplicidadeRecibo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        estabelecimento: z.string().max(120).nullable().optional(),
        hora: z.string().max(10).nullable().optional(),
        valores: z.array(z.number().positive()).min(1).max(40),
        /** 0 = só o mesmo dia. Até 30 dias (720h). */
        janelaHoras: z.number().min(0).max(720).optional(),
        compararValor: z.boolean().optional(),
        compararEstabelecimento: z.boolean().optional(),
        compararDescricao: z.boolean().optional(),
        descricoes: z.array(z.string().max(160)).max(40).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const janela = data.janelaHoras ?? 0;
    const compararValor = data.compararValor ?? true;
    const compararEstab = data.compararEstabelecimento ?? true;
    const compararDesc = data.compararDescricao ?? false;

    const margemDias = Math.max(0, Math.ceil(janela / 24));
    const { data: linhas, error } = await context.supabase
      .from("expenses")
      .select("id, descricao, valor, data, estabelecimento, hora")
      .eq("user_id", context.userId)
      .gte("data", somarDias(data.data, -margemDias))
      .lte("data", somarDias(data.data, margemDias));
    if (error) throw new Error(error.message);

    const nome = (data.estabelecimento ?? "").trim().toLowerCase();
    const centavos = (v: number) => Math.round(v * 100);
    const alvos = new Set(data.valores.map(centavos));
    const descs = new Set((data.descricoes ?? []).map((d) => d.trim().toLowerCase()));
    const base = instante(data.data, data.hora ?? null);

    const iguais = (linhas ?? []).filter((l) => {
      if (compararValor && !alvos.has(centavos(Number(l.valor)))) return false;
      if (compararEstab && nome && (l.estabelecimento ?? "").trim().toLowerCase() !== nome)
        return false;
      if (compararDesc && descs.size > 0 && !descs.has((l.descricao ?? "").trim().toLowerCase()))
        return false;

      if (janela === 0) return l.data === data.data;
      const diffH = Math.abs(instante(l.data, l.hora) - base) / 3_600_000;
      return diffH <= janela;
    });

    return {
      duplicado: iguais.length > 0,
      total: iguais.length,
      exemplos: iguais.slice(0, 6).map((l) => ({
        id: l.id,
        descricao: l.descricao ?? "",
        valor: Number(l.valor),
        data: l.data,
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
        mime: z.string().max(120).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    let comprovante: string | null = null;

    if (data.imagem) {
      const cabecalho = data.imagem.slice(0, data.imagem.indexOf(","));
      const tipo =
        data.mime ?? (/^data:([^;]+)/.exec(cabecalho)?.[1] as string | undefined) ?? "image/jpeg";
      const extensao = tipo === "application/pdf" ? "pdf" : tipo === "image/png" ? "png" : "jpg";
      const base64 = data.imagem.split(",").pop() ?? "";
      const binario = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const caminho = `${context.userId}/${crypto.randomUUID()}.${extensao}`;
      const { error: erroUpload } = await context.supabase.storage
        .from("comprovantes")
        .upload(caminho, binario, { contentType: tipo, upsert: false });
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

/** Lista as despesas com comprovante anexado num período, já com link temporário. */
export const listarComprovantes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        fim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: linhas, error } = await context.supabase
      .from("expenses")
      .select("id, descricao, valor, data, categoria, estabelecimento, hora, comprovante")
      .eq("user_id", context.userId)
      .not("comprovante", "is", null)
      .gte("data", data.inicio)
      .lte("data", data.fim)
      .order("data", { ascending: true });
    if (error) throw new Error(error.message);

    const caminhos = [...new Set((linhas ?? []).map((l) => l.comprovante!).filter(Boolean))];
    const urls = new Map<string, string>();
    if (caminhos.length > 0) {
      const { data: assinados } = await context.supabase.storage
        .from("comprovantes")
        .createSignedUrls(caminhos, 60 * 30);
      for (const a of assinados ?? []) {
        if (a.path && a.signedUrl) urls.set(a.path, a.signedUrl);
      }
    }

    return {
      itens: (linhas ?? []).map((l) => ({
        id: l.id,
        descricao: l.descricao ?? "",
        valor: Number(l.valor),
        data: l.data,
        categoria: l.categoria,
        estabelecimento: l.estabelecimento,
        hora: l.hora,
        caminho: l.comprovante!,
        url: urls.get(l.comprovante!) ?? null,
        pdf: l.comprovante!.toLowerCase().endsWith(".pdf"),
      })),
    };
  });
