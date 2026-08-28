import { useServerFn } from "@tanstack/react-start";
import { ImageIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useIdioma } from "@/lib/i18n";
import { urlComprovante } from "@/lib/recibo.functions";

/** Botão que abre a foto da nota guardada junto com a despesa. */
export function VerComprovante({ caminho }: { caminho: string }) {
  const { t } = useIdioma();
  const pegarUrl = useServerFn(urlComprovante);
  const [url, setUrl] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function abrir() {
    setCarregando(true);
    try {
      const r = await pegarUrl({ data: { caminho } });
      setUrl(r.url);
    } catch {
      toast.error(t("Não consegui abrir o comprovante.", "I could not open the receipt."));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label={t("Ver comprovante", "View receipt")}
        title={t("Ver comprovante", "View receipt")}
        onClick={abrir}
        className="grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
      >
        {carregando ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <ImageIcon className="size-5" />
        )}
      </button>

      {url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-4"
          onClick={() => setUrl(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-card p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-xl">{t("Comprovante", "Receipt")}</h2>
            <img
              src={url}
              alt={t("Foto da nota guardada", "Saved receipt photo")}
              className="mt-3 w-full rounded-2xl object-contain"
            />
            <button
              type="button"
              onClick={() => setUrl(null)}
              className="mt-4 min-h-12 w-full rounded-full bg-secondary px-5 font-semibold text-secondary-foreground"
            >
              {t("Fechar", "Close")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
