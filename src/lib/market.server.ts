export type MarketSnapshot = {
  dolar: number | null;
  variacaoPct: number | null;
  euro: number | null;
  atualizadoEm: string;
};

type AwesomeApiQuote = {
  bid?: string;
  pctChange?: string;
};

export async function fetchMarket(): Promise<MarketSnapshot> {
  const fallback: MarketSnapshot = {
    dolar: null,
    variacaoPct: null,
    euro: null,
    atualizadoEm: new Date().toISOString(),
  };

  try {
    const res = await fetch("https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL");
    if (!res.ok) return fallback;
    const json = (await res.json()) as Record<string, AwesomeApiQuote>;
    const usd = json["USDBRL"];
    const eur = json["EURBRL"];
    return {
      dolar: usd?.bid ? Number(usd.bid) : null,
      variacaoPct: usd?.pctChange ? Number(usd.pctChange) : null,
      euro: eur?.bid ? Number(eur.bid) : null,
      atualizadoEm: new Date().toISOString(),
    };
  } catch {
    return fallback;
  }
}
