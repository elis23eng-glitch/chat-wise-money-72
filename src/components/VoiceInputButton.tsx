import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { toast } from "sonner";

type Props = {
  onText: (text: string) => void;
  disabled?: boolean;
};

/** Tipos mínimos da Web Speech API (ainda não padronizada no TS). */
type ResultadoVoz = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

type ReconhecimentoVoz = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: ResultadoVoz) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type JanelaComVoz = Window & {
  SpeechRecognition?: new () => ReconhecimentoVoz;
  webkitSpeechRecognition?: new () => ReconhecimentoVoz;
};

/** Botão de ditado por voz usando a Web Speech API (pt-BR). */
export function VoiceInputButton({ onText, disabled }: Props) {
  const [gravando, setGravando] = useState(false);
  const [suportado, setSuportado] = useState(false);
  const recRef = useRef<ReconhecimentoVoz | null>(null);

  useEffect(() => {
    const w = window as JanelaComVoz;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return;
    setSuportado(true);
    const rec = new SR();
    rec.lang = "pt-BR";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e: ResultadoVoz) => {
      const texto = Array.from(e.results)
        .map((r) => r[0]?.transcript ?? "")
        .join(" ")
        .trim();
      if (texto) onText(texto);
    };
    rec.onerror = (e: { error: string }) => {
      setGravando(false);
      if (e.error === "not-allowed") {
        toast.error("Preciso da sua permissão para usar o microfone.");
      }
    };
    rec.onend = () => setGravando(false);
    recRef.current = rec;
    return () => {
      try {
        rec.stop();
      } catch {
        /* ignora */
      }
    };
  }, [onText]);

  if (!suportado) return null;

  function alternar() {
    const rec = recRef.current;
    if (!rec) return;
    if (gravando) {
      rec.stop();
      setGravando(false);
      return;
    }
    try {
      rec.start();
      setGravando(true);
    } catch {
      /* já iniciado */
    }
  }

  return (
    <button
      type="button"
      onClick={alternar}
      disabled={disabled}
      aria-label={gravando ? "Parar de falar" : "Falar em vez de digitar"}
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
        gravando
          ? "bg-destructive text-destructive-foreground"
          : "bg-secondary text-secondary-foreground hover:bg-primary/10"
      }`}
    >
      {gravando ? <MicOff className="size-4" /> : <Mic className="size-4" />}
      {gravando ? "Ouvindo…" : "Falar"}
    </button>
  );
}
