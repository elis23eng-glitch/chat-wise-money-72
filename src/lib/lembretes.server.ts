import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

type Db = SupabaseClient<Database>;

export type Lembrete = {
  chave: string;
  tom: "atencao" | "info" | "bom";
  titulo_pt: string;
  titulo_en: string;
  texto_pt: string;
  texto_en: string;
  acao: "conversa" | "auditoria" | "resumo" | "metas";
};

/** Monta lembretes inteligentes com base nos dias sem registro e itens duvidosos. */
export async function montarLembretes(supabase: Db, userId: string): Promise<Lembrete[]> {
  const desde = new Date();
  desde.setUTCDate(desde.getUTCDate() - 30);
  const desdeIso = desde.toISOString().slice(0, 10);

  const [{ data: gastos }, { data: auditorias }, { data: regras }] = await Promise.all([
    supabase
      .from("expenses")
      .select("data")
      .eq("user_id", userId)
      .order("data", { ascending: false })
      .limit(1),
    supabase
      .from("receipt_audits")
      .select("id, estabelecimento, itens_baixa_confianca, created_at")
      .eq("user_id", userId)
      .gt("itens_baixa_confianca", 0)
      .gte("created_at", desdeIso)
      .order("created_at", { ascending: false }),
    supabase
      .from("recurring_rules")
      .select("descricao, proxima_data, ativa")
      .eq("user_id", userId)
      .eq("ativa", true),
  ]);

  const lembretes: Lembrete[] = [];
  const hojeIso = new Date().toISOString().slice(0, 10);

  const ultimo = gastos?.[0]?.data ?? null;
  const dias = ultimo
    ? Math.floor(
        (Date.parse(`${hojeIso}T00:00:00Z`) - Date.parse(`${ultimo}T00:00:00Z`)) / 86_400_000,
      )
    : null;

  if (dias === null) {
    lembretes.push({
      chave: "primeiro-registro",
      tom: "info",
      titulo_pt: "Vamos começar?",
      titulo_en: "Shall we start?",
      texto_pt: 'Registre seu primeiro gasto falando ou digitando: "gastei 30 no mercado".',
      texto_en: 'Record your first expense by speaking or typing: "I spent 30 at the market".',
      acao: "conversa",
    });
  } else if (dias >= 3) {
    lembretes.push({
      chave: "sem-registro",
      tom: dias >= 7 ? "atencao" : "info",
      titulo_pt: `Faz ${dias} dias sem registrar gastos`,
      titulo_en: `${dias} days without recording expenses`,
      texto_pt:
        "Coloque em dia o que gastou nesses dias — pode ser por voz, foto da nota ou digitando.",
      texto_en: "Catch up on those days — use voice, a receipt photo, or just type it.",
      acao: "conversa",
    });
  } else {
    lembretes.push({
      chave: "em-dia",
      tom: "bom",
      titulo_pt: "Seus registros estão em dia",
      titulo_en: "Your records are up to date",
      texto_pt: "Continue assim: registrar todo dia é o que deixa o resumo confiável.",
      texto_en: "Keep it up: recording daily is what makes your summary reliable.",
      acao: "resumo",
    });
  }

  const duvidosos = (auditorias ?? []).reduce((s, a) => s + (a.itens_baixa_confianca ?? 0), 0);
  if (duvidosos > 0) {
    lembretes.push({
      chave: "baixa-confianca",
      tom: "atencao",
      titulo_pt: `${duvidosos} item(ns) lido(s) com pouca certeza`,
      titulo_en: `${duvidosos} item(s) read with low confidence`,
      texto_pt:
        "Revise esses itens na Auditoria para confirmar valor, data e estabelecimento antes que virem erro no resumo.",
      texto_en:
        "Review those items in the Audit tab to confirm amount, date and merchant before they skew your summary.",
      acao: "auditoria",
    });
  }

  const vencendo = (regras ?? []).filter((r) => r.proxima_data && r.proxima_data <= hojeIso);
  if (vencendo.length > 0) {
    lembretes.push({
      chave: "contas-fixas",
      tom: "info",
      titulo_pt: `${vencendo.length} conta(s) fixa(s) para confirmar`,
      titulo_en: `${vencendo.length} recurring bill(s) to confirm`,
      texto_pt: `Chegou a data de: ${vencendo.map((r) => r.descricao).join(", ")}.`,
      texto_en: `Due now: ${vencendo.map((r) => r.descricao).join(", ")}.`,
      acao: "auditoria",
    });
  }

  return lembretes;
}
