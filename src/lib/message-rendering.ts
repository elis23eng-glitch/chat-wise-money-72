export type RecursosMensagem = {
  codigo: boolean;
  matematica: boolean;
  mermaid: boolean;
};

const BLOCO_CODIGO = /(?:^|\n)\s*(?:```|~~~)/m;
const BLOCO_MERMAID = /(?:^|\n)\s*(?:```|~~~)\s*mermaid\b/im;
const BLOCO_MATEMATICA = /\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)/;

/** Identifica recursos que exigem renderizadores grandes antes de baixá-los. */
export function detectarRecursosMensagem(conteudo: string): RecursosMensagem {
  const mermaid = BLOCO_MERMAID.test(conteudo);
  return {
    codigo: BLOCO_CODIGO.test(conteudo),
    matematica: BLOCO_MATEMATICA.test(conteudo),
    mermaid,
  };
}

export function possuiRecursoAvancado(recursos: RecursosMensagem): boolean {
  return recursos.codigo || recursos.matematica || recursos.mermaid;
}

export function chaveRecursosMensagem(recursos: RecursosMensagem): string {
  return `${Number(recursos.codigo)}${Number(recursos.matematica)}${Number(recursos.mermaid)}`;
}
