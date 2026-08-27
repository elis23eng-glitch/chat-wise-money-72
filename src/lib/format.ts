export function brl(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function dataCurta(iso: string) {
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

export function nomeDoMes(offset = 0) {
  const agora = new Date();
  return new Date(agora.getFullYear(), agora.getMonth() + offset, 1).toLocaleDateString("pt-BR", {
    month: "long",
  });
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

export function categoriaLabel(nome: string, idioma: "pt" | "en") {
  if (idioma === "pt") return nome;
  return CATEGORIA_LABEL[nome] ?? nome;
}
