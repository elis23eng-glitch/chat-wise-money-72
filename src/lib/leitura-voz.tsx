import { useCallback, useEffect, useRef, useState } from "react";

const CHAVE_AUTO = "wm-leitura-automatica";

function limparTexto(texto: string) {
  return texto
    .replace(/[*_`#>]/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export function suportaVoz() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Vozes femininas mais suaves e naturais, em ordem de preferência. */
const PREFERIDAS_PT = [
  "google português do brasil",
  "luciana",
  "microsoft francisca",
  "francisca",
  "maria",
  "fernanda",
  "vitória",
  "vitoria",
];
const PREFERIDAS_EN = [
  "google us english",
  "samantha",
  "microsoft aria",
  "aria",
  "jenny",
  "ava",
  "allison",
];

function escolherVoz(idioma: "pt" | "en"): SpeechSynthesisVoice | null {
  if (!suportaVoz()) return null;
  const vozes = window.speechSynthesis.getVoices();
  if (!vozes.length) return null;
  const prefixo = idioma === "en" ? "en" : "pt";
  const doIdioma = vozes.filter((v) => v.lang.toLowerCase().startsWith(prefixo));
  const candidatas = doIdioma.length ? doIdioma : vozes;
  const preferidas = idioma === "en" ? PREFERIDAS_EN : PREFERIDAS_PT;

  for (const nome of preferidas) {
    const achada = candidatas.find((v) => v.name.toLowerCase().includes(nome));
    if (achada) return achada;
  }
  const feminina = candidatas.find((v) => /female|mulher|feminina/i.test(v.name));
  return feminina ?? candidatas[0] ?? null;
}

export function useLeituraEmVozAlta(idioma: "pt" | "en") {
  const [falandoId, setFalandoId] = useState<string | null>(null);
  const [autoLeitura, setAutoLeitura] = useState(false);
  const [disponivel, setDisponivel] = useState(false);
  const jaLidos = useRef<Set<string>>(new Set());
  const vozRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    setDisponivel(suportaVoz());
    try {
      setAutoLeitura(localStorage.getItem(CHAVE_AUTO) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!suportaVoz()) return;
    const atualizar = () => {
      vozRef.current = escolherVoz(idioma);
    };
    atualizar();
    window.speechSynthesis.addEventListener("voiceschanged", atualizar);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", atualizar);
  }, [idioma]);

  const parar = useCallback(() => {
    if (!suportaVoz()) return;
    window.speechSynthesis.cancel();
    setFalandoId(null);
  }, []);

  const falar = useCallback(
    (texto: string, id: string) => {
      if (!suportaVoz()) return;
      const conteudo = limparTexto(texto);
      if (!conteudo) return;
      window.speechSynthesis.cancel();

      // Quebra em frases: pausas curtas deixam a leitura mais humana e gentil.
      const frases = conteudo.match(/[^.!?…]+[.!?…]*/g) ?? [conteudo];
      const voz = vozRef.current ?? escolherVoz(idioma);
      vozRef.current = voz;

      setFalandoId(id);
      frases.forEach((frase, i) => {
        const fala = new SpeechSynthesisUtterance(frase.trim());
        fala.lang = idioma === "en" ? "en-US" : "pt-BR";
        if (voz) fala.voice = voz;
        fala.rate = 0.88; // fala calma, boa para idosos
        fala.pitch = 1.12; // tom mais suave e acolhedor
        fala.volume = 1;
        if (i === frases.length - 1) {
          fala.onend = () => setFalandoId(null);
          fala.onerror = () => setFalandoId(null);
        }
        window.speechSynthesis.speak(fala);
      });
    },
    [idioma],
  );

  const alternarAuto = useCallback(() => {
    setAutoLeitura((atual) => {
      const proximo = !atual;
      try {
        localStorage.setItem(CHAVE_AUTO, proximo ? "1" : "0");
      } catch {
        /* ignore */
      }
      if (!proximo && suportaVoz()) window.speechSynthesis.cancel();
      return proximo;
    });
  }, []);

  const marcarComoLido = useCallback((id: string) => {
    jaLidos.current.add(id);
  }, []);

  const foiLido = useCallback((id: string) => jaLidos.current.has(id), []);

  useEffect(() => () => parar(), [parar]);

  return {
    disponivel,
    falandoId,
    falar,
    parar,
    autoLeitura,
    alternarAuto,
    marcarComoLido,
    foiLido,
  };
}
