/**
 * Verifica e aplica a atualização do app (service worker) na hora, a pedido da
 * pessoa. Tudo acontece no navegador; nada é enviado para fora do aparelho.
 */
import { registrarEventoSw } from "@/lib/eventos-sw";

export const CAMINHO_SW = "/sw.js";
export const MARCA_AVISO = "wise-money:avisar-atualizacao";

export type ResultadoAtualizacao =
  | { estado: "atualizando" }
  | { estado: "sem-novidade" }
  | { estado: "sem-suporte" }
  | { estado: "offline" }
  | { estado: "erro"; mensagem: string };

function temSuporte() {
  return typeof window !== "undefined" && "serviceWorker" in navigator;
}

export function estaOffline() {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

/**
 * Procura uma versão nova e, se existir, manda o service worker assumir agora.
 * A página recarrega sozinha quando o novo worker toma o controle.
 */
export async function verificarAtualizacaoAgora(): Promise<ResultadoAtualizacao> {
  if (!temSuporte()) return { estado: "sem-suporte" };
  if (estaOffline()) {
    registrarEventoSw("atualizacao-falhou", "sem conexão");
    return { estado: "offline" };
  }

  try {
    const registro =
      (await navigator.serviceWorker.getRegistration(CAMINHO_SW)) ??
      (await navigator.serviceWorker.register(CAMINHO_SW, { scope: "/", updateViaCache: "none" }));

    await registro.update();

    const pendente = registro.waiting ?? registro.installing;
    if (!pendente) return { estado: "sem-novidade" };

    try {
      window.sessionStorage.setItem(MARCA_AVISO, "1");
    } catch {
      // sem sessionStorage o aviso não aparece, mas a atualização acontece
    }
    registrarEventoSw("atualizacao-detectada", "verificação manual");

    if (registro.waiting) {
      registro.waiting.postMessage("skip-waiting");
    } else {
      pendente.addEventListener("statechange", function () {
        if (this.state === "installed") registro.waiting?.postMessage("skip-waiting");
      });
    }
    return { estado: "atualizando" };
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : String(erro);
    registrarEventoSw("atualizacao-falhou", mensagem);
    return { estado: estaOffline() ? "offline" : "erro", mensagem };
  }
}

/** Executa a função assim que a conexão voltar (uma única vez). */
export function tentarQuandoVoltarConexao(acao: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const uma = () => {
    window.removeEventListener("online", uma);
    acao();
  };
  window.addEventListener("online", uma);
  return () => window.removeEventListener("online", uma);
}

/**
 * Procura uma versão nova SEM aplicar nada. Serve para a checagem em segundo
 * plano, que apenas avisa discretamente quando existe novidade.
 */
export async function procurarNovaVersao(): Promise<boolean> {
  if (!temSuporte() || estaOffline()) return false;
  try {
    const registro = await navigator.serviceWorker.getRegistration(CAMINHO_SW);
    if (!registro) return false;
    await registro.update();
    return !!(registro.waiting ?? registro.installing);
  } catch {
    return false;
  }
}

/** Aplica a versão já baixada e recarrega a tela. */
export async function aplicarVersaoBaixada() {
  if (!temSuporte()) return;
  const registro = await navigator.serviceWorker.getRegistration(CAMINHO_SW);
  if (!registro) return;
  try {
    window.sessionStorage.setItem(MARCA_AVISO, "1");
  } catch {
    // sem sessionStorage o aviso não aparece, mas a atualização acontece
  }
  registrarEventoSw("atualizacao-detectada", "aviso em segundo plano");
  registro.waiting?.postMessage("skip-waiting");
}
