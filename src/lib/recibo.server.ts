import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

import { CATEGORIAS_GASTO } from "./categorias";

export const itemReciboSchema = z.object({
  descricao: z.string().max(120),
  valor: z.number().positive(),
  categoria: z.enum(CATEGORIAS_GASTO),
  data: z.string(),
  estabelecimento: z.string().max(120).nullable(),
  hora: z.string().max(10).nullable(),
  local: z.string().max(160).nullable(),
});

const respostaSchema = z.object({
  estabelecimento: z.string().max(120).nullable(),
  data: z.string().nullable(),
  hora: z.string().max(10).nullable(),
  local: z.string().max(160).nullable(),
  itens: z.array(itemReciboSchema).max(40),
  observacao: z.string().max(300),
});

export type ItemRecibo = z.infer<typeof itemReciboSchema>;
export type LeituraRecibo = z.infer<typeof respostaSchema>;

const PROMPT = `Você é a Nina, assistente financeira brasileira. Recebe a foto de uma nota fiscal, cupom fiscal, recibo, boleto ou de uma anotação feita à mão numa agenda de papel.

Sua tarefa: extrair TODAS as despesas visíveis e devolvê-las prontas para registro.

Regras:
- Uma foto pode conter VÁRIAS despesas. Crie um lançamento para CADA item/produto/serviço com valor próprio que estiver legível.
- Não devolva o total da nota como um lançamento à parte quando já listou os itens: isso duplicaria valores. Só use um lançamento único com o total quando os itens individuais não estiverem legíveis.
- Se for uma anotação manual com várias linhas (ex.: "padaria 12, ônibus 8"), crie um lançamento por linha.
- Valores em reais como número (12,50 -> 12.5). Multiplique quantidade x preço unitário quando a linha mostrar os dois.
- data no formato AAAA-MM-DD. Sem data na foto, use a data de hoje informada abaixo.
- hora no formato HH:MM quando aparecer no cupom; senão null.
- estabelecimento: nome da loja/empresa da nota; local: endereço, bairro ou cidade impressos. Se não aparecerem, null.
- Repita estabelecimento, hora e local em cada item extraído da mesma nota.
- categoria deve ser uma das permitidas; na dúvida use "outros".
- descricao curta e clara (ex.: "Arroz 5kg — Mercado Bom Preço").
- Se nada estiver legível, devolva itens vazio e explique com gentileza em observacao.
- observacao: uma frase curta e acolhedora dizendo o que você entendeu.`;

export async function lerReciboDaImagem(options: {
  imagem: string;
  hoje: string;
  idioma?: "pt" | "en";
  ajuste?: string;
}): Promise<LeituraRecibo> {
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

  const ajuste = options.ajuste?.trim();

  const { object } = await generateObject({
    model: lovable.chat("google/gemini-3.7-flash"),
    schema: respostaSchema,
    system:
      options.idioma === "en"
        ? `${PROMPT}\n\nO usuário escolheu inglês: escreva descricao e observacao em inglês simples, mas mantenha a categoria em português.`
        : PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Hoje é ${options.hoje}. Leia a imagem e extraia as despesas.${
              ajuste
                ? `\n\nA leitura anterior saiu errada. Correções e instruções da pessoa (siga com atenção): ${ajuste}`
                : ""
            }`,
          },
          { type: "file", mediaType: "image/jpeg", data: options.imagem },
        ],
      },
    ],
  });

  return object;
}
