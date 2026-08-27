import { describe, expect, it } from "vitest";

import {
  brl,
  definirCotacaoUsd,
  notaConversao,
  CATEGORIA_LABEL,
  categoriaLabel,
  CORES_CATEGORIA,
  dataCurta,
  dataLonga,
  diaSemanaCurto,
  mesCurto,
  numero,
  porcentagem,
} from "./format";

/** Normaliza espaços (Intl usa espaço não-quebrável em alguns locales). */
function normalizar(texto: string) {
  return texto.replace(/\u00a0/g, " ");
}

describe("brl — formatação de moeda", () => {
  it("formata em reais no padrão pt-BR (R$ 1.234,50)", () => {
    expect(normalizar(brl(1234.5, "pt"))).toBe("R$ 1.234,50");
  });

  it("formata em reais no padrão en-US (R$1,234.50)", () => {
    expect(normalizar(brl(1234.5, "en"))).toBe("R$1,234.50");
  });

  it("sempre usa duas casas decimais", () => {
    expect(brl(50, "pt")).toContain("50,00");
    expect(brl(50, "en")).toContain("50.00");
  });

  it("formata valores negativos mantendo o valor absoluto correto", () => {
    expect(brl(-45.9, "pt")).toContain("45,90");
    expect(brl(-45.9, "en")).toContain("45.90");
  });
});

describe("conversão para dólar no idioma inglês", () => {
  it("sem cotação, mantém reais em inglês", () => {
    definirCotacaoUsd(null);
    expect(normalizar(brl(1234.5, "en"))).toBe("R$1,234.50");
    expect(notaConversao("en")).toBeNull();
  });

  it("com cotação, converte e exibe em dólar", () => {
    definirCotacaoUsd(5);
    expect(normalizar(brl(100, "en"))).toBe("$20.00");
    expect(notaConversao("en")).toContain("1 USD = R$ 5.00");
    definirCotacaoUsd(null);
  });

  it("em português continua em reais mesmo com cotação definida", () => {
    definirCotacaoUsd(5);
    expect(normalizar(brl(100, "pt"))).toBe("R$ 100,00");
    expect(notaConversao("pt")).toBeNull();
    definirCotacaoUsd(null);
  });
});

describe("dataCurta", () => {
  it("pt: DD/MM/AAAA", () => {
    expect(dataCurta("2026-08-26", "pt")).toBe("26/08/2026");
  });

  it("en: Aug 26, 2026", () => {
    expect(dataCurta("2026-08-26", "en")).toBe("Aug 26, 2026");
  });
});

describe("dataLonga", () => {
  it("pt: 26 de agosto", () => {
    expect(dataLonga("2026-08-26", "pt")).toBe("26 de agosto");
  });

  it("en: August 26", () => {
    expect(dataLonga("2026-08-26", "en")).toBe("August 26");
  });
});

describe("diaSemanaCurto", () => {
  it("pt: qua (sem ponto final)", () => {
    expect(diaSemanaCurto("2026-08-26", "pt")).toBe("qua");
  });

  it("en: Wed", () => {
    expect(diaSemanaCurto("2026-08-26", "en")).toBe("Wed");
  });
});

describe("mesCurto", () => {
  it("pt: ago (sem ponto final)", () => {
    expect(mesCurto("2026-08-26", "pt")).toBe("ago");
  });

  it("en: Aug", () => {
    expect(mesCurto("2026-08-26", "en")).toBe("Aug");
  });
});

describe("numero e porcentagem", () => {
  it("numero usa separador de milhar do idioma", () => {
    expect(numero(1234, "pt")).toBe("1.234");
    expect(numero(1234, "en")).toBe("1,234");
  });

  it("porcentagem arredonda e adiciona %", () => {
    expect(porcentagem(42.6, "pt")).toBe("43%");
    expect(porcentagem(10, "en")).toBe("10%");
  });
});

describe("categoriaLabel — paridade de traduções", () => {
  it("em pt retorna o nome original", () => {
    expect(categoriaLabel("alimentação", "pt")).toBe("alimentação");
  });

  it("em en retorna a tradução", () => {
    expect(categoriaLabel("alimentação", "en")).toBe("Food");
    expect(categoriaLabel("saúde", "en")).toBe("Health");
  });

  it("em en mantém o nome quando não há tradução", () => {
    expect(categoriaLabel("categoria inventada", "en")).toBe("categoria inventada");
  });

  it("toda categoria com cor definida possui tradução em inglês", () => {
    for (const categoria of Object.keys(CORES_CATEGORIA)) {
      expect(
        CATEGORIA_LABEL[categoria],
        `faltou tradução em inglês para "${categoria}"`,
      ).toBeDefined();
    }
  });
});
