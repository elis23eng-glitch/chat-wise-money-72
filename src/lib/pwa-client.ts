import { PREFIXO_CACHE_APP, VERSAO_APP, numeroVersao } from "@/lib/app-version";

export type EstadoVersaoPwa = {
  instalada: string;
  worker: string | null;
  publicada: string | null;
  desatualizado: boolean;
  verificando: boolean;
};

const EVENTO_VERSAO = "wise-money:versao-pwa";
const MARCA_RECARREGAMENTO = "wise-money:recarregamento-versao";
let atualizacaoRegistrada: ((recarregarPagina?: boolean) => Promise<void>) | null = null;
let inicializacaoPwa: Promise<void> | null = null;

function emitir(estado: EstadoVersaoPwa) {
  window.dispatchEvent(new CustomEvent<EstadoVersaoPwa>(EVENTO_VERSAO, { detail: estado }));
}

function contextoPublicado() {
  if (!import.meta.env.PROD || window.self !== window.top) return false;
  if (new URL(window.location.href).searchParams.get("sw") === "off") return false;
  const host = window.location.hostname;
  return !(
    host.startsWith("id-preview--") ||
    host.startsWith("preview--") ||
    host === "lovableproject.com" ||
    host.endsWith(".lovableproject.com") ||
    host === "lovableproject-dev.com" ||
    host.endsWith(".lovableproject-dev.com") ||
    host === "beta.lovable.dev" ||
    host.endsWith(".beta.lovable.dev")
  );
}

async function removerRegistroEmContextoProtegido() {
  if (!("serviceWorker" in navigator)) return;
  const registros = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    registros
      .filter((registro) => {
        const url = registro.active?.scriptURL ?? registro.waiting?.scriptURL;
        return url?.endsWith("/sw.js");
      })
      .map((registro) => registro.unregister()),
  );
}

async function versaoPublicada() {
  const resposta = await fetch(`/version.json?agora=${Date.now()}`, { cache: "no-store" });
  if (!resposta.ok) return null;
  const dados = (await resposta.json()) as { version?: unknown };
  return typeof dados.version === "string" ? dados.version : null;
}

async function versaoWorker() {
  const controlador = navigator.serviceWorker.controller;
  if (!controlador) return null;
  return new Promise<string | null>((resolve) => {
    const canal = new MessageChannel();
    const limite = window.setTimeout(() => resolve(null), 1500);
    canal.port1.onmessage = (evento: MessageEvent<{ version?: unknown }>) => {
      window.clearTimeout(limite);
      resolve(typeof evento.data?.version === "string" ? evento.data.version : null);
    };
    controlador.postMessage({ type: "GET_VERSION" }, [canal.port2]);
  });
}

export async function verificarVersaoPwa(): Promise<EstadoVersaoPwa> {
  const base: EstadoVersaoPwa = {
    instalada: VERSAO_APP,
    worker: null,
    publicada: null,
    desatualizado: false,
    verificando: true,
  };
  emitir(base);
  if (!("serviceWorker" in navigator) || !navigator.onLine) {
    const estado = { ...base, verificando: false };
    emitir(estado);
    return estado;
  }

  const [publicada, worker] = await Promise.all([
    versaoPublicada().catch(() => null),
    versaoWorker().catch(() => null),
  ]);
  const desatualizado =
    numeroVersao(publicada) > numeroVersao(VERSAO_APP) ||
    (navigator.serviceWorker.controller !== null && worker === null) ||
    (worker !== null && numeroVersao(publicada) > numeroVersao(worker));
  const estado = { ...base, worker, publicada, desatualizado, verificando: false };
  emitir(estado);
  return estado;
}

export async function recarregarAppAgora() {
  if (!navigator.onLine) throw new Error("offline");
  try {
    window.sessionStorage.setItem(MARCA_RECARREGAMENTO, VERSAO_APP);
  } catch {
    // A atualização continua mesmo sem sessionStorage.
  }
  if ("caches" in window) {
    const nomes = await caches.keys();
    await Promise.all(
      nomes.filter((nome) => nome.startsWith(PREFIXO_CACHE_APP)).map((nome) => caches.delete(nome)),
    );
  }
  if (atualizacaoRegistrada) await atualizacaoRegistrada(true);
  else window.location.reload();
}

async function executarInicializacaoPwa() {
  if (!("serviceWorker" in navigator)) return;
  if (!contextoPublicado()) {
    await removerRegistroEmContextoProtegido();
    return;
  }

  const controladorAnterior = navigator.serviceWorker.controller;
  if (controladorAnterior) {
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      () => {
        if (navigator.serviceWorker.controller !== controladorAnterior) window.location.reload();
      },
      { once: true },
    );
  }

  const registro = await navigator.serviceWorker.register("/sw.js", {
    scope: "/",
    updateViaCache: "none",
  });
  atualizacaoRegistrada = async (recarregarPagina = false) => {
    await registro.update();
    if (registro.waiting) {
      registro.waiting.postMessage({ type: "SKIP_WAITING" });
      return;
    }
    if (recarregarPagina) window.location.reload();
  };
  await registro.update();

  const estado = await verificarVersaoPwa();
  const controladorAtual = navigator.serviceWorker.controller?.scriptURL.endsWith("/sw.js");
  if (estado.desatualizado && controladorAtual) await recarregarAppAgora();
}

/**
 * O React executa effects duas vezes em desenvolvimento/StrictMode. Compartilhar
 * a mesma promessa impede duas rotinas concorrentes de remover e registrar o
 * service worker no mesmo escopo durante a migração de versões antigas.
 */
export function iniciarAtualizacaoPwa(): Promise<void> {
  if (!inicializacaoPwa) {
    inicializacaoPwa = executarInicializacaoPwa().catch((erro: unknown) => {
      inicializacaoPwa = null;
      throw erro;
    });
  }
  return inicializacaoPwa;
}

export function ouvirEstadoVersao(acao: (estado: EstadoVersaoPwa) => void) {
  const receber = (evento: Event) => acao((evento as CustomEvent<EstadoVersaoPwa>).detail);
  window.addEventListener(EVENTO_VERSAO, receber);
  return () => window.removeEventListener(EVENTO_VERSAO, receber);
}
