import { Settings2, Volume2 } from "lucide-react";

import { useIdioma } from "@/lib/i18n";
import type { PrefsVoz } from "@/lib/leitura-voz";

type Props = {
  prefs: PrefsVoz;
  salvarPrefs: (novas: Partial<PrefsVoz>) => void;
  testar: (texto: string, id: string) => void;
};

/** Painel simples para escolher a voz da Nina, velocidade e volume. */
export function PainelVoz({ prefs, salvarPrefs, testar }: Props) {
  const { t, idioma } = useIdioma();

  const TIMBRES: { valor: PrefsVoz["timbre"]; rotulo: string }[] = [
    { valor: "shimmer", rotulo: t("Nina suave (recomendada)", "Soft Nina (recommended)") },
    { valor: "nova", rotulo: t("Nina clara", "Bright Nina") },
    { valor: "coral", rotulo: t("Nina calorosa", "Warm Nina") },
    { valor: "alloy", rotulo: t("Nina neutra", "Neutral Nina") },
  ];

  function testarVoz() {
    testar(
      t(
        "Oi! Sou a Nina. Assim que eu falo com você, no seu ritmo.",
        "Hi! I'm Nina. This is how I sound, at your pace.",
      ),
      "teste-voz",
    );
  }

  return (
    <div className="surface-card p-5">
      <p className="flex items-center gap-2 font-display text-lg">
        <Settings2 className="size-5 text-primary" />
        {t("Voz da Nina", "Nina's voice")}
      </p>

      <div className="mt-4 space-y-4">
        <div>
          <p className="text-sm font-semibold">{t("Tipo de voz", "Voice type")}</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => salvarPrefs({ motor: "ia" })}
              aria-pressed={prefs.motor === "ia"}
              className={`rounded-2xl px-3 py-3 text-sm font-semibold transition-colors ${
                prefs.motor === "ia"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-primary/10"
              }`}
            >
              {t("Nina inteligente", "Smart Nina")}
            </button>
            <button
              type="button"
              onClick={() => salvarPrefs({ motor: "aparelho" })}
              aria-pressed={prefs.motor === "aparelho"}
              className={`rounded-2xl px-3 py-3 text-sm font-semibold transition-colors ${
                prefs.motor === "aparelho"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-primary/10"
              }`}
            >
              {t("Voz do celular", "Phone voice")}
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {prefs.motor === "ia"
              ? t(
                  "Voz mais natural, parecida com assistentes de voz. Precisa de internet.",
                  "More natural voice, similar to smart assistants. Needs internet.",
                )
              : t(
                  "Usa a voz instalada no seu aparelho. Funciona sem internet.",
                  "Uses the voice installed on your device. Works offline.",
                )}
          </p>
        </div>

        {prefs.motor === "ia" && (
          <label className="block">
            <span className="text-sm font-semibold">{t("Timbre", "Tone")}</span>
            <select
              value={prefs.timbre}
              onChange={(e) => salvarPrefs({ timbre: e.target.value as PrefsVoz["timbre"] })}
              className="mt-2 w-full rounded-2xl bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground"
            >
              {TIMBRES.map((v) => (
                <option key={v.valor} value={v.valor}>
                  {v.rotulo}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="block">
          <span className="text-sm font-semibold">
            {t("Velocidade", "Speed")}: {prefs.velocidade.toFixed(2)}x
          </span>
          <input
            type="range"
            min={0.6}
            max={1.4}
            step={0.05}
            value={prefs.velocidade}
            onChange={(e) => salvarPrefs({ velocidade: Number(e.target.value) })}
            className="mt-2 w-full accent-[hsl(var(--primary))]"
            aria-label={t("Velocidade da voz", "Voice speed")}
          />
          <span className="flex justify-between text-xs text-muted-foreground">
            <span>{t("Mais devagar", "Slower")}</span>
            <span>{t("Mais rápido", "Faster")}</span>
          </span>
        </label>

        <label className="block">
          <span className="text-sm font-semibold">
            {t("Volume", "Volume")}: {Math.round(prefs.volume * 100)}%
          </span>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={prefs.volume}
            onChange={(e) => salvarPrefs({ volume: Number(e.target.value) })}
            className="mt-2 w-full accent-[hsl(var(--primary))]"
            aria-label={t("Volume da voz", "Voice volume")}
          />
        </label>

        <button
          type="button"
          onClick={testarVoz}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary/10 px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
        >
          <Volume2 className="size-4" />
          {t("Ouvir teste da voz", "Play voice test")}
        </button>

        <p className="text-xs text-muted-foreground">
          {t(
            "Suas preferências ficam salvas neste aparelho.",
            "Your preferences are saved on this device.",
          )}
          {idioma === "en" ? "" : ""}
        </p>
      </div>
    </div>
  );
}
