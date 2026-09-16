import { describe, expect, it } from "vitest";

import type { CategoriaGasto } from "@/lib/categorias";
import {
  LIMIARES_CONFIANCA_PADRAO,
  calcularConfiancaMedia,
  campoIncerto,
  itemDuvidoso,
  listarDiferencasLeitura,
  type ItemRecibo,
} from "@/lib/receipt-review";

function item(parcial: Partial<ItemRecibo> = {}): ItemRecibo {
  return {
    descricao: "Café",
    valor: 12,
    categoria: "Alimentação" as CategoriaGasto,
    data: "2026-09-16",
    estabelecimento: "Padaria",
    hora: "08:30",
    local: null,
    confianca: 0.95,
    campos_incertos: [],
    ...parcial,
  };
}

describe("revisão de comprovantes", () => {
  it("registra somente os campos alterados pelo usuário", () => {
    const diferencas = listarDiferencasLeitura(
      [item()],
      [item({ descricao: "Café e pão", valor: 18 })],
    );

    expect(diferencas).toEqual([
      { item: "Café e pão", campo: "descricao", antes: "Café", depois: "Café e pão" },
      { item: "Café e pão", campo: "valor", antes: "12", depois: "18" },
    ]);
  });

  it("identifica itens adicionados e removidos", () => {
    expect(listarDiferencasLeitura([], [item()])[0]).toMatchObject({
      campo: "item",
      depois: "adicionado",
    });
    expect(listarDiferencasLeitura([item()], [])[0]).toMatchObject({
      campo: "item",
      depois: "removido",
    });
  });

  it("considera duvidosa a confiança abaixo do limite geral", () => {
    expect(itemDuvidoso(item({ confianca: 0.69 }), LIMIARES_CONFIANCA_PADRAO)).toBe(true);
    expect(itemDuvidoso(item({ confianca: 0.9 }), LIMIARES_CONFIANCA_PADRAO)).toBe(false);
  });

  it("respeita o limite específico de cada campo", () => {
    const leitura = item({ confianca: 0.75 });
    expect(campoIncerto(leitura, "valor", LIMIARES_CONFIANCA_PADRAO)).toBe(true);
    expect(campoIncerto(leitura, "categoria", LIMIARES_CONFIANCA_PADRAO)).toBe(false);
  });

  it("mantém campos explicitamente marcados como incertos", () => {
    const leitura = item({ confianca: 1, campos_incertos: ["data"] });
    expect(campoIncerto(leitura, "data", LIMIARES_CONFIANCA_PADRAO)).toBe(true);
  });

  it("calcula a confiança média e trata uma lista vazia como segura", () => {
    expect(calcularConfiancaMedia([item({ confianca: 0.6 }), item({ confianca: 0.8 })])).toBe(0.7);
    expect(calcularConfiancaMedia([])).toBe(1);
  });
});
