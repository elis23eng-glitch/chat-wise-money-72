/**
 * Registro de eventos (somente no navegador) sobre a atualização do app.
 * Serve para acompanhar quantas pessoas realmente receberam a versão nova,
 * sem enviar nada para fora do aparelho.
 */
export type TipoEventoSw =
  | "registro-ok"
  | "registro-falhou"
  | "atualizacao-detectada"
  | "atualizacao-aplicada"
  | "atualizacao-falhou"
  | "limpeza-cache-antigo";

export type EventoSw = {
  tipo: TipoEventoSw;
  em: string;
  versao?: string;
  detalhe?: string;
};

const CHAVE = "wise-money:eventos-sw";
const LIMITE = 200;

/** Versão do app usada nos caches e no registro de eventos. */
export const VERSAO_APP = "v3";

export function lerEventosSw(): EventoSw[] {
  if (typeof window === "undefined") return [];
  try {
    const bruto = window.localStorage.getItem(CHAVE);
    const lista: unknown = bruto ? JSON.parse(bruto) : [];
    return Array.isArray(lista) ? (lista as EventoSw[]) : [];
  } catch {
    return [];
  }
}

export function registrarEventoSw(tipo: TipoEventoSw, detalhe?: string) {
  if (typeof window === "undefined") return;
  const evento: EventoSw = {
    tipo,
    em: new Date().toISOString(),
    versao: VERSAO_APP,
    ...(detalhe ? { detalhe } : {}),
  };
  try {
    const lista = [...lerEventosSw(), evento].slice(-LIMITE);
    window.localStorage.setItem(CHAVE, JSON.stringify(lista));
  } catch {
    // armazenamento indisponível: o evento ainda é emitido abaixo
  }
  window.dispatchEvent(new CustomEvent<EventoSw>("wise-money:sw", { detail: evento }));
  if (import.meta.env.DEV) console.info("[sw]", tipo, detalhe ?? "");
}

/** Contagem simples por tipo, útil para acompanhar as atualizações. */
export function resumoEventosSw(): Record<string, number> {
  return lerEventosSw().reduce<Record<string, number>>((acc, e) => {
    acc[e.tipo] = (acc[e.tipo] ?? 0) + 1;
    return acc;
  }, {});
}

export type ResumoPorVersaoData = {
  versao: string;
  data: string;
  sucesso: number;
  erro: number;
};

const TIPOS_ERRO: TipoEventoSw[] = ["registro-falhou", "atualizacao-falhou"];

/**
 * Agrupa os eventos por versão do app e por dia, contando quantas
 * atualizações deram certo e quantas deram erro.
 */
export function resumoPorVersaoData(eventos = lerEventosSw()): ResumoPorVersaoData[] {
  const mapa = new Map<string, ResumoPorVersaoData>();
  for (const evento of eventos) {
    const versao = evento.versao ?? "?";
    const data = (evento.em ?? "").slice(0, 10) || "?";
    const chave = `${versao}|${data}`;
    const atual = mapa.get(chave) ?? { versao, data, sucesso: 0, erro: 0 };
    if (TIPOS_ERRO.includes(evento.tipo)) atual.erro += 1;
    else atual.sucesso += 1;
    mapa.set(chave, atual);
  }
  return [...mapa.values()].sort((a, b) =>
    a.data === b.data ? a.versao.localeCompare(b.versao) : b.data.localeCompare(a.data),
  );
}

export function limparEventosSw() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CHAVE);
  } catch {
    // sem armazenamento não há o que limpar
  }
  window.dispatchEvent(new Event("wise-money:sw"));
}
