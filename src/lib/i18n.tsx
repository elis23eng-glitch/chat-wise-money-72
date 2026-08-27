import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { definirIdiomaFormato } from "./format";

export type Idioma = "pt" | "en";

const CHAVE = "mergulho:idioma";

type Contexto = {
  idioma: Idioma;
  definirIdioma: (idioma: Idioma) => void;
  /** t("texto em português", "text in english") */
  t: (pt: string, en: string) => string;
  locale: string;
};

const IdiomaContext = createContext<Contexto | null>(null);

export function IdiomaProvider({ children }: { children: ReactNode }) {
  const [idioma, setIdioma] = useState<Idioma>("pt");

  // Mantém os formatadores de moeda/data alinhados ao idioma antes de renderizar os filhos.
  definirIdiomaFormato(idioma);

  useEffect(() => {
    const salvo = window.localStorage.getItem(CHAVE);
    if (salvo === "en" || salvo === "pt") setIdioma(salvo);
  }, []);

  useEffect(() => {
    document.documentElement.lang = idioma === "pt" ? "pt-BR" : "en";
  }, [idioma]);

  const definirIdioma = useCallback((novo: Idioma) => {
    setIdioma(novo);
    try {
      window.localStorage.setItem(CHAVE, novo);
    } catch {
      /* ignora */
    }
  }, []);

  const t = useCallback((pt: string, en: string) => (idioma === "pt" ? pt : en), [idioma]);

  const valor = useMemo(
    () => ({ idioma, definirIdioma, t, locale: idioma === "pt" ? "pt-BR" : "en-US" }),
    [idioma, definirIdioma, t],
  );

  return <IdiomaContext.Provider value={valor}>{children}</IdiomaContext.Provider>;
}

export function useIdioma(): Contexto {
  const ctx = useContext(IdiomaContext);
  if (ctx) return ctx;
  return {
    idioma: "pt",
    definirIdioma: () => {},
    t: (pt: string) => pt,
    locale: "pt-BR",
  };
}
