import { describe, expect, it } from "vitest";

import {
  listarSecoesSelecionadas,
  temSecaoRelatorio,
  type OpcaoSecaoRelatorio,
} from "@/lib/dashboard-report";
import type { SecoesRelatorio } from "@/lib/pdf-report";

const opcoes: OpcaoSecaoRelatorio[] = [
  { chave: "resumo", rotulo: "Resumo" },
  { chave: "categorias", rotulo: "Categorias" },
  { chave: "metas", rotulo: "Metas" },
  { chave: "alertas", rotulo: "Alertas" },
];

describe("configuração do relatório do painel", () => {
  it("impede a geração quando nenhuma seção está selecionada", () => {
    const secoes: SecoesRelatorio = {
      resumo: false,
      categorias: false,
      metas: false,
      alertas: false,
    };

    expect(temSecaoRelatorio(secoes)).toBe(false);
  });

  it("permite a geração quando ao menos uma seção está selecionada", () => {
    const secoes: SecoesRelatorio = {
      resumo: true,
      categorias: false,
      metas: false,
      alertas: false,
    };

    expect(temSecaoRelatorio(secoes)).toBe(true);
  });

  it("mantém a ordem visual ao listar somente as seções selecionadas", () => {
    const secoes: SecoesRelatorio = {
      resumo: true,
      categorias: false,
      metas: true,
      alertas: true,
    };

    expect(listarSecoesSelecionadas(secoes, opcoes)).toEqual(["Resumo", "Metas", "Alertas"]);
  });
});
