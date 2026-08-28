/** Identificador local do aparelho (não identifica a pessoa, só este navegador). */
const CHAVE = "wise-money-dispositivo";
const CHAVE_INICIO = "wise-money-inicio-sessao";

export function idDoDispositivo(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(CHAVE);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(CHAVE, id);
  }
  return id;
}

export function marcarInicioSessao(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CHAVE_INICIO, String(Date.now()));
}

export function inicioSessao(): number | null {
  if (typeof window === "undefined") return null;
  const bruto = window.localStorage.getItem(CHAVE_INICIO);
  return bruto ? Number(bruto) : null;
}
