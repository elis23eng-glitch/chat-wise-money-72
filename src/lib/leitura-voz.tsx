import { useCallback, useEffect, useRef, useState } from "react";

const CHAVE_AUTO = "wm-leitura-automatica";
const CHAVE_PREFS = "wm-voz-prefs";

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

/** Saudação da Nina adaptada ao horário do aparelho. */
export function saudacaoNina(idioma: "pt" | "en", agora = new Date()) {
  const h = agora.getHours();
  const parte =
    h < 12
      ? { pt: "Bom dia", en: "Good morning" }
      : h < 18
        ? { pt: "Boa tarde", en: "Good afternoon" }
        : { pt: "Boa noite", en: "Good evening" };

  if (idioma === "en") {
    return `${parte.en}! I'm Nina, your financial companion at Wise Money. I'm here to listen, log your expenses and income, and explain money matters calmly. Tell me about a recent expense or ask for a summary. Let's go at your pace.`;
  }
  return `${parte.pt}! Eu sou a Nina, sua companheira financeira no Wise Money. Estou aqui para ouvir você, anotar seus gastos e entradas, e explicar as coisas do dinheiro com calma. Pode me contar um gasto recente ou pedir um resumo. Vamos juntos, no seu ritmo.`;
}

export type PrefsVoz = {
  /** "ia" = voz da Nina por IA (estilo assistente). "aparelho" = voz padrão do celular. */
  motor: "ia" | "aparelho";
  /** Timbre da voz por IA. */
  timbre: "shimmer" | "nova" | "coral" | "alloy";
  velocidade: number;
  volume: number;
};

export const PREFS_VOZ_PADRAO: PrefsVoz = {
  motor: "ia",
  timbre: "shimmer",
  velocidade: 0.95,
  volume: 0.95,
};

function lerPrefs(): PrefsVoz {
  try {
    const bruto = localStorage.getItem(CHAVE_PREFS);
    if (!bruto) return PREFS_VOZ_PADRAO;
    const p = JSON.parse(bruto) as Partial<PrefsVoz>;
    return {
      motor: p.motor === "aparelho" ? "aparelho" : "ia",
      timbre: (["shimmer", "nova", "coral", "alloy"] as const).includes(p.timbre!)
        ? p.timbre!
        : "shimmer",
      velocidade: Math.min(1.4, Math.max(0.6, Number(p.velocidade) || PREFS_VOZ_PADRAO.velocidade)),
      volume: Math.min(1, Math.max(0.1, Number(p.volume) || PREFS_VOZ_PADRAO.volume)),
    };
  } catch {
    return PREFS_VOZ_PADRAO;
  }
}

export function useLeituraEmVozAlta(idioma: "pt" | "en") {
  const [falandoId, setFalandoId] = useState<string | null>(null);
  const [autoLeitura, setAutoLeitura] = useState(false);
  const [disponivel, setDisponivel] = useState(false);
  const [prefs, definirPrefs] = useState<PrefsVoz>(PREFS_VOZ_PADRAO);
  const jaLidos = useRef<Set<string>>(new Set());
  const vozRef = useRef<SpeechSynthesisVoice | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pedidoRef = useRef(0);
  const prefsRef = useRef<PrefsVoz>(PREFS_VOZ_PADRAO);
  prefsRef.current = prefs;

  useEffect(() => {
    setDisponivel(true);
    try {
      setAutoLeitura(localStorage.getItem(CHAVE_AUTO) === "1");
    } catch {
      /* ignore */
    }
    definirPrefs(lerPrefs());
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
    pedidoRef.current += 1;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (suportaVoz()) window.speechSynthesis.cancel();
    setFalandoId(null);
  }, []);

  /** Fallback local (voz do aparelho) quando a voz por IA não está disponível. */
  const falarLocal = useCallback(
    (conteudo: string, id: string) => {
      if (!suportaVoz()) {
        setFalandoId(null);
        return;
      }
      window.speechSynthesis.cancel();
      const frases = conteudo.match(/[^.!?…]+[.!?…]*/g) ?? [conteudo];
      const voz = vozRef.current ?? escolherVoz(idioma);
      vozRef.current = voz;

      setFalandoId(id);
      frases.forEach((frase, i) => {
        const fala = new SpeechSynthesisUtterance(frase.trim());
        fala.lang = idioma === "en" ? "en-US" : "pt-BR";
        if (voz) fala.voice = voz;
        fala.rate = prefsRef.current.velocidade;
        fala.pitch = 1.05;
        fala.volume = prefsRef.current.volume;
        if (i === frases.length - 1) {
          fala.onend = () => setFalandoId(null);
          fala.onerror = () => setFalandoId(null);
        }
        window.speechSynthesis.speak(fala);
      });
    },
    [idioma],
  );

  const falar = useCallback(
    (texto: string, id: string) => {
      const conteudo = limparTexto(texto);
      if (!conteudo) return;
      parar();
      const pedido = pedidoRef.current;
      setFalandoId(id);
      const atuais = prefsRef.current;

      if (atuais.motor === "aparelho") {
        falarLocal(conteudo, id);
        return;
      }

      void (async () => {
        try {
          const res = await fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: conteudo,
              idioma,
              voice: atuais.timbre,
              speed: atuais.velocidade,
            }),
          });
          if (!res.ok) throw new Error(`TTS ${res.status}`);
          const blob = await res.blob();
          if (pedido !== pedidoRef.current) return;
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audio.volume = atuais.volume;
          audioRef.current = audio;
          const encerrar = () => {
            URL.revokeObjectURL(url);
            if (pedido === pedidoRef.current) setFalandoId(null);
          };
          audio.onended = encerrar;
          audio.onerror = encerrar;
          await audio.play();
        } catch {
          if (pedido !== pedidoRef.current) return;
          falarLocal(conteudo, id);
        }
      })();
    },
    [idioma, parar, falarLocal],
  );

  const salvarPrefs = useCallback((novas: Partial<PrefsVoz>) => {
    definirPrefs((atual) => {
      const proximas = { ...atual, ...novas };
      try {
        localStorage.setItem(CHAVE_PREFS, JSON.stringify(proximas));
      } catch {
        /* ignore */
      }
      return proximas;
    });
  }, []);

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
    prefs,
    salvarPrefs,
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
