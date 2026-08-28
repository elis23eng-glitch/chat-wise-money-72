import { useIdioma } from "@/lib/i18n";

type Props = {
  aberto: boolean;
  titulo: string;
  descricao: string;
  carregando?: boolean;
  rotuloConfirmar?: string;
  aoConfirmar: () => void;
  aoCancelar: () => void;
};

/** Confirmação dentro do app (window.confirm é bloqueado em PWA instalada). */
export function ConfirmarExclusao({
  aberto,
  titulo,
  descricao,
  carregando,
  rotuloConfirmar,
  aoConfirmar,
  aoCancelar,
}: Props) {
  const { t } = useIdioma();
  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-foreground/40 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="surface-card w-full max-w-sm p-6 shadow-soft">
        <h2 className="font-display text-2xl">{titulo}</h2>
        <p className="mt-2 text-base text-muted-foreground">{descricao}</p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={aoCancelar}
            className="flex-1 rounded-full border border-input bg-card px-5 py-3 text-base font-semibold transition-colors hover:bg-secondary"
          >
            {t("Cancelar", "Cancel")}
          </button>
          <button
            type="button"
            onClick={aoConfirmar}
            disabled={carregando}
            className="flex-1 rounded-full bg-destructive px-5 py-3 text-base font-semibold text-destructive-foreground transition-colors hover:opacity-90 disabled:opacity-60"
          >
            {carregando
              ? t("Um instante…", "One moment…")
              : (rotuloConfirmar ?? t("Apagar", "Delete"))}
          </button>
        </div>
      </div>
    </div>
  );
}
