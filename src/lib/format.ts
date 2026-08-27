export type IdiomaFormato = "pt" | "en";

let idiomaAtual: IdiomaFormato = "pt";

/** Chamado pelo IdiomaProvider para que os formatadores sigam o idioma escolhido. */
export function definirIdiomaFormato(idioma: IdiomaFormato) {
  idiomaAtual = idioma;
}

function loc(idioma?: IdiomaFormato) {
  return (idioma ?? idiomaAtual) === "en" ? "en-US" : "pt-BR";
}

/** Valores sempre em reais (a conta da pessoa é no Brasil), formatados no idioma escolhido. */
export function brl(valor: number, idioma?: IdiomaFormato) {
  return valor.toLocaleString(loc(idioma), {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
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
  "alimentação": "bg-primary",
  transporte: "bg-accent",
  moradia: "bg-primary-deep",
  "contas fixas": "bg-primary-deep",
  "saúde": "bg-destructive",
  lazer: "bg-accent",
  "educação": "bg-primary",
  "vestuário": "bg-secondary",
  outros: "bg-muted-foreground",
};

export const CATEGORIA_LABEL: Record<string, string> = {
  "alimentação": "Food",
  transporte: "Transport",
  moradia: "Housing",
  "contas fixas": "Fixed bills",
  "saúde": "Health",
  lazer: "Leisure",
  "educação": "Education",
  "vestuário": "Clothing",
  outros: "Other",
  "salário": "Salary",
  aposentadoria: "Retirement",
  "pensão": "Pension",
  "trabalho extra": "Extra work",
  "aluguel recebido": "Rent received",
  venda: "Sale",
  presente: "Gift",
};

export function categoriaLabel(nome: string, idioma?: IdiomaFormato) {
  if ((idioma ?? idiomaAtual) === "pt") return nome;
  return CATEGORIA_LABEL[nome] ?? nome;
}
