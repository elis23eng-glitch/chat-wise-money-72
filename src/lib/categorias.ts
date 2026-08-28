export const CATEGORIAS_GASTO = [
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

export type CategoriaGasto = (typeof CATEGORIAS_GASTO)[number];

export const CATEGORIA_EN: Record<CategoriaGasto, string> = {
  alimentação: "food",
  transporte: "transport",
  moradia: "housing",
  "contas fixas": "bills",
  saúde: "health",
  lazer: "leisure",
  educação: "education",
  vestuário: "clothing",
  outros: "other",
};
