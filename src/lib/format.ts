export type IdiomaFormato = "pt" | "en";

let idiomaAtual: IdiomaFormato = "pt";
/** Quantos reais valem 1 dólar (ex.: 5.42). null = cotação indisponível. */
let cotacaoUsd: number | null = null;

/** Chamado pelo IdiomaProvider para que os formatadores sigam o idioma escolhido. */
export function definirIdiomaFormato(idioma: IdiomaFormato) {
  idiomaAtual = idioma;
}

/** Define a cotação USD/BRL usada para exibir valores em dólar no idioma inglês. */
export function definirCotacaoUsd(valor: number | null) {
  cotacaoUsd = valor && Number.isFinite(valor) && valor > 0 ? valor : null;
}

export function obterCotacaoUsd() {
  return cotacaoUsd;
}

function loc(idioma?: IdiomaFormato) {
  return (idioma ?? idiomaAtual) === "en" ? "en-US" : "pt-BR";
}

/**
 * Valores guardados em reais. Em português exibe R$; em inglês converte pela
 * cotação do dia e exibe US$ ($). Sem cotação, mantém reais (nunca inventa número).
 */
export function brl(valor: number, idioma?: IdiomaFormato) {
  const emIngles = (idioma ?? idiomaAtual) === "en";
  if (emIngles && cotacaoUsd) {
    return (valor / cotacaoUsd).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    });
  }
  return valor.toLocaleString(loc(idioma), {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

/** Nota de rodapé explicando a conversão (só faz sentido em inglês com cotação). */
export function notaConversao(idioma?: IdiomaFormato) {
  if ((idioma ?? idiomaAtual) !== "en" || !cotacaoUsd) return null;
  return `Converted from BRL at today's rate (1 USD = R$ ${cotacaoUsd.toFixed(2)})`;
}

export const moeda = brl;

function partes(iso: string) {
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  return { ano: Number(ano), mes: Number(mes), dia: Number(dia) };
}

function comoData(iso: string) {
  const { ano, mes, dia } = partes(iso);
  return new Date(Date.UTC(ano, mes - 1, dia));
}

/** pt: 26/08/2026 · en: Aug 26, 2026 */
export function dataCurta(iso: string, idioma?: IdiomaFormato) {
  const l = loc(idioma);
  if (l === "pt-BR") {
    const [ano, mes, dia] = iso.slice(0, 10).split("-");
    return `${dia}/${mes}/${ano}`;
  }
  return comoData(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** pt: 26 de agosto · en: August 26 */
export function dataLonga(iso: string, idioma?: IdiomaFormato) {
  return comoData(iso).toLocaleDateString(loc(idioma), {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

/** pt: seg · en: Mon */
export function diaSemanaCurto(iso: string, idioma?: IdiomaFormato) {
  return comoData(iso)
    .toLocaleDateString(loc(idioma), { weekday: "short", timeZone: "UTC" })
    .replace(".", "");
}

/** pt: ago · en: Aug (a partir de uma data ISO) */
export function mesCurto(iso: string, idioma?: IdiomaFormato) {
  return comoData(iso)
    .toLocaleDateString(loc(idioma), { month: "short", timeZone: "UTC" })
    .replace(".", "");
}

export function nomeDoMes(offset = 0, idioma?: IdiomaFormato) {
  const agora = new Date();
  return new Date(agora.getFullYear(), agora.getMonth() + offset, 1).toLocaleDateString(
    loc(idioma),
    { month: "long" },
  );
}

export function numero(valor: number, idioma?: IdiomaFormato) {
  return valor.toLocaleString(loc(idioma), { maximumFractionDigits: 0 });
}

export function porcentagem(valor: number, idioma?: IdiomaFormato) {
  return `${valor.toLocaleString(loc(idioma), { maximumFractionDigits: 0 })}%`;
}

export const CORES_CATEGORIA: Record<string, string> = {
  alimentação: "bg-primary",
  transporte: "bg-accent",
  moradia: "bg-primary-deep",
  "contas fixas": "bg-primary-deep",
  saúde: "bg-destructive",
  lazer: "bg-accent",
  educação: "bg-primary",
  vestuário: "bg-secondary",
  outros: "bg-muted-foreground",
};

export const CATEGORIA_LABEL: Record<string, string> = {
  alimentação: "Food",
  transporte: "Transport",
  moradia: "Housing",
  "contas fixas": "Fixed bills",
  saúde: "Health",
  lazer: "Leisure",
  educação: "Education",
  vestuário: "Clothing",
  outros: "Other",
  salário: "Salary",
  aposentadoria: "Retirement",
  pensão: "Pension",
  "trabalho extra": "Extra work",
  "aluguel recebido": "Rent received",
  venda: "Sale",
  presente: "Gift",
};

export function categoriaLabel(nome: string, idioma?: IdiomaFormato) {
  if ((idioma ?? idiomaAtual) === "pt") return nome;
  return CATEGORIA_LABEL[nome] ?? nome;
}
