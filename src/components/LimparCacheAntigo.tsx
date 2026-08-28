import { useEffect } from "react";

/**
 * Mantém o app instalado sempre atualizado:
 * 1. Remove service workers antigos (de versões anteriores, quando a marca
 *    ainda era outra) e caches que não pertencem à versão atual.
 * 2. Registra o service worker atual, que usa skipWaiting + clients.claim
 *    para assumir o controle imediatamente.
 * 3. Recarrega a página uma única vez quando um novo service worker assume,
 *    para o usuário ver a versão nova sem reinstalar o aplicativo.
 */
const CAMINHO_SW = "/sw.js";

export function LimparCacheAntigo() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    let recarregando = false;
    function aoTrocarControlador() {
      if (recarregando) return;
      recarregando = true;
      window.location.reload();
    }
    navigator.serviceWorker.addEventListener("controllerchange", aoTrocarControlador);

    void (async () => {
      try {
        const registros = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registros
            .filter((r) => {
              const url = r.active?.scriptURL ?? r.waiting?.scriptURL ?? r.installing?.scriptURL;
              return !url || !url.endsWith(CAMINHO_SW);
            })
            .map((r) => r.unregister()),
        );

        if ("caches" in window) {
          const chaves = await caches.keys();
          await Promise.all(
            chaves.filter((c) => !c.startsWith("wise-money-v2")).map((c) => caches.delete(c)),
          );
        }

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
