import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useIdioma } from "@/lib/i18n";
import {
  iniciarAtualizacaoPwa,
  ouvirEstadoVersao,
  recarregarAppAgora,
  verificarVersaoPwa,
  type EstadoVersaoPwa,
} from "@/lib/pwa-client";

export function AlertaVersaoApp() {
  const { t } = useIdioma();
  const [estado, setEstado] = useState<EstadoVersaoPwa | null>(null);
  const [recarregando, setRecarregando] = useState(false);

  useEffect(() => {
    const parar = ouvirEstadoVersao(setEstado);
    void iniciarAtualizacaoPwa();
    const aoVoltar = () => {
      if (document.visibilityState === "visible") void verificarVersaoPwa();
    };
    document.addEventListener("visibilitychange", aoVoltar);
    return () => {
      parar();
      document.removeEventListener("visibilitychange", aoVoltar);
    };
  }, []);

  if (!estado?.desatualizado) return null;

  return (
    <div
      role="alert"
      className="fixed inset-x-3 top-3 z-50 mx-auto flex max-w-xl items-center gap-3 rounded-md border border-accent bg-card p-4 shadow-soft"
    >
      <AlertTriangle className="size-5 shrink-0 text-accent-foreground" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{t("Atualização disponível", "Update available")}</p>
        <p className="text-sm text-muted-foreground">
          {t(
            `Seu app está em ${estado.worker ?? estado.instalada}. A versão ${estado.publicada ?? estado.instalada} está pronta.`,
            `Your app is on ${estado.worker ?? estado.instalada}. Version ${estado.publicada ?? estado.instalada} is ready.`,
          )}
        </p>
      </div>
      <Button
        type="button"
        size="sm"
        disabled={recarregando}
        onClick={async () => {
          setRecarregando(true);
          try {
            await recarregarAppAgora();
          } catch {
            setRecarregando(false);
            toast.error(t("Conecte-se à internet para atualizar.", "Connect to the internet to update."));
          }
        }}
      >
        {recarregando ? <Loader2 className="animate-spin" /> : <RefreshCw />}
        {t("Atualizar", "Update")}
      </Button>
    </div>
  );
}