import { useEffect } from "react";

/**
 * Mantém o app instalado sempre atualizado:
 * 1. Remove service workers e caches antigos (de versões anteriores, quando a
 *    marca ainda era outra).
 * 2. Registra o service worker atual (network-first nas navegações, com
 *    skipWaiting + clients.claim) apenas no app publicado.
 * 3. Recarrega a página uma única vez quando o novo service worker assume,
 *    para o usuário ver a versão nova sem reinstalar o aplicativo.
 */
const CAMINHO_SW = "/sw.js";
const PREFIXO_CACHE = "wise-money-v2";

function podeRegistrar() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return false;
  const sw = new URL(window.location.href).searchParams.get("sw");
  if (sw === "off") return false;
  // "sw=on" existe apenas para o teste automatizado rodar fora de produção.
  if (!import.meta.env.PROD && sw !== "on") return false;
  if (window.self !== window.top) return false;

  const host = window.location.hostname;
  const previews = [
    host.startsWith("id-preview--"),
    host.startsWith("preview--"),
    host === "lovableproject.com" || host.endsWith(".lovableproject.com"),
    host === "lovableproject-dev.com" || host.endsWith(".lovableproject-dev.com"),
    host === "beta.lovable.dev" || host.endsWith(".beta.lovable.dev"),
  ];
  return !previews.some(Boolean);
}

export function LimparCacheAntigo() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const registrar = podeRegistrar();
    let recarregando = false;
    function aoTrocarControlador() {
      if (recarregando) return;
      recarregando = true;
      window.location.reload();
    }
    if (registrar) {
      navigator.serviceWorker.addEventListener("controllerchange", aoTrocarControlador);
    }

    void (async () => {
      try {
        const registros = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registros
            .filter((r) => {
              const url = r.active?.scriptURL ?? r.waiting?.scriptURL ?? r.installing?.scriptURL;
              if (!registrar) return true;
              return !!url && !url.endsWith(CAMINHO_SW);
            })
            .map((r) => r.unregister()),
        );

        if ("caches" in window) {
          const chaves = await caches.keys();
          await Promise.all(
            chaves
              .filter((c) => !registrar || !c.startsWith(PREFIXO_CACHE))
              .map((c) => caches.delete(c)),
          );
        }

        if (!registrar) return;

        const registro = await navigator.serviceWorker.register(CAMINHO_SW, {
          scope: "/",
          updateViaCache: "none",
        });
        await registro.update().catch(() => undefined);
        registro.waiting?.postMessage("skip-waiting");
        registro.addEventListener("updatefound", () => {
          registro.installing?.addEventListener("statechange", function () {
            if (this.state === "installed") registro.waiting?.postMessage("skip-waiting");
          });
        });
      } catch {
        // silencioso: a atualização automática é apenas uma melhoria
      }
    })();

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", aoTrocarControlador);
    };
  }, []);

  return null;
}
