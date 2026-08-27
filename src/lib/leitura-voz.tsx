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

export function useLeituraEmVozAlta(idioma: "pt" | "en") {
  const [falandoId, setFalandoId] = useState<string | null>(null);
  const [autoLeitura, setAutoLeitura] = useState(false);
  const [disponivel, setDisponivel] = useState(false);
  const jaLidos = useRef<Set<string>>(new Set());

  useEffect(() => {
    setDisponivel(suportaVoz());
    try {
      setAutoLeitura(localStorage.getItem(CHAVE_AUTO) === "1");
    } catch {
      /* ignore */
    }
  }, []);

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
      const fala = new SpeechSynthesisUtterance(conteudo);
      fala.lang = idioma === "en" ? "en-US" : "pt-BR";
      fala.rate = 0.95;
      fala.onend = () => setFalandoId(null);
      fala.onerror = () => setFalandoId(null);
      setFalandoId(id);
      window.speechSynthesis.speak(fala);
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
