import { useEffect } from "react";
import { toast } from "sonner";

import { useIdioma } from "@/lib/i18n";
import { registrarEventoSw } from "@/lib/eventos-sw";

/**
 * Mantém o app instalado sempre atualizado:
 * 1. Remove service workers e caches antigos (de versões anteriores, quando a
 *    marca ainda era outra).
 * 2. Registra o service worker atual (network-first nas navegações, com
 *    skipWaiting + clients.claim) apenas no app publicado.
 * 3. Recarrega a página uma única vez quando o novo service worker assume e
 *    avisa a pessoa que o app foi atualizado (nome corrigido para Wise Money).
 */
const CAMINHO_SW = "/sw.js";
const PREFIXO_CACHE = "wise-money-v2";
const MARCA_AVISO = "wise-money:avisar-atualizacao";

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
  const { t } = useIdioma();

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    // Aviso após a recarga automática feita pelo novo service worker.
    try {
      if (window.sessionStorage.getItem(MARCA_AVISO)) {
        window.sessionStorage.removeItem(MARCA_AVISO);
        registrarEventoSw("atualizacao-aplicada");
        toast.success(
          t("App atualizado para o Wise Money", "App updated to Wise Money"),
          {
            description: t(
              "O nome antigo foi corrigido e você já está na versão mais nova — não precisa reinstalar.",
              "The old name is gone and you are on the newest version — no need to reinstall.",
            ),
            duration: 8000,
          },
        );
      }
    } catch {
      // sessionStorage indisponível: seguimos sem o aviso
    }

    const registrar = podeRegistrar();
    let recarregando = false;
    function aoTrocarControlador() {
      if (recarregando) return;
      recarregando = true;
      registrarEventoSw("atualizacao-detectada");
      try {
        window.sessionStorage.setItem(MARCA_AVISO, "1");
      } catch {
        // sem sessionStorage o aviso não aparece, mas a atualização acontece
      }
      window.location.reload();
    }
    if (registrar) {
      navigator.serviceWorker.addEventListener("controllerchange", aoTrocarControlador);
    }

    void (async () => {
      try {
        const registros = await navigator.serviceWorker.getRegistrations();
        const antigos = registros.filter((r) => {
          const url = r.active?.scriptURL ?? r.waiting?.scriptURL ?? r.installing?.scriptURL;
          if (!registrar) return true;
          return !!url && !url.endsWith(CAMINHO_SW);
        });
        await Promise.all(antigos.map((r) => r.unregister()));

        let cachesRemovidos = 0;
        if ("caches" in window) {
          const chaves = await caches.keys();
          const antigas = chaves.filter((c) => !registrar || !c.startsWith(PREFIXO_CACHE));
          cachesRemovidos = antigas.length;
          await Promise.all(antigas.map((c) => caches.delete(c)));
        }
        if (antigos.length || cachesRemovidos) {
          registrarEventoSw(
            "limpeza-cache-antigo",
            `workers:${antigos.length} caches:${cachesRemovidos}`,
          );
        }

        if (!registrar) return;

        const registro = await navigator.serviceWorker.register(CAMINHO_SW, {
          scope: "/",
          updateViaCache: "none",
        });
        registrarEventoSw("registro-ok");
        await registro.update().catch(() => undefined);
        registro.waiting?.postMessage("skip-waiting");
        registro.addEventListener("updatefound", () => {
          registro.installing?.addEventListener("statechange", function () {
            if (this.state === "installed") registro.waiting?.postMessage("skip-waiting");
            if (this.state === "redundant") registrarEventoSw("atualizacao-falhou");
          });
        });
      } catch (erro) {
        registrarEventoSw(
          "registro-falhou",
          erro instanceof Error ? erro.message : String(erro),
        );
      }
    })();

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", aoTrocarControlador);
    };
  }, [t]);

  return null;
}
