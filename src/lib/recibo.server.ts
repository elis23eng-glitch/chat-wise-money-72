import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

import { CATEGORIAS } from "./agent.server";

export const itemReciboSchema = z.object({
  descricao: z.string().max(120),
  valor: z.number().positive(),
  categoria: z.enum(CATEGORIAS),
  data: z.string(),
});

const respostaSchema = z.object({
  estabelecimento: z.string().max(120).nullable(),
  data: z.string().nullable(),
  itens: z.array(itemReciboSchema).max(30),
  observacao: z.string().max(300),
});

export type ItemRecibo = z.infer<typeof itemReciboSchema>;
export type LeituraRecibo = z.infer<typeof respostaSchema>;

const PROMPT = `Você é a Nina, assistente financeira brasileira. Recebe a foto de uma nota fiscal, cupom fiscal, recibo, boleto ou de uma anotação feita à mão numa agenda de papel.

Sua tarefa: extrair as DESPESAS visíveis e devolvê-las prontas para registro.

Regras:
- Use os valores em reais (número, sem símbolo). Converta vírgula decimal corretamente (12,50 -> 12.5).
- Se a nota tiver muitos itens pequenos de supermercado, agrupe em um único lançamento com a descrição do estabelecimento e o valor TOTAL da compra. Nunca some errado.
- Se for uma anotação manual com várias linhas (ex.: "padaria 12, ônibus 8"), crie um lançamento por linha.
- Nunca inclua o total junto dos itens individuais: escolha um dos dois formatos, sem duplicar valores.
- data no formato AAAA-MM-DD. Se a foto não mostrar a data, use a data de hoje informada abaixo.
- categoria deve ser uma das permitidas; na dúvida use "outros".
- descricao curta e clara em linguagem simples (ex.: "Mercado Bom Preço").
- Se a imagem não tiver nenhuma despesa legível, devolva itens vazio e explique com gentileza em observacao.
- observacao: uma frase curta, acolhedora, dizendo o que você entendeu.`;

export async function lerReciboDaImagem(options: {
  imagem: string;
  hoje: string;
  idioma?: "pt" | "en";
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

  const { object } = await generateObject({
    model: lovable("google/gemini-2.5-flash"),
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
            text: `Hoje é ${options.hoje}. Leia a imagem e extraia as despesas.`,
          },
          { type: "image", image: options.imagem },
        ],
      },
    ],
  });

  return object;
}
