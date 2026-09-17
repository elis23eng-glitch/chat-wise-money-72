import type { SecoesRelatorio } from "@/lib/pdf-report";

export type OpcaoSecaoRelatorio = {
  chave: keyof SecoesRelatorio;
  rotulo: string;
};

/** Indica se existe conteúdo selecionado para gerar o relatório. */
export function temSecaoRelatorio(secoes: SecoesRelatorio): boolean {
  return Object.values(secoes).some(Boolean);
}

/** Retorna os rótulos das seções selecionadas na ordem exibida na interface. */
export function listarSecoesSelecionadas(
  secoes: SecoesRelatorio,
  opcoes: OpcaoSecaoRelatorio[],
): string[] {
  return opcoes.filter((opcao) => secoes[opcao.chave]).map((opcao) => opcao.rotulo);
}
