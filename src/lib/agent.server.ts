import { createOpenAI } from "@ai-sdk/openai";
import { stepCountIs, streamText, tool } from "ai";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

import { fetchMarket } from "./market.server";
import type { Database } from "@/integrations/supabase/types";

export const CATEGORIAS = [
  "alimentação",
  "transporte",
  "moradia",
  "contas fixas",
  "saúde",
  "lazer",
  "educação",
  "vestuário",
  "outros",
] as const;

export const CATEGORIAS_ENTRADA = [
  "salário",
  "aposentadoria",
  "pensão",
  "trabalho extra",
  "aluguel recebido",
  "venda",
  "presente",
  "outros",
] as const;

type Client = SupabaseClient<Database>;

const SYSTEM_PROMPT = `Você é a Nina, uma agente financeira educativa brasileira do aplicativo "Wise Money".
Fale sempre em português do Brasil, com frases curtas, tom acolhedor, paciente e motivador.
O público é iniciante em finanças e inclui pessoas idosas: nada de jargão. Se precisar usar um termo técnico, explique em uma frase simples.

O que você faz:
- Registra gastos que a pessoa conta em linguagem natural (ex.: "gastei 35 reais no mercado"). Use a ferramenta registrar_gasto e confirme depois, dizendo valor e categoria.
- Registra entradas de dinheiro (salário, aposentadoria, pensão, trabalho extra, venda...) quando a pessoa disser que recebeu algo. Use registrar_entrada e confirme depois.
- Se faltar o valor ou ficar ambíguo, pergunte antes de registrar.
- Quando perguntarem sobre saldo ("sobrou?", "estou no vermelho?"), use resumo_financeiro: saldo = entradas menos gastos do mês. Explique com carinho se estiver negativo.
- Classifica os gastos em uma destas categorias: ${CATEGORIAS.join(", ")}. Se a pessoa corrigir, use corrigir_categoria.
- Cria e acompanha metas simples com criar_meta, listar_metas e guardar_na_meta.
- Mostra resumos e tendências com resumo_financeiro.
- Explica conceitos (juros, orçamento, reserva de emergência, inflação, Tesouro Direto, CDB, fundos) de forma bem simples, com exemplos do dia a dia.
- Mostra dados de mercado com cotacao_mercado (dólar) e explica o que significam.

Regras importantes:
- NUNCA recomende ativos específicos (nenhuma ação, criptomoeda, fundo ou banco em particular). Fale apenas sobre TIPOS de investimento e como estudar cada um.
- Nunca prometa rentabilidade nem diga "compre isso".
- Seja proativa: quando fizer sentido, faça uma pergunta curta no final para continuar a conversa.
- Use R$ com vírgula (ex.: R$ 35,00). Nada de tabelas grandes; prefira listas curtas e frases claras.
- Respostas curtas: no máximo 6 linhas, salvo quando a pessoa pedir uma explicação detalhada.`;

function hoje() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

function inicioDoMes(offset = 0) {
  const agora = new Date();
  const d = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth() + offset, 1));
  return d.toISOString().slice(0, 10);
}

