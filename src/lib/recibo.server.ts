import { z } from "zod";

import { CATEGORIAS_GASTO } from "./categorias";

export const CAMPOS_RECIBO = [
  "descricao",
  "valor",
  "categoria",
  "data",
  "estabelecimento",
  "hora",
  "local",
] as const;

export const itemReciboSchema = z.object({
  descricao: z.string().max(120),
  valor: z.number().positive(),
  categoria: z.enum(CATEGORIAS_GASTO),
  data: z.string(),
  estabelecimento: z.string().max(120).nullable(),
  hora: z.string().max(10).nullable(),
  local: z.string().max(160).nullable(),
  confianca: z.coerce.number().min(0).max(1).catch(0.8).default(0.8),
  campos_incertos: z
    .array(z.string())
    .catch([])
    .default([])
    .transform((lista) =>
      lista.filter((c): c is (typeof CAMPOS_RECIBO)[number] =>
        (CAMPOS_RECIBO as readonly string[]).includes(c),
      ),
    ),
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
- confianca: número de 0 a 1 dizendo o quanto você tem certeza da leitura DAQUELE item (1 = perfeitamente legível, 0.4 = bem duvidoso).
- campos_incertos: liste os nomes dos campos daquele item que você teve dificuldade de ler (ex.: ["valor","data"]). Se estiver tudo claro, use [].
- observacao: uma frase curta e acolhedora dizendo o que você entendeu.`;

export async function lerReciboDaImagem(options: {
  imagem: string;
  hoje: string;
  idioma?: "pt" | "en";
  ajuste?: string;
  /** Tipo do arquivo enviado. PDFs vão como documento; o resto como imagem. */
  mime?: string;
  nomeArquivo?: string;
}): Promise<LeituraRecibo> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

  const ajuste = options.ajuste?.trim();
  const sistema =
    options.idioma === "en"
      ? `${PROMPT}\n\nO usuário escolheu inglês: escreva descricao e observacao em inglês simples, mas mantenha a categoria em português.`
      : PROMPT;

  const formato = `Responda SOMENTE com um JSON válido neste formato:
{"estabelecimento": string|null, "data": "AAAA-MM-DD"|null, "hora": "HH:MM"|null, "local": string|null, "observacao": string,
 "itens": [{"descricao": string, "valor": number, "categoria": "${CATEGORIAS_GASTO.join('"|"')}", "data": "AAAA-MM-DD", "estabelecimento": string|null, "hora": string|null, "local": string|null, "confianca": number, "campos_incertos": string[]}]}`;

  const ehPdf =
    options.mime === "application/pdf" || options.imagem.startsWith("data:application/pdf");

  const anexo = ehPdf
    ? {
        type: "file",
        file: {
          filename: options.nomeArquivo || "comprovante.pdf",
          file_data: options.imagem,
        },
      }
    : { type: "image_url", image_url: { url: options.imagem } };

  const resposta = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "Lovable-API-Key": apiKey,
    },
    body: JSON.stringify({
      model: "google/gemini-3.7-flash",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: `${sistema}\n\n${formato}` },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Hoje é ${options.hoje}. Leia ${ehPdf ? "o documento" : "a imagem"} e extraia as despesas.${
                ajuste
                  ? `\n\nA leitura anterior saiu errada. Correções e instruções da pessoa (siga com atenção): ${ajuste}`
                  : ""
              }`,
            },
            anexo,
          ],
        },
      ],
    }),
  });

  if (!resposta.ok) {
    const detalhe = await resposta.text();
    if (resposta.status === 429) throw new Error("Muitas leituras seguidas. Tente em instantes.");
    if (resposta.status === 402) throw new Error("Os créditos de IA acabaram.");
    throw new Error(`Falha ao ler a imagem (${resposta.status}): ${detalhe.slice(0, 200)}`);
  }

  const json = (await resposta.json()) as { choices?: { message?: { content?: string } }[] };
  const texto = json.choices?.[0]?.message?.content ?? "";
  const limpo = texto
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  return respostaSchema.parse(JSON.parse(limpo));
}
