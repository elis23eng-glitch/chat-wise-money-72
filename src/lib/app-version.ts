export const VERSAO_APP = "v4";
export const PREFIXO_CACHE_APP = "wise-money";

export function numeroVersao(versao: string | null | undefined) {
  const numero = Number.parseInt(versao?.replace(/\D/g, "") ?? "", 10);
  return Number.isFinite(numero) ? numero : 0;
}