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
  detalhe?: string;
};

const CHAVE = "wise-money:eventos-sw";
const LIMITE = 50;

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
