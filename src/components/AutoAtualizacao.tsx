import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

/**
 * Atualiza os dados (gastos, saldo, metas) automaticamente sempre que o
 * usuário abre o app ou volta para a tela — inclusive ao trazer o app do
 * segundo plano. A interface em si já é atualizada a cada publicação pelos
 * cabeçalhos de cache da hospedagem, sem precisar reinstalar o app.
 */
export function AutoAtualizacao() {
  const qc = useQueryClient();

  useEffect(() => {
    function aoVoltar() {
      if (document.visibilityState === "visible") {
        void qc.invalidateQueries();
      }
    }

    document.addEventListener("visibilitychange", aoVoltar);
    window.addEventListener("focus", aoVoltar);
    window.addEventListener("pageshow", aoVoltar);
    return () => {
      document.removeEventListener("visibilitychange", aoVoltar);
      window.removeEventListener("focus", aoVoltar);
      window.removeEventListener("pageshow", aoVoltar);
    };
  }, [qc]);

  return null;
}
