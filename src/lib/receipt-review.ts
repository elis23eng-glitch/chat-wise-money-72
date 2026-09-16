import type { CategoriaGasto } from "@/lib/categorias";

export type CampoRecibo =
  "descricao" | "valor" | "categoria" | "data" | "estabelecimento" | "hora" | "local";

export type ItemRecibo = {
  descricao: string;
  valor: number;
  categoria: CategoriaGasto;
  data: string;
  estabelecimento: string | null;
  hora: string | null;
  local: string | null;
  confianca?: number;
  campos_incertos?: CampoRecibo[];
};

export type TentativaLeitura = {
  em: string;
  ajuste: string | null;
  observacao: string;
  itens: ItemRecibo[];
};

export type ResultadoDuplicidade = {
  duplicado: boolean;
  total: number;
  exemplos: {
    id: string;
    descricao: string;
    valor: number;
    data?: string;
    hora: string | null;
  }[];
};

export type RegrasDuplicidade = {
  janelaHoras: number;
  compararValor: boolean;
  compararEstabelecimento: boolean;
  compararDescricao: boolean;
};

export type LimiaresConfianca = {
  geral: number;
  alerta: number;
  valor: number;
  data: number;
  estabelecimento: number;
  categoria: number;
};

export type DiferencaLeitura = {
  item: string;
  campo: string;
  antes: string;
  depois: string;
};

export const REGRAS_DUPLICIDADE_PADRAO: Readonly<RegrasDuplicidade> = {
  janelaHoras: 0,
  compararValor: true,
  compararEstabelecimento: true,
  compararDescricao: false,
};

export const JANELAS_DUPLICIDADE = [0, 1, 3, 6, 12, 24, 72, 168] as const;

export const LIMIARES_CONFIANCA_PADRAO: Readonly<LimiaresConfianca> = {
  geral: 0.7,
  alerta: 0.7,
  valor: 0.8,
  data: 0.7,
  estabelecimento: 0.6,
  categoria: 0.6,
};

const CAMPOS_COMPARADOS: CampoRecibo[] = [
  "descricao",
  "valor",
  "categoria",
  "data",
  "estabelecimento",
  "hora",
];

/** Compara a leitura original do OCR com os itens que serão salvos. */
export function listarDiferencasLeitura(
  antes: ItemRecibo[],
  depois: ItemRecibo[],
): DiferencaLeitura[] {
  const lista: DiferencaLeitura[] = [];
  depois.forEach((itemDepois, indice) => {
    const itemAntes = antes[indice];
    if (!itemAntes) {
      lista.push({
        item: itemDepois.descricao,
        campo: "item",
        antes: "—",
        depois: "adicionado",
      });
      return;
    }
    for (const campo of CAMPOS_COMPARADOS) {
      const valorAntes = String(itemAntes[campo] ?? "");
      const valorDepois = String(itemDepois[campo] ?? "");
      if (valorAntes !== valorDepois) {
        lista.push({
          item: itemDepois.descricao,
          campo,
          antes: valorAntes,
          depois: valorDepois,
        });
      }
    }
  });
  antes.slice(depois.length).forEach((item) => {
    lista.push({ item: item.descricao, campo: "item", antes: "lido", depois: "removido" });
  });
  return lista.slice(0, 200);
}

export function limiarDoCampo(campo: CampoRecibo, limiares: LimiaresConfianca): number {
  if (campo === "valor") return limiares.valor;
  if (campo === "data") return limiares.data;
  if (campo === "estabelecimento") return limiares.estabelecimento;
  if (campo === "categoria") return limiares.categoria;
  return limiares.geral;
}

export function itemDuvidoso(item: ItemRecibo, limiares: LimiaresConfianca): boolean {
  return (item.confianca ?? 1) < limiares.geral || (item.campos_incertos ?? []).length > 0;
}

export function campoIncerto(
  item: ItemRecibo,
  campo: CampoRecibo,
  limiares: LimiaresConfianca,
): boolean {
  return (
    (item.campos_incertos ?? []).includes(campo) ||
    (item.confianca ?? 1) < limiarDoCampo(campo, limiares)
  );
}

export function calcularConfiancaMedia(itens: ItemRecibo[]): number {
  if (itens.length === 0) return 1;
  return itens.reduce((soma, item) => soma + (item.confianca ?? 1), 0) / itens.length;
}
