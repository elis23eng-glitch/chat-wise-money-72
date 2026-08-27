import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

const CHAVE_HASH = "wise-money-build-hash";

async function hashDaPagina(): Promise<string | null> {
  try {
    const res = await fetch("/", { cache: "no-store" });
    const html = await res.text();
    // Os assets do Vite têm hash no nome; o HTML muda a cada publicação.
    let h = 0;
    for (let i = 0; i < html.length; i++) h = (h * 31 + html.charCodeAt(i)) | 0;
    return String(h);
  } catch {
    return null;
  }
}

/**
 * Atualiza os dados quando o usuário volta para o app e recarrega a página
 * automaticamente quando uma nova versão foi publicada (PWA instalado).
 */
export function AutoAtualizacao() {
  const qc = useQueryClient();
  const verificando = useRef(false);

  useEffect(() => {
    const inicial = window.localStorage.getItem(CHAVE_HASH);

    async function aoVoltar() {
      // Sempre atualiza os dados ao abrir/voltar para o app.
      qc.invalidateQueries();

      if (verificando.current) return;
      verificando.current = true;
      try {
        const atual = await hashDaPagina();
        if (!atual) return;
        const salvo = window.localStorage.getItem(CHAVE_HASH);
        if (salvo && salvo !== atual) {
          // Nova versão publicada: recarrega para aplicar as melhorias.
          window.localStorage.setItem(CHAVE_HASH, atual);
          window.location.reload();
          return;
        }
        window.localStorage.setItem(CHAVE_HASH, atual);
      } finally {
        verificando.current = false;
      }
    }

    function onVisibility() {
      if (document.visibilityState === "visible") void aoVoltar();
    }

    // Guarda o hash da versão atual na primeira carga.
    if (!inicial) {
      void hashDaPagina().then((h) => {
        if (h) window.localStorage.setItem(CHAVE_HASH, h);
      });
    }

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onVisibility);
    };
  }, [qc]);

  return null;
}
