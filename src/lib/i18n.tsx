import {
  createContext,
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getMarket } from "./finance.functions";
import { definirCotacaoUsd, definirIdiomaFormato } from "./format";

export type Idioma = "pt" | "en";

const CHAVE = "wise-money:idioma";

type Contexto = {
  idioma: Idioma;
  definirIdioma: (idioma: Idioma) => void;
  /** t("texto em português", "text in english") */
  t: (pt: string, en: string) => string;
  locale: string;
  /** Quantos reais valem 1 dólar; null quando indisponível ou idioma pt. */
  cotacaoUsd: number | null;
};

const IdiomaContext = createContext<Contexto | null>(null);

const CHAVE_COTACAO = "wise-money:cotacao-usd";
const VALIDADE_COTACAO = 30 * 60 * 1000; // 30 minutos

function cotacaoEmCache(): number | null {
  try {
    const bruto = window.localStorage.getItem(CHAVE_COTACAO);
    if (!bruto) return null;
    const { valor, em } = JSON.parse(bruto) as { valor: number; em: number };
    if (!valor || Date.now() - em > VALIDADE_COTACAO) return null;
    return valor;
  } catch {
    return null;
  }
}

export function IdiomaProvider({ children }: { children: ReactNode }) {
  const [idioma, setIdioma] = useState<Idioma>("pt");
  const [cotacao, setCotacao] = useState<number | null>(null);

  // Mantém os formatadores de moeda/data alinhados ao idioma antes de renderizar os filhos.
  definirIdiomaFormato(idioma);
  definirCotacaoUsd(cotacao);

  useEffect(() => {
    const salvo = window.localStorage.getItem(CHAVE);
    if (salvo === "en" || salvo === "pt") setIdioma(salvo);
    setCotacao(cotacaoEmCache());
  }, []);

  // Busca a cotação do dólar só quando o app está em inglês (é quando ela é usada).
  useEffect(() => {
    if (idioma !== "en") return;
    let ativo = true;
    if (cotacaoEmCache()) return;
    getMarket()
      .then((m) => {
        if (!ativo || !m?.dolar) return;
        setCotacao(m.dolar);
        try {
          window.localStorage.setItem(
            CHAVE_COTACAO,
            JSON.stringify({ valor: m.dolar, em: Date.now() }),
          );
        } catch {
          /* ignora */
        }
      })
      .catch(() => {
        /* sem cotação: os valores continuam em reais */
      });
    return () => {
      ativo = false;
    };
  }, [idioma]);

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
    () => ({
      idioma,
      definirIdioma,
      t,
      locale: idioma === "pt" ? "pt-BR" : "en-US",
      cotacaoUsd: cotacao,
    }),
    [idioma, definirIdioma, t, cotacao],
  );

  // A chave força a remontagem ao trocar o idioma ou a cotação: assim valores em
  // memo/cache (moeda, datas) são reformatados, sem sobrar texto antigo.
  return (
    <IdiomaContext.Provider value={valor}>
      <Fragment key={`${idioma}:${cotacao ?? "brl"}`}>{children}</Fragment>
    </IdiomaContext.Provider>
  );
}

export function useIdioma(): Contexto {
  const ctx = useContext(IdiomaContext);
  if (ctx) return ctx;
  return {
    idioma: "pt",
    definirIdioma: () => {},
    t: (pt: string) => pt,
    locale: "pt-BR",
    cotacaoUsd: null,
  };
}
