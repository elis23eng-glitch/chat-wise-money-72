import { useEffect } from "react";

/**
 * Remove service workers e caches antigos (de versões anteriores do app,
 * quando a marca ainda era outra). Assim, quem já instalou o aplicativo
 * recebe a versão atual ao abrir de novo, sem precisar reinstalar.
 */
const CHAVE = "wise-money:cache-limpo-v1";

export function LimparCacheAntigo() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (localStorage.getItem(CHAVE)) return;
      localStorage.setItem(CHAVE, "1");
    } catch {
      // localStorage indisponível: segue com a limpeza mesmo assim
    }

    void (async () => {
      try {
        if ("serviceWorker" in navigator) {
          const registros = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registros.map((r) => r.unregister()));
        }
        if ("caches" in window) {
          const chaves = await caches.keys();
          await Promise.all(chaves.map((c) => caches.delete(c)));
        }
      } catch {
        // silencioso: limpeza é apenas uma melhoria
      }
    })();
  }, []);

  return null;
}