function buildTools(supabase: Client, userId: string) {
  return {
    registrar_gasto: tool({
      description: "Registra um novo gasto do usuário no banco de dados.",
      inputSchema: z.object({
        valor: z.number().describe("Valor em reais, ex.: 35.5"),
        categoria: z.enum(CATEGORIAS),
        descricao: z.string().describe("Descrição curta, ex.: supermercado"),
        data: z.string().nullable().describe("Data no formato AAAA-MM-DD. Use null para hoje."),
      }),
      execute: async ({ valor, categoria, descricao, data }) => {
        const { data: row, error } = await supabase
          .from("expenses")
          .insert({
            user_id: userId,
            valor: valor as unknown as number,
            categoria,
            descricao,
            data: data ?? hoje(),
          })
          .select()
          .single();
        if (error) return { ok: false, erro: error.message };
        return { ok: true, gasto: row };
      },
    }),

    registrar_entrada: tool({
      description:
        "Registra uma entrada de dinheiro (renda recebida) do usuário no banco de dados.",
      inputSchema: z.object({
        valor: z.number().describe("Valor em reais recebido, ex.: 1500"),
        categoria: z.enum(CATEGORIAS_ENTRADA),
        descricao: z.string().describe("Descrição curta, ex.: salário de agosto"),
        data: z.string().nullable().describe("Data no formato AAAA-MM-DD. Use null para hoje."),
      }),
      execute: async ({ valor, categoria, descricao, data }) => {
        const { data: row, error } = await supabase
          .from("incomes")
          .insert({
            user_id: userId,
            valor: valor as unknown as number,
            categoria,
            descricao,
            data: data ?? hoje(),
          })
          .select()
          .single();
        if (error) return { ok: false, erro: error.message };
        return { ok: true, entrada: row };
      },
    }),

    corrigir_categoria: tool({
      description: "Corrige a categoria do último gasto registrado do usuário.",
      inputSchema: z.object({ categoria: z.enum(CATEGORIAS) }),
      execute: async ({ categoria }) => {
        const { data: ultimo } = await supabase
          .from("expenses")
          .select("id")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!ultimo) return { ok: false, erro: "Nenhum gasto encontrado." };
        const { error } = await supabase.from("expenses").update({ categoria }).eq("id", ultimo.id);
        return error ? { ok: false, erro: error.message } : { ok: true, categoria };
      },
    }),

    listar_ultimos_lancamentos: tool({
      description:
        "Lista os lançamentos mais recentes (gastos e/ou entradas) para identificar qual o usuário quer corrigir ou apagar.",
      inputSchema: z.object({
        tipo: z.enum(["gasto", "entrada", "ambos"]).describe("Qual tipo listar."),
        limite: z.number().int().min(1).max(10).describe("Quantos lançamentos, ex.: 5"),
      }),
      execute: async ({ tipo, limite }) => {
        const resultado: { gastos?: unknown[]; entradas?: unknown[] } = {};
        if (tipo === "gasto" || tipo === "ambos") {
          const { data } = await supabase
            .from("expenses")
            .select("id, valor, categoria, descricao, data, created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(limite);
          resultado.gastos = data ?? [];
        }
        if (tipo === "entrada" || tipo === "ambos") {
          const { data } = await supabase
            .from("incomes")
            .select("id, valor, categoria, descricao, data, created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(limite);
          resultado.entradas = data ?? [];
        }
        return { ok: true, ...resultado };
      },
    }),

    corrigir_lancamento: tool({
      description:
        "Corrige um lançamento já registrado (gasto ou entrada): valor, categoria, descrição e/ou data. Se não informar id, corrige o mais recente do tipo escolhido.",
      inputSchema: z.object({
        tipo: z.enum(["gasto", "entrada"]),
        id: z.string().nullable().describe("Id do lançamento. Use null para o mais recente."),
        valor: z.number().nullable().describe("Novo valor em reais ou null para manter."),
        categoria: z.string().nullable().describe("Nova categoria ou null para manter."),
        descricao: z.string().nullable().describe("Nova descrição ou null para manter."),
        data: z.string().nullable().describe("Nova data AAAA-MM-DD ou null para manter."),
      }),
      execute: async ({ tipo, id, valor, categoria, descricao, data }) => {
        const tabela = tipo === "gasto" ? "expenses" : "incomes";
        const permitidas: readonly string[] =
          tipo === "gasto" ? CATEGORIAS : (CATEGORIAS_ENTRADA as readonly string[]);

        if (categoria && !permitidas.includes(categoria)) {
          return {
            ok: false,
            erro: `Categoria inválida. Use uma destas: ${permitidas.join(", ")}.`,
          };
        }
        if (valor !== null && !(valor > 0)) {
          return { ok: false, erro: "O valor precisa ser maior que zero." };
        }

        let alvoId = id;
        if (!alvoId) {
          const { data: ultimo } = await supabase
            .from(tabela)
            .select("id")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (!ultimo) return { ok: false, erro: "Nenhum lançamento encontrado para corrigir." };
          alvoId = ultimo.id;
        }

        const patch: Record<string, unknown> = {};
        if (valor !== null) patch["valor"] = valor;
        if (categoria !== null) patch["categoria"] = categoria;
        if (descricao !== null) patch["descricao"] = descricao;
        if (data !== null) patch["data"] = data;
        if (Object.keys(patch).length === 0) {
          return { ok: false, erro: "Nada para alterar: diga o que deve ser corrigido." };
        }

        const { data: row, error } = await supabase
          .from(tabela)
          .update(patch)
          .eq("id", alvoId)
          .eq("user_id", userId)
          .select()
          .single();
        if (error) return { ok: false, erro: error.message };
        return { ok: true, tipo, lancamento: row };
      },
    }),


    resumo_financeiro: tool({
      description:
        "Retorna entradas, gastos e saldo do mês atual, do mês anterior e os gastos por categoria.",
      inputSchema: z.object({}),
      execute: async () => {
        const [{ data }, { data: rec }] = await Promise.all([
          supabase
            .from("expenses")
            .select("valor, categoria, data")
            .eq("user_id", userId)
            .gte("data", inicioDoMes(-1)),
          supabase
            .from("incomes")
            .select("valor, categoria, data")
            .eq("user_id", userId)
            .gte("data", inicioDoMes(-1)),
        ]);
        const linhas = data ?? [];
        const mesAtual = inicioDoMes(0);
        const porCategoria: Record<string, number> = {};
        let totalMes = 0;
        let totalAnterior = 0;
        for (const l of linhas) {
          const v = Number(l.valor);
          if (l.data >= mesAtual) {
            totalMes += v;
            porCategoria[l.categoria] = (porCategoria[l.categoria] ?? 0) + v;
          } else {
            totalAnterior += v;
          }
        }
        let entradasMes = 0;
        let entradasAnterior = 0;
        for (const l of rec ?? []) {
          const v = Number(l.valor);
          if (l.data >= mesAtual) entradasMes += v;
          else entradasAnterior += v;
        }
        return {
          totalMes,
          totalAnterior,
          entradasMes,
          entradasAnterior,
          saldoMes: entradasMes - totalMes,
          saldoAnterior: entradasAnterior - totalAnterior,
          porCategoria,
          quantidade: linhas.length,
        };
      },
    }),

    criar_meta: tool({
      description: "Cria uma meta financeira simples para o usuário.",
      inputSchema: z.object({
        titulo: z.string(),
        valor_alvo: z.number(),
        prazo: z.string().nullable().describe("Data limite AAAA-MM-DD ou null"),
      }),
      execute: async ({ titulo, valor_alvo, prazo }) => {
        const { data, error } = await supabase
          .from("goals")
          .insert({ user_id: userId, titulo, valor_alvo, prazo })
          .select()
          .single();
        return error ? { ok: false, erro: error.message } : { ok: true, meta: data };
      },
    }),

    listar_metas: tool({
      description: "Lista as metas do usuário e o progresso de cada uma.",
      inputSchema: z.object({}),
      execute: async () => {
        const { data } = await supabase
          .from("goals")
          .select("titulo, valor_alvo, valor_atual, prazo")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        return { metas: data ?? [] };
      },
    }),

    guardar_na_meta: tool({
      description: "Adiciona um valor guardado a uma meta existente (busca pelo título).",
      inputSchema: z.object({ titulo: z.string(), valor: z.number() }),
      execute: async ({ titulo, valor }) => {
        const { data: meta } = await supabase
          .from("goals")
          .select("id, valor_atual, valor_alvo")
          .eq("user_id", userId)
          .ilike("titulo", `%${titulo}%`)
          .limit(1)
          .maybeSingle();
        if (!meta) return { ok: false, erro: "Meta não encontrada." };
        const novo = Number(meta.valor_atual) + valor;
        const { error } = await supabase
          .from("goals")
          .update({ valor_atual: novo })
          .eq("id", meta.id);
        return error
          ? { ok: false, erro: error.message }
          : { ok: true, valor_atual: novo, valor_alvo: Number(meta.valor_alvo) };
      },
    }),

    cotacao_mercado: tool({
      description: "Consulta a cotação atual do dólar e do euro em reais.",
      inputSchema: z.object({}),
      execute: async () => fetchMarket(),
    }),
  };
}

export type AgentHistory = { role: "user" | "assistant"; content: string }[];

export async function runAgent(options: {
  supabase: Client;
  userId: string;
  history: AgentHistory;
  message: string;
  idioma?: "pt" | "en";
}): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

  const lovable = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: {
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
  });

  const result = streamText({
    model: lovable.responses("openai/gpt-5.6-terra"),
    system:
      options.idioma === "en"
        ? `${SYSTEM_PROMPT}

IMPORTANTE: o usuário escolheu o idioma inglês. Responda SEMPRE em inglês simples e acolhedor (US English), mesmo que ele escreva em português. Use "R$" para valores em reais e mantenha as categorias em português apenas nas ferramentas; ao falar com a pessoa, traduza o nome da categoria para o inglês.`
        : SYSTEM_PROMPT,
    messages: [...options.history, { role: "user" as const, content: options.message }],
    tools: buildTools(options.supabase, options.userId),
    stopWhen: stepCountIs(8),
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });

  const text = await result.text;
  return text.trim() || "Desculpe, não consegui responder agora. Pode repetir com outras palavras?";
}
