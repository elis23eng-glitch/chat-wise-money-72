import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { toast } from "sonner";

type Props = {
  onText: (text: string) => void;
  /** Quando informado, o texto reconhecido é enviado direto para a Nina. */
  onAutoSubmit?: (text: string) => void;
  disabled?: boolean;
  idioma?: "pt" | "en";
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

/** Botão de ditado por voz usando a Web Speech API (pt-BR / en-US). */
export function VoiceInputButton({ onText, onAutoSubmit, disabled, idioma = "pt" }: Props) {
  const [gravando, setGravando] = useState(false);
  const [suportado, setSuportado] = useState(false);
  const recRef = useRef<ReconhecimentoVoz | null>(null);
  const cbRef = useRef({ onText, onAutoSubmit });
  cbRef.current = { onText, onAutoSubmit };

  useEffect(() => {
    const w = window as JanelaComVoz;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return;
    setSuportado(true);
    const rec = new SR();
    rec.lang = idioma === "en" ? "en-US" : "pt-BR";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e: ResultadoVoz) => {
      const texto = Array.from(e.results)
        .map((r) => r[0]?.transcript ?? "")
        .join(" ")
        .trim();
      if (!texto) return;
      const { onText: aoTexto, onAutoSubmit: aoEnviar } = cbRef.current;
      if (aoEnviar) {
        aoEnviar(texto);
        toast.success(
          idioma === "en" ? `Sending: "${texto}"` : `Enviando: “${texto}”`,
          { duration: 2500 },
        );
        return;
      }
      aoTexto(texto);
    };
    rec.onerror = (e: { error: string }) => {
      setGravando(false);
      if (e.error === "not-allowed") {
        toast.error(
          idioma === "en"
            ? "I need your permission to use the microphone."
            : "Preciso da sua permissão para usar o microfone.",
        );
      } else if (e.error === "no-speech") {
        toast.info(
          idioma === "en" ? "I didn't hear anything. Try again." : "Não ouvi nada. Tente de novo.",
        );
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
  }, [idioma]);

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
      // Evita que a voz da Nina seja captada pelo microfone.
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      rec.start();
      setGravando(true);
    } catch {
      /* já iniciado */
    }
  }

  const rotulo = gravando
    ? idioma === "en"
      ? "Listening…"
      : "Ouvindo…"
    : idioma === "en"
      ? "Speak"
      : "Falar";

  return (
    <button
      type="button"
      onClick={alternar}
      disabled={disabled}
      aria-label={
        gravando
          ? idioma === "en"
            ? "Stop speaking"
            : "Parar de falar"
          : idioma === "en"
            ? "Speak instead of typing"
            : "Falar em vez de digitar"
      }
      className={`flex items-center gap-2 rounded-full px-5 py-3 text-base font-semibold transition-colors disabled:opacity-50 ${
        gravando
          ? "animate-pulse bg-destructive text-destructive-foreground"
          : "bg-secondary text-secondary-foreground hover:bg-primary/10"
      }`}
    >
      {gravando ? <MicOff className="size-5" /> : <Mic className="size-5" />}
      {rotulo}
    </button>
  );
}
