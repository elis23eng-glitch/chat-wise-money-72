import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { useIdioma } from "@/lib/i18n";

const LIMITE = 80;

export function PullToRefresh() {
  const qc = useQueryClient();
  const { t } = useIdioma();
  const [distancia, setDistancia] = useState(0);
  const [atualizando, setAtualizando] = useState(false);
  const inicioY = useRef<number | null>(null);

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY <= 0 && !atualizando) {
        inicioY.current = e.touches[0]?.clientY ?? null;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (inicioY.current === null || atualizando) return;
      const delta = (e.touches[0]?.clientY ?? 0) - inicioY.current;
      if (delta > 0 && window.scrollY <= 0) {
        setDistancia(Math.min(delta * 0.5, LIMITE * 1.5));
      }
    };

    const onTouchEnd = async () => {
      if (inicioY.current === null) return;
      const puxou = distancia >= LIMITE;
      inicioY.current = null;
      setDistancia(0);
      if (!puxou || atualizando) return;

      setAtualizando(true);
      try {
        await Promise.all([
          qc.refetchQueries({ queryKey: ["overview"], type: "all" }),
          qc.refetchQueries({ queryKey: ["dashboard"], type: "all" }),
          qc.refetchQueries({ queryKey: ["mensagens"], type: "all" }),
          qc.refetchQueries({ queryKey: ["alertas-historico"], type: "all" }),
        ]);
        toast.success(t("Dados atualizados!", "Data updated!"));
      } catch {
        toast.error(
          t(
            "Não consegui atualizar agora. Verifique sua internet e tente de novo.",
            "Could not refresh now. Check your connection and try again.",
          ),
        );
      } finally {
        setAtualizando(false);
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [atualizando, distancia, qc, t]);

  const visivel = distancia > 8 || atualizando;
  if (!visivel) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-2 z-[90] flex justify-center transition-opacity"
      style={{ opacity: visivel ? 1 : 0 }}
      aria-hidden="true"
    >
      <div
        className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-primary shadow-lg"
        style={{ transform: `translateY(${atualizando ? 0 : Math.min(distancia - 30, 24)}px)` }}
      >
        <RefreshCw
          className="size-4"
          style={{
            animation: atualizando ? "spin 1s linear infinite" : undefined,
            transform: atualizando ? undefined : `rotate(${distancia * 3}deg)`,
          }}
        />
        {atualizando
          ? t("Atualizando…", "Refreshing…")
          : distancia >= LIMITE
            ? t("Solte para atualizar", "Release to refresh")
            : t("Puxe para atualizar", "Pull to refresh")}
      </div>
    </div>
  );
}
