import { Languages } from "lucide-react";

import { useIdioma, type Idioma } from "@/lib/i18n";

const OPCOES: { valor: Idioma; rotulo: string; titulo: string }[] = [
  { valor: "pt", rotulo: "PT", titulo: "Português (Brasil)" },
  { valor: "en", rotulo: "EN", titulo: "English" },
];

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { idioma, definirIdioma, t } = useIdioma();

  return (
    <div
      className={`flex items-center gap-1 rounded-full bg-secondary p-1 ${className}`}
      role="group"
      aria-label={t("Escolher idioma", "Choose language")}
    >
      <Languages className="ml-1.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
      {OPCOES.map((o) => (
        <button
          key={o.valor}
          type="button"
          onClick={() => definirIdioma(o.valor)}
          title={o.titulo}
          aria-pressed={idioma === o.valor}
          className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
            idioma === o.valor
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-primary"
          }`}
        >
          {o.rotulo}
        </button>
      ))}
    </div>
  );
}
