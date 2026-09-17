import { describe, expect, it } from "vitest";

import {
  chaveRecursosMensagem,
  detectarRecursosMensagem,
  possuiRecursoAvancado,
} from "@/lib/message-rendering";

describe("renderização progressiva de mensagens", () => {
  it("mantém mensagens financeiras comuns no renderizador leve", () => {
    const recursos = detectarRecursosMensagem("Você gastou **R$ 35,00** no mercado hoje.");

    expect(recursos).toEqual({ codigo: false, matematica: false, mermaid: false });
    expect(possuiRecursoAvancado(recursos)).toBe(false);
  });

  it("detecta blocos de código com crases ou tils", () => {
    expect(detectarRecursosMensagem("```js\nconst total = 10;\n```").codigo).toBe(true);
    expect(detectarRecursosMensagem("~~~sql\nselect * from expenses;\n~~~").codigo).toBe(true);
  });

  it("detecta fórmulas em bloco e delimitadores LaTeX", () => {
    expect(detectarRecursosMensagem("$$ juros = capital \\times taxa $$").matematica).toBe(true);
    expect(detectarRecursosMensagem("\\[ saldo = receita - despesa \\]").matematica).toBe(true);
  });

  it("identifica diagramas Mermaid como conteúdo avançado", () => {
    const recursos = detectarRecursosMensagem("```mermaid\nflowchart TD\nA-->B\n```");

    expect(recursos).toMatchObject({ codigo: true, mermaid: true });
    expect(possuiRecursoAvancado(recursos)).toBe(true);
  });

  it("gera uma chave estável para reutilizar plugins já carregados", () => {
    expect(chaveRecursosMensagem({ codigo: true, matematica: false, mermaid: true })).toBe("101");
  });
});
